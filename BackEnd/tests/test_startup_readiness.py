import unittest
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

from app import main


class StartupReadinessTests(unittest.TestCase):
    def test_real_lifespan_initializes_health_and_readiness(self):
        session = Mock()
        session_factory = Mock(return_value=session)
        essays = {
            "essay-1": {
                "id": "essay-1",
                "type": "personal",
                "school": "Example University",
            }
        }
        embeddings = (
            ["chunk-1"],
            ["essay-1"],
            ["preview"],
            ["topic"],
            [[1.0]],
            [[1.0]],
        )

        with (
            patch.object(main, "create_tables") as create_tables,
            patch.object(main, "SessionLocal", session_factory),
            patch.object(main, "load_essays_from_db", return_value=essays),
            patch.object(main, "load_db_embeddings", return_value=embeddings),
            TestClient(main.app) as client,
        ):
            health = client.get("/health")
            ready = client.get("/ready")

        self.assertEqual(health.status_code, 200)
        self.assertTrue(health.json()["ready"])
        self.assertEqual(health.json()["essay_count"], 1)
        self.assertEqual(ready.status_code, 200)
        self.assertEqual(ready.json(), {"status": "ready", "essay_count": 1})
        create_tables.assert_called_once_with()
        session_factory.assert_called_once_with()
        session.close.assert_called_once_with()

    def test_real_lifespan_exposes_startup_failure_as_not_ready(self):
        with (
            patch.object(main, "create_tables", side_effect=RuntimeError("isolated startup failure")),
            TestClient(main.app) as client,
        ):
            health = client.get("/health")
            ready = client.get("/ready")

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
