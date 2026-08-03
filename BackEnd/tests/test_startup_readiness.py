import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import main
from database.create import Base, Essay


class StartupReadinessTests(unittest.TestCase):
    def test_real_lifespan_initializes_health_and_readiness(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            engine = create_engine(
                f"sqlite:///{temp_path / 'startup.db'}",
                connect_args={"check_same_thread": False},
            )
            isolated_session = sessionmaker(bind=engine)

            def create_isolated_tables():
                Base.metadata.create_all(bind=engine)

            create_isolated_tables()
            with isolated_session() as db:
                db.add(
                    Essay(
                        id="essay-1",
                        topic="A real fixture topic",
                        content="A real fixture essay body.",
                        type="personal",
                        school="Example University",
                        public=True,
                    )
                )
                db.commit()

            embedding_path = temp_path / "embed.jsonl"
            embedding_path.write_text(
                json.dumps(
                    {
                        "id": "chunk-1",
                        "parent_id": "essay-1",
                        "topic": "A real fixture topic",
                        "content": "A real fixture essay body.",
                        "topic_embedding": [1.0, 0.0],
                        "content_embedding": [0.0, 1.0],
                    }
                )
                + "\n",
                encoding="utf-8",
            )

            with (
                patch.object(main, "create_tables", create_isolated_tables),
                patch.object(main, "SessionLocal", isolated_session),
                patch.object(main, "DB_JSONL", temp_path / "unused-database.jsonl"),
                patch.object(main, "EMBED_JSONL", embedding_path),
                TestClient(main.app) as client,
            ):
                health = client.get("/api/health")
                ready = client.get("/api/ready")
                runtime_data = main.app.state.data

            engine.dispose()

        self.assertEqual(health.status_code, 200)
        self.assertTrue(health.json()["ready"])
        self.assertEqual(health.json()["essay_count"], 1)
        self.assertEqual(health.json()["data_path"], "postgres")
        self.assertEqual(ready.status_code, 200)
        self.assertEqual(ready.json(), {"status": "ready", "essay_count": 1})
        self.assertEqual(runtime_data.essays["essay-1"]["topic"], "A real fixture topic")
        self.assertEqual(runtime_data.ids, ["chunk-1"])
        self.assertEqual(runtime_data.parent, ["essay-1"])
        self.assertEqual(runtime_data.topic_V.shape, (1, 2))
        self.assertEqual(runtime_data.content_V.shape, (1, 2))

    def test_real_lifespan_exposes_startup_failure_as_not_ready(self):
        with (
            patch.object(main, "create_tables", side_effect=RuntimeError("isolated startup failure")),
            TestClient(main.app) as client,
        ):
            health = client.get("/api/health")
            ready = client.get("/api/ready")

        self.assertEqual(health.status_code, 200)
        self.assertFalse(health.json()["ready"])
        self.assertEqual(health.json()["startup_error"], "isolated startup failure")
        self.assertEqual(ready.status_code, 503)
        self.assertEqual(
            ready.json()["detail"],
            {
                "status": "not_ready",
                "startup_error": "isolated startup failure",
            },
        )


if __name__ == "__main__":
    unittest.main()
