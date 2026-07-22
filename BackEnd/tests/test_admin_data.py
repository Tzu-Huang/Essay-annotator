import asyncio
import io
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import HTTPException, UploadFile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.admin import (
    AdminActor,
    EssayCreate,
    EssayUpdate,
    _fetch_openai_costs,
    _infer_severity,
    _integration_status,
    cloudwatch_logs,
    create_essay,
    essay_detail,
    hard_delete_essay,
    import_new_essays,
    list_essays,
    regenerate_stale_embeddings,
    require_admin,
    require_admin_write,
    restore_essay,
    soft_delete_essay,
    trigger_embedding_regeneration,
    update_essay,
    upload_essay_drafts,
)
from database.create import AdminAuditLog, Base, Essay, EssayEmbedding, OpenAIUsageEvent
from database.essays import (
    audit_log,
    backfill_current_embedding_status,
    content_hash,
    daily_request_counts,
    essay_to_dict,
    import_essays_from_jsonl,
    load_essays_from_db,
    query_essays,
    summarize_usage,
    utcnow,
)


class AdminDataTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        self.Session = sessionmaker(bind=engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        os.environ.pop("ADMIN_EMAILS", None)
        os.environ.pop("ADMIN_WRITE_EMAILS", None)

    def write_jsonl(self, records):
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".jsonl", delete=False)
        with handle:
            for record in records:
                if isinstance(record, str):
                    handle.write(record + "\n")
                else:
                    handle.write(json.dumps(record) + "\n")
        return Path(handle.name)

    def test_import_essays_validates_and_skips_duplicates(self):
        path = self.write_jsonl(
            [
                {"id": "essay_0001", "topic": "Prompt", "content": "Essay body", "type": "Personal Statement"},
                {"id": "essay_0001", "topic": "Prompt", "content": "Essay body", "type": "Personal Statement"},
                {"id": "essay_0002", "topic": "", "content": "Missing topic"},
                "{bad json",
            ]
        )

        result = import_essays_from_jsonl(self.db, path)
        self.db.commit()

        self.assertEqual(result.seen, 4)
        self.assertEqual(result.created, 1)
        self.assertEqual(result.skipped_duplicates, 1)
        self.assertEqual(result.invalid, 2)
        self.assertIn("essay_0001", load_essays_from_db(self.db))

    def test_import_essays_merges_generated_title_into_metadata_json(self):
        path = self.write_jsonl(
            [
                {
                    "id": "essay_0001",
                    "topic": "Prompt",
                    "content": "Essay body",
                    "type": "Personal Statement",
                    "generated_title": "A Great Title",
                },
            ]
        )

        import_essays_from_jsonl(self.db, path)
        self.db.commit()

        essay = self.db.query(Essay).filter_by(id="essay_0001").first()
        self.assertEqual(essay.metadata_json, {"generated_title": "A Great Title"})

    def test_import_essays_preserves_existing_metadata_when_merging_generated_title(self):
        path = self.write_jsonl(
            [
                {
                    "id": "essay_0001",
                    "topic": "Prompt",
                    "content": "Essay body",
                    "metadata": {"custom": "value"},
                    "generated_title": "A Great Title",
                },
            ]
        )

        import_essays_from_jsonl(self.db, path)
        self.db.commit()

        essay = self.db.query(Essay).filter_by(id="essay_0001").first()
        self.assertEqual(
            essay.metadata_json,
            {"custom": "value", "generated_title": "A Great Title"},
        )

    def test_essay_to_dict_flattens_generated_title_from_metadata_json(self):
        essay = Essay(
            id="essay_0099",
            topic="Prompt",
            content="Body",
            metadata_json={"generated_title": "Existing Title", "other": "value"},
        )

        result = essay_to_dict(essay)

        self.assertEqual(result["generated_title"], "Existing Title")
        self.assertEqual(result["metadata"], {"generated_title": "Existing Title", "other": "value"})

    def test_essay_to_dict_generated_title_is_none_without_metadata(self):
        essay = Essay(id="essay_0100", topic="Prompt", content="Body", metadata_json=None)

        result = essay_to_dict(essay)

        self.assertIsNone(result["generated_title"])

    def test_admin_allowlist_and_write_role(self):
        os.environ["ADMIN_EMAILS"] = "owner@example.com,viewer@example.com"
        os.environ["ADMIN_WRITE_EMAILS"] = "owner@example.com"

        owner = require_admin("owner@example.com")
        viewer = require_admin("viewer@example.com")

        self.assertTrue(owner.can_write)
        self.assertFalse(viewer.can_write)
        self.assertEqual(require_admin_write(owner), owner)
        with self.assertRaises(Exception):
            require_admin_write(viewer)
        with self.assertRaises(Exception):
            require_admin("stranger@example.com")

    def test_admin_wildcard_allows_local_development_access(self):
        os.environ["ADMIN_EMAILS"] = "*"
        os.environ["ADMIN_WRITE_EMAILS"] = "*"

        actor = require_admin("anyone@example.com")

        self.assertEqual(actor.email, "anyone@example.com")
        self.assertTrue(actor.can_write)
        self.assertEqual(require_admin_write(actor), actor)

    def test_integration_status_masks_secret_values(self):
        os.environ["ADMIN_EMAILS"] = "owner@example.com"
        os.environ["OPENAI_API_KEY"] = "sk-secret"
        os.environ["POSTGRES_URL"] = "postgresql://user:password@example/db"

        status = _integration_status()
        encoded = json.dumps(status)

        self.assertIn("openai_api", status)
        self.assertFalse(status["openai_usage"]["configured"])
        self.assertNotIn("sk-secret", encoded)
        self.assertNotIn("password", encoded)

    def test_openai_costs_requires_admin_key(self):
        os.environ["OPENAI_API_KEY"] = "sk-project-key"
        os.environ.pop("OPENAI_ADMIN_API_KEY", None)

        response = _fetch_openai_costs(utcnow(), utcnow())

        self.assertFalse(response["configured"])
        self.assertIn("OPENAI_ADMIN_API_KEY", response["error"])

    def test_audit_log_records_before_after(self):
        audit_log(
            self.db,
            actor_email="owner@example.com",
            action="update",
            entity_type="essay",
            entity_id="essay_0001",
            before={"topic": "old"},
            after={"topic": "new"},
        )
        self.db.commit()

        row = self.db.query(AdminAuditLog).one()
        self.assertEqual(row.actor_email, "owner@example.com")
        self.assertEqual(row.before_json["topic"], "old")
        self.assertEqual(row.after_json["topic"], "new")

    def test_query_essays_filters_and_excludes_soft_deleted_by_default(self):
        active = Essay(
            id="essay_0001",
            topic="Active Prompt",
            content="Active content",
            type="Personal Statement",
            school="Stanford",
            public=True,
            embedding_status="stale",
        )
        deleted = Essay(
            id="essay_0002",
            topic="Deleted Prompt",
            content="Deleted content",
            type="Supplemental",
            school="Harvard",
            public=False,
            embedding_status="current",
            deleted_at=utcnow(),
        )
        self.db.add_all([active, deleted])
        self.db.commit()

        self.assertEqual(query_essays(self.db).count(), 1)
        self.assertEqual(query_essays(self.db, include_deleted=True).count(), 2)
        self.assertEqual(query_essays(self.db, school="Stanford").one().id, "essay_0001")
        self.assertEqual(query_essays(self.db, embedding_status="current", include_deleted=True).one().id, "essay_0002")

    def test_backfill_current_embedding_status_marks_essays_present_in_embed_jsonl(self):
        present_in_index = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="stale")
        not_in_index = Essay(id="essay_0002", topic="T2", content="C2", embedding_status="stale")
        already_current = Essay(id="essay_0003", topic="T3", content="C3", embedding_status="current")
        self.db.add_all([present_in_index, not_in_index, already_current])
        self.db.commit()
        embed_path = self.write_jsonl([{"parent_id": "essay_0001", "id": "essay_0001_00"}])

        updated = backfill_current_embedding_status(self.db, embed_path)
        self.db.commit()

        self.assertEqual(updated, 1)
        self.db.refresh(present_in_index)
        self.db.refresh(not_in_index)
        self.assertEqual(present_in_index.embedding_status, "current")
        self.assertEqual(not_in_index.embedding_status, "stale")

    def test_backfill_current_embedding_status_keys_off_embed_jsonl_not_essay_embedding_table(self):
        # Regression test for the production gap this backfill was rewritten to fix:
        # essays embedded via the legacy embedding/make_embedding.py script have no
        # EssayEmbedding row at all, only an embed.jsonl entry -- so an essay with an
        # EssayEmbedding row but absent from embed.jsonl must NOT be marked current,
        # proving the source of truth really changed.
        essay = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="stale")
        self.db.add(essay)
        self.db.add(
            EssayEmbedding(
                essay_id="essay_0001",
                model="text-embedding-3-small",
                content_embedding=[[0.1]],
                content_hash="hash1",
            )
        )
        self.db.commit()
        embed_path = self.write_jsonl([])

        updated = backfill_current_embedding_status(self.db, embed_path)

        self.assertEqual(updated, 0)
        self.db.refresh(essay)
        self.assertEqual(essay.embedding_status, "stale")

    def test_backfill_current_embedding_status_is_idempotent(self):
        essay = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="stale")
        self.db.add(essay)
        self.db.commit()
        embed_path = self.write_jsonl([{"parent_id": "essay_0001", "id": "essay_0001_00"}])

        first_run = backfill_current_embedding_status(self.db, embed_path)
        self.db.commit()
        second_run = backfill_current_embedding_status(self.db, embed_path)
        self.db.commit()

        self.assertEqual(first_run, 1)
        self.assertEqual(second_run, 0)

    def test_backfill_current_embedding_status_handles_missing_embed_file(self):
        essay = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="stale")
        self.db.add(essay)
        self.db.commit()

        updated = backfill_current_embedding_status(self.db, Path("/nonexistent/embed.jsonl"))

        self.assertEqual(updated, 0)

    def test_admin_essay_crud_and_embedding_queue(self):
        actor = AdminActor(email="owner@example.com", can_write=True)

        created = create_essay(
            EssayCreate(topic="Prompt", content="Essay body", type="Personal Statement", school="Stanford"),
            db=self.db,
            actor=actor,
        )
        essay_id = created["essay"]["id"]

        listed = list_essays(page=1, page_size=25, db=self.db, actor=actor)
        self.assertEqual(listed["total"], 1)
        self.assertEqual(listed["items"][0]["id"], essay_id)

        detail = essay_detail(essay_id, db=self.db, actor=actor)
        self.assertEqual(detail["essay"]["topic"], "Prompt")

        updated = update_essay(
            essay_id,
            EssayUpdate(content="Updated essay body"),
            db=self.db,
            actor=actor,
        )
        self.assertEqual(updated["essay"]["content"], "Updated essay body")
        self.assertEqual(updated["essay"]["embedding_status"], "stale")

        fake_client = MagicMock()
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2])]
        fake_client.embeddings.create.return_value = fake_response
        scratch_embed_path = self.write_jsonl([])
        with patch("app.admin.get_embedding_client", return_value=fake_client), patch(
            "app.admin._embed_jsonl_path", return_value=scratch_embed_path
        ):
            regenerated = trigger_embedding_regeneration(essay_id, db=self.db, actor=actor)
        self.assertEqual(regenerated["essay"]["embedding_status"], "current")
        self.assertEqual(self.db.query(EssayEmbedding).count(), 1)

        deleted = soft_delete_essay(essay_id, db=self.db, actor=actor)
        self.assertIsNotNone(deleted["essay"]["deleted_at"])
        self.assertEqual(list_essays(page=1, page_size=25, db=self.db, actor=actor)["total"], 0)
        self.assertEqual(list_essays(page=1, page_size=25, db=self.db, actor=actor, include_deleted=True)["total"], 1)

    def test_summarize_usage_groups_by_feature_model_and_status(self):
        self.db.add_all(
            [
                OpenAIUsageEvent(feature="compare", model="gpt-test", input_tokens=10, output_tokens=20, status="success"),
                OpenAIUsageEvent(feature="compare", model="gpt-test", input_tokens=5, output_tokens=7, status="success"),
                OpenAIUsageEvent(feature="search", model="embed-test", input_tokens=3, output_tokens=0, status="failed"),
            ]
        )
        self.db.commit()

        summary = summarize_usage(self.db)
        compare = next(row for row in summary if row["feature"] == "compare")
        search = next(row for row in summary if row["feature"] == "search")

        self.assertEqual(compare["requests"], 2)
        self.assertEqual(compare["input_tokens"], 15)
        self.assertEqual(compare["output_tokens"], 27)
        self.assertEqual(search["status"], "failed")

    def test_daily_request_counts_buckets_by_day_and_feature(self):
        base = datetime(2026, 7, 15, tzinfo=timezone.utc)
        self.db.add_all(
            [
                OpenAIUsageEvent(feature="search", created_at=base.replace(hour=1)),
                OpenAIUsageEvent(feature="search", created_at=base.replace(hour=14)),
                OpenAIUsageEvent(feature="compare", created_at=base + timedelta(days=1)),
            ]
        )
        self.db.commit()

        result = daily_request_counts(self.db, base - timedelta(days=1), base + timedelta(days=2))

        self.assertEqual(
            result,
            [
                {"date": "2026-07-15", "requests": 2, "by_feature": {"search": 2}},
                {"date": "2026-07-16", "requests": 1, "by_feature": {"compare": 1}},
            ],
        )

    def test_daily_request_counts_respects_range_filter(self):
        base = datetime(2026, 7, 15, tzinfo=timezone.utc)
        self.db.add(OpenAIUsageEvent(feature="search", created_at=base))
        self.db.commit()

        result = daily_request_counts(self.db, base + timedelta(days=1), base + timedelta(days=2))

        self.assertEqual(result, [])

    def test_cloudwatch_missing_config_and_severity_mapping(self):
        os.environ.pop("AWS_REGION", None)
        os.environ.pop("AWS_CLOUDWATCH_LOG_GROUP", None)
        actor = AdminActor(email="owner@example.com", can_write=True)

        response = cloudwatch_logs(start_minutes_ago=60, query=None, severity=None, limit=100, actor=actor)

        self.assertFalse(response["configured"])
        self.assertEqual(response["items"], [])
        self.assertEqual(_infer_severity("ERROR traceback"), "error")
        self.assertEqual(_infer_severity("warn something"), "warn")
        self.assertEqual(_infer_severity("startup ok"), "info")

    def test_list_essays_server_side_sort(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        create_essay(EssayCreate(topic="Zebra", content="B", type="PS", school="Alpha U"), db=self.db, actor=actor)
        create_essay(EssayCreate(topic="Apple", content="A", type="PS", school="Zeta U"), db=self.db, actor=actor)

        asc = list_essays(page=1, page_size=25, sort="topic", sort_dir="asc", db=self.db, actor=actor)
        self.assertEqual([e["topic"] for e in asc["items"]], ["Apple", "Zebra"])

        desc = list_essays(page=1, page_size=25, sort="school", sort_dir="desc", db=self.db, actor=actor)
        self.assertEqual([e["school"] for e in desc["items"]], ["Zeta U", "Alpha U"])

    def test_restore_essay(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]
        soft_delete_essay(essay_id, db=self.db, actor=actor)

        restored = restore_essay(essay_id, db=self.db, actor=actor)
        self.assertIsNone(restored["essay"]["deleted_at"])

        log = self.db.query(AdminAuditLog).filter_by(action="restore", entity_id=essay_id).first()
        self.assertIsNotNone(log)

        with self.assertRaises(Exception):
            restore_essay("does-not-exist", db=self.db, actor=actor)

    def test_update_blocks_soft_deleted_essay(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]
        soft_delete_essay(essay_id, db=self.db, actor=actor)

        with self.assertRaises(HTTPException) as ctx:
            update_essay(essay_id, EssayUpdate(topic="New"), db=self.db, actor=actor)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_regenerate_embedding_live_marks_current(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]

        fake_client = MagicMock()
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2])]
        fake_client.embeddings.create.return_value = fake_response

        # Route embed.jsonl writes to a scratch file instead of the real
        # drive_data/embed_output/embed.jsonl — that file backs the running
        # dev server's in-memory search index and must not be mutated by tests.
        scratch_embed_path = self.write_jsonl([])
        with patch("app.admin.get_embedding_client", return_value=fake_client), patch(
            "app.admin._embed_jsonl_path", return_value=scratch_embed_path
        ):
            result = trigger_embedding_regeneration(essay_id, db=self.db, actor=actor)

        self.assertEqual(result["essay"]["embedding_status"], "current")
        row = self.db.query(EssayEmbedding).filter_by(essay_id=essay_id).first()
        self.assertIsNotNone(row.generated_at)

    def test_regenerate_embedding_short_circuits_when_already_current(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]
        essay = self.db.query(Essay).filter_by(id=essay_id).first()
        essay.embedding_status = "current"
        self.db.add(EssayEmbedding(essay_id=essay_id, model="text-embedding-3-small", content_hash=content_hash(essay.topic, essay.content)))
        self.db.commit()

        fake_client = MagicMock()
        with patch("app.admin.get_embedding_client", return_value=fake_client):
            trigger_embedding_regeneration(essay_id, db=self.db, actor=actor)

        fake_client.embeddings.create.assert_not_called()

    def test_regenerate_embedding_failure_leaves_status_untouched(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]

        fake_client = MagicMock()
        fake_client.embeddings.create.side_effect = RuntimeError("rate limited")

        with patch("app.admin.get_embedding_client", return_value=fake_client):
            with self.assertRaises(HTTPException) as ctx:
                trigger_embedding_regeneration(essay_id, db=self.db, actor=actor)
        self.assertEqual(ctx.exception.status_code, 502)

        essay = self.db.query(Essay).filter_by(id=essay_id).first()
        self.assertEqual(essay.embedding_status, "stale")  # unchanged from create_essay default
        self.assertIsNone(self.db.query(AdminAuditLog).filter_by(action="regenerate_embedding").first())

    @patch("app.admin.get_embedding_client")
    @patch("app.admin.embed_essay")
    @patch("app.admin.replace_parent_id")
    @patch("app.admin._current_app_data")
    def test_regenerate_stale_embeddings_processes_only_stale_non_deleted_essays(
        self, mock_app_data, mock_replace_parent_id, mock_embed_essay, mock_client
    ):
        stale = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="stale")
        current = Essay(id="essay_0002", topic="T2", content="C2", embedding_status="current")
        deleted_stale = Essay(
            id="essay_0003", topic="T3", content="C3", embedding_status="stale",
            deleted_at=utcnow(),
        )
        self.db.add_all([stale, current, deleted_stale])
        self.db.commit()

        mock_embed_essay.return_value = [
            {
                "id": "essay_0001-0", "parent_id": "essay_0001", "content": "C1",
                "topic": "T1", "type": None, "school": None,
                "topic_embedding": [0.1], "content_embedding": [0.1],
            }
        ]
        mock_app_data.return_value = MagicMock()

        actor = AdminActor(email="owner@example.com", can_write=True)
        result = regenerate_stale_embeddings(db=self.db, actor=actor)

        self.assertEqual(result["attempted"], 1)
        self.assertEqual(result["succeeded"], 1)
        self.assertEqual(result["failed"], 0)
        mock_embed_essay.assert_called_once()
        self.db.refresh(stale)
        self.assertEqual(stale.embedding_status, "current")

        audit_row = (
            self.db.query(AdminAuditLog)
            .filter_by(action="regenerate_stale_embeddings")
            .first()
        )
        self.assertIsNotNone(audit_row)
        self.assertEqual(audit_row.after_json["succeeded"], 1)

    def test_regenerate_stale_embeddings_returns_zeroes_when_nothing_is_stale(self):
        essay = Essay(id="essay_0001", topic="T1", content="C1", embedding_status="current")
        self.db.add(essay)
        self.db.commit()

        actor = AdminActor(email="owner@example.com", can_write=True)
        result = regenerate_stale_embeddings(db=self.db, actor=actor)

        self.assertEqual(result, {"attempted": 0, "succeeded": 0, "failed": 0})

    def test_hard_delete_requires_prior_soft_delete(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]
        with self.assertRaises(HTTPException) as ctx:
            hard_delete_essay(essay_id, db=self.db, actor=actor)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_hard_delete_removes_essay_and_embeddings(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        created = create_essay(EssayCreate(topic="T", content="C", type="PS", school="S"), db=self.db, actor=actor)
        essay_id = created["essay"]["id"]
        self.db.add(EssayEmbedding(essay_id=essay_id, model="text-embedding-3-small", content_hash="h"))
        self.db.commit()
        soft_delete_essay(essay_id, db=self.db, actor=actor)

        # Route embed.jsonl writes to a scratch file instead of the real
        # drive_data/embed_output/embed.jsonl — that file backs the running
        # dev server's in-memory search index and must not be mutated by tests.
        scratch_embed_path = self.write_jsonl([])
        with patch("app.admin._embed_jsonl_path", return_value=scratch_embed_path):
            result = hard_delete_essay(essay_id, db=self.db, actor=actor)

        self.assertTrue(result["deleted"])
        self.assertIsNone(self.db.query(Essay).filter_by(id=essay_id).first())
        self.assertEqual(self.db.query(EssayEmbedding).filter_by(essay_id=essay_id).count(), 0)
        log = self.db.query(AdminAuditLog).filter_by(action="hard_delete", entity_id=essay_id).first()
        self.assertIsNotNone(log)
        self.assertIn("content", log.before_json)  # full snapshot retained per approved design

    # -- import-new-essays -------------------------------------------------
    #
    # SAFETY: every test below patches all three real paths this endpoint can
    # touch -- app.admin.scan_and_title_new_essays (so BackEnd/drive_data/
    # organized_data/new_input/ is never scanned/moved), app.admin.
    # DATABASE_JSONL_PATH (so BackEnd/drive_data/finalized_data_jsonl/
    # database.jsonl is never read or appended to), and app.admin.
    # _embed_jsonl_path (so BackEnd/drive_data/embed_output/embed.jsonl,
    # which the running dev server loads into memory at startup, is never
    # written to). Scratch files come from self.write_jsonl(), matching the
    # pattern already used by the regenerate-embedding/hard-delete tests above.

    def test_import_new_essays_rejects_concurrent_run(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        import app.admin as admin_module

        # Simulate a concurrent request already holding the real
        # threading.Lock, so this call must be rejected non-blockingly with
        # a 409 instead of blocking until the lock frees up.
        admin_module._import_lock.acquire()
        try:
            with self.assertRaises(HTTPException) as ctx:
                import_new_essays(db=self.db, actor=actor)
            self.assertEqual(ctx.exception.status_code, 409)
        finally:
            admin_module._import_lock.release()

    def test_import_new_essays_happy_path(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        fake_essay = {
            "id": "essay_9001", "topic": "T", "content": "C", "type": "PS",
            "school": "S", "public": False, "source_file": "manual", "generated_title": "T",
        }
        fake_client = MagicMock()
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2])]
        fake_client.embeddings.create.return_value = fake_response

        # Scratch stand-ins for database.jsonl and embed.jsonl -- never the
        # real repo files. Both start empty; append_to_database_jsonl (not
        # mocked) writes the scanned essay into the scratch database path,
        # and import_essays_from_jsonl then reads it back from that same
        # scratch path, never touching the real one.
        scratch_database_path = self.write_jsonl([])
        scratch_embed_path = self.write_jsonl([])

        with patch("app.admin.scan_and_title_new_essays", return_value=[fake_essay]), \
             patch("app.admin.get_embedding_client", return_value=fake_client), \
             patch("app.admin.DATABASE_JSONL_PATH", scratch_database_path), \
             patch("app.admin._embed_jsonl_path", return_value=scratch_embed_path):
            result = import_new_essays(db=self.db, actor=actor)

        self.assertEqual(result["created"], 1)
        self.assertGreaterEqual(result["embedded"], 1)
        essay = self.db.query(Essay).filter_by(id="essay_9001").first()
        self.assertIsNotNone(essay)
        self.assertFalse(essay.public)  # imports default to public=False
        self.assertEqual(essay.embedding_status, "current")

    def test_import_new_essays_does_not_embed_unrelated_stale_essays(self):
        """An essay that was made stale by an earlier, unrelated PATCH must
        not be swept up and re-embedded by a later import call -- only
        essays this call actually just created should be embedded."""
        actor = AdminActor(email="owner@example.com", can_write=True)

        preexisting = Essay(
            id="essay_8001",
            topic="Preexisting",
            content="Unrelated stale essay edited before this import ran",
            type="PS",
            school="S",
            public=False,
            source_file="manual",
            embedding_status="stale",
        )
        self.db.add(preexisting)
        self.db.commit()

        fake_essay = {
            "id": "essay_9003", "topic": "T", "content": "C", "type": "PS",
            "school": "S", "public": False, "source_file": "manual", "generated_title": "T",
        }
        fake_client = MagicMock()
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2])]
        fake_client.embeddings.create.return_value = fake_response

        scratch_database_path = self.write_jsonl([])
        scratch_embed_path = self.write_jsonl([])

        with patch("app.admin.scan_and_title_new_essays", return_value=[fake_essay]), \
             patch("app.admin.get_embedding_client", return_value=fake_client), \
             patch("app.admin.DATABASE_JSONL_PATH", scratch_database_path), \
             patch("app.admin._embed_jsonl_path", return_value=scratch_embed_path):
            result = import_new_essays(db=self.db, actor=actor)

        self.assertEqual(result["created"], 1)
        self.assertEqual(result["embedded"], 1, "only the newly-imported essay should be embedded")

        imported = self.db.query(Essay).filter_by(id="essay_9003").first()
        self.assertEqual(imported.embedding_status, "current")

        still_stale = self.db.query(Essay).filter_by(id="essay_8001").first()
        self.assertEqual(
            still_stale.embedding_status,
            "stale",
            "unrelated pre-existing stale essay must be left untouched by this import",
        )

    def test_import_new_essays_overrides_public_true_to_false(self):
        """Test that imported essays with public=True are forced to public=False."""
        actor = AdminActor(email="owner@example.com", can_write=True)
        # Fixture with public=True (malicious or accidental from upstream)
        fake_essay = {
            "id": "essay_9002", "topic": "T", "content": "C", "type": "PS",
            "school": "S", "public": True, "source_file": "drive", "generated_title": "T",
        }
        fake_client = MagicMock()
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2])]
        fake_client.embeddings.create.return_value = fake_response

        scratch_database_path = self.write_jsonl([])
        scratch_embed_path = self.write_jsonl([])

        with patch("app.admin.scan_and_title_new_essays", return_value=[fake_essay]), \
             patch("app.admin.get_embedding_client", return_value=fake_client), \
             patch("app.admin.DATABASE_JSONL_PATH", scratch_database_path), \
             patch("app.admin._embed_jsonl_path", return_value=scratch_embed_path):
            result = import_new_essays(db=self.db, actor=actor)

        self.assertEqual(result["created"], 1)
        essay = self.db.query(Essay).filter_by(id="essay_9002").first()
        self.assertIsNotNone(essay)
        self.assertFalse(essay.public, "Imported essay with public=True must be forced to public=False")

    def _upload_file(self, filename: str, content: bytes) -> UploadFile:
        return UploadFile(io.BytesIO(content), filename=filename)

    def _extraction_client(self, topic: str, content: str):
        client = MagicMock()
        response = MagicMock()
        response.choices = [MagicMock(message=MagicMock(content=json.dumps({"topic": topic, "content": content})))]
        client.chat.completions.create.return_value = response
        return client

    def test_upload_drafts_extracts_txt_file_and_writes_no_essay_rows(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        upload = self._upload_file("essay1.txt", b"Prompt: Describe a challenge.\n\nI once faced...")
        client = self._extraction_client("Describe a challenge.", "I once faced...")

        with patch("app.admin.get_embedding_client", return_value=client):
            result = asyncio.run(
                upload_essay_drafts(
                    files=[upload],
                    file_meta=json.dumps({"essay1.txt": {"type": "Personal Statement", "school": "Duke"}}),
                    db=self.db,
                    actor=actor,
                )
            )

        self.assertEqual(len(result["drafts"]), 1)
        draft = result["drafts"][0]
        self.assertEqual(draft["filename"], "essay1.txt")
        self.assertEqual(draft["topic"], "Describe a challenge.")
        self.assertEqual(draft["content"], "I once faced...")
        self.assertEqual(draft["type"], "Personal Statement")
        self.assertEqual(draft["school"], "Duke")
        self.assertFalse(draft["public"])
        self.assertIsNone(draft["extraction_warning"])
        self.assertEqual(result["failed"], [])
        self.assertEqual(self.db.query(Essay).count(), 0)  # pure extraction, no DB rows created

    def test_upload_drafts_missing_prompt_sets_warning_but_still_creates_draft(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        upload = self._upload_file("essay2.txt", b"Just essay text, no prompt anywhere.")
        client = self._extraction_client("", "Just essay text, no prompt anywhere.")

        with patch("app.admin.get_embedding_client", return_value=client):
            result = asyncio.run(
                upload_essay_drafts(
                    files=[upload],
                    file_meta=json.dumps({"essay2.txt": {"type": "", "school": ""}}),
                    db=self.db,
                    actor=actor,
                )
            )

        self.assertEqual(len(result["drafts"]), 1)
        draft = result["drafts"][0]
        self.assertEqual(draft["topic"], "")
        self.assertIsNotNone(draft["extraction_warning"])

    def test_upload_drafts_unsupported_file_reported_in_failed_others_still_succeed(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        good_upload = self._upload_file("essay3.txt", b"Prompt: X\n\nBody text.")
        bad_upload = self._upload_file("photo.png", b"not text at all")
        client = self._extraction_client("X", "Body text.")

        with patch("app.admin.get_embedding_client", return_value=client):
            result = asyncio.run(
                upload_essay_drafts(
                    files=[good_upload, bad_upload],
                    file_meta=json.dumps(
                        {"essay3.txt": {"type": "", "school": ""}, "photo.png": {"type": "", "school": ""}}
                    ),
                    db=self.db,
                    actor=actor,
                )
            )

        self.assertEqual(len(result["drafts"]), 1)
        self.assertEqual(result["drafts"][0]["filename"], "essay3.txt")
        self.assertEqual(len(result["failed"]), 1)
        self.assertEqual(result["failed"][0]["filename"], "photo.png")
        self.assertIn("Unsupported", result["failed"][0]["error"])

    def test_upload_drafts_extraction_llm_failure_reported_in_failed(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        upload = self._upload_file("essay4.txt", b"Some essay text here.")
        client = MagicMock()
        client.chat.completions.create.side_effect = RuntimeError("OpenAI is down")

        with patch("app.admin.get_embedding_client", return_value=client):
            result = asyncio.run(
                upload_essay_drafts(
                    files=[upload],
                    file_meta=json.dumps({"essay4.txt": {"type": "", "school": ""}}),
                    db=self.db,
                    actor=actor,
                )
            )

        self.assertEqual(result["drafts"], [])
        self.assertEqual(len(result["failed"]), 1)
        self.assertEqual(result["failed"][0]["filename"], "essay4.txt")

    def test_upload_drafts_records_openai_usage_for_every_extraction_attempt(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        ok_upload = self._upload_file("ok.txt", b"Prompt: X\n\nBody.")
        fail_upload = self._upload_file("fail.txt", b"Some text.")

        ok_response = MagicMock()
        ok_response.choices = [MagicMock(message=MagicMock(content=json.dumps({"topic": "X", "content": "Body."})))]

        client = MagicMock()
        client.chat.completions.create.side_effect = [ok_response, RuntimeError("boom")]

        with patch("app.admin.get_embedding_client", return_value=client):
            asyncio.run(
                upload_essay_drafts(
                    files=[ok_upload, fail_upload],
                    file_meta=json.dumps(
                        {"ok.txt": {"type": "", "school": ""}, "fail.txt": {"type": "", "school": ""}}
                    ),
                    db=self.db,
                    actor=actor,
                )
            )

        events = self.db.query(OpenAIUsageEvent).filter_by(feature="essay_extraction").all()
        self.assertEqual(len(events), 2)
        statuses = sorted(event.status for event in events)
        self.assertEqual(statuses, ["failed", "success"])

    def test_upload_drafts_rejects_invalid_file_meta_json(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        upload = self._upload_file("essay.txt", b"text")

        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(upload_essay_drafts(files=[upload], file_meta="not json", db=self.db, actor=actor))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_import_new_essays_partial_embedding_failure_leaves_that_essay_stale(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        fake_essay_ok = {
            "id": "essay_9101", "topic": "T1", "content": "C1", "type": "PS",
            "school": "S", "public": False, "source_file": "manual",
        }
        fake_essay_fail = {
            "id": "essay_9102", "topic": "T2", "content": "C2", "type": "PS",
            "school": "S", "public": False, "source_file": "manual",
        }

        def fake_embed_essay(essay_dict, client):
            if essay_dict["id"] == "essay_9102":
                raise RuntimeError("rate limited")
            return [
                {
                    "parent_id": essay_dict["id"],
                    "id": f"{essay_dict['id']}_00",
                    "topic": essay_dict["topic"],
                    "content": essay_dict["content"],
                    "type": essay_dict["type"],
                    "school": essay_dict["school"],
                    "topic_embedding": [0.1, 0.2],
                    "content_embedding": [0.3, 0.4],
                }
            ]

        scratch_database_path = self.write_jsonl([])
        scratch_embed_path = self.write_jsonl([])

        with patch("app.admin.scan_and_title_new_essays", return_value=[fake_essay_ok, fake_essay_fail]), \
             patch("app.admin.get_embedding_client", return_value=MagicMock()), \
             patch("app.admin.embed_essay", side_effect=fake_embed_essay), \
             patch("app.admin.DATABASE_JSONL_PATH", scratch_database_path), \
             patch("app.admin._embed_jsonl_path", return_value=scratch_embed_path):
            result = import_new_essays(db=self.db, actor=actor)

        self.assertEqual(result["created"], 2)
        self.assertEqual(result["embedded"], 1)

        ok_essay = self.db.query(Essay).filter_by(id="essay_9101").first()
        failed_essay = self.db.query(Essay).filter_by(id="essay_9102").first()
        self.assertEqual(ok_essay.embedding_status, "current")
        self.assertEqual(failed_essay.embedding_status, "stale")

    def test_import_new_essays_releases_lock_on_failure(self):
        actor = AdminActor(email="owner@example.com", can_write=True)
        import app.admin as admin_module

        with patch("app.admin.scan_and_title_new_essays", side_effect=RuntimeError("scan blew up")), \
             patch("app.admin.get_embedding_client", return_value=MagicMock()):
            with self.assertRaises(RuntimeError):
                import_new_essays(db=self.db, actor=actor)

        self.assertFalse(admin_module._import_lock.locked())

        # A subsequent call must not be rejected by a lock left stuck by the
        # failure above.
        with patch("app.admin.scan_and_title_new_essays", return_value=[]), \
             patch("app.admin.get_embedding_client", return_value=MagicMock()):
            result = import_new_essays(db=self.db, actor=actor)
        self.assertEqual(result, {"created": 0, "skipped_duplicates": 0, "invalid": 0, "embedded": 0})


if __name__ == "__main__":
    unittest.main()
