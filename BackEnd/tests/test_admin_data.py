import json
import os
import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.admin import (
    AdminActor,
    EssayCreate,
    EssayUpdate,
    _infer_severity,
    _integration_status,
    cloudwatch_logs,
    create_essay,
    essay_detail,
    list_essays,
    require_admin,
    require_admin_write,
    soft_delete_essay,
    trigger_embedding_regeneration,
    update_essay,
)
from database.create import AdminAuditLog, Base, Essay, EssayEmbedding, OpenAIUsageEvent
from database.essays import audit_log, import_essays_from_jsonl, load_essays_from_db, query_essays, summarize_usage, utcnow


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
        self.assertNotIn("sk-secret", encoded)
        self.assertNotIn("password", encoded)

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

        queued = trigger_embedding_regeneration(essay_id, db=self.db, actor=actor)
        self.assertEqual(queued["essay"]["embedding_status"], "queued")
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


if __name__ == "__main__":
    unittest.main()
