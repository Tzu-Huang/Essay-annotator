import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
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
    list_essays,
    require_admin,
    require_admin_write,
    restore_essay,
    soft_delete_essay,
    trigger_embedding_regeneration,
    update_essay,
)
from database.create import AdminAuditLog, Base, Essay, EssayEmbedding, OpenAIUsageEvent
from database.essays import (
    audit_log,
    content_hash,
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


if __name__ == "__main__":
    unittest.main()
