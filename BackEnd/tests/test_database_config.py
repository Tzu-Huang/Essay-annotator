import unittest
from unittest.mock import patch

from database.create import validate_production_database_configuration


class ProductionDatabaseConfigurationTests(unittest.TestCase):
    def test_local_environment_allows_sqlite_fallback(self):
        with patch.dict("os.environ", {}, clear=True):
            validate_production_database_configuration()

    def test_production_requires_postgres_url(self):
        with patch.dict("os.environ", {"APP_ENV": "production"}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "POSTGRES_URL is required"):
                validate_production_database_configuration()

    def test_unknown_environment_is_rejected(self):
        with patch.dict("os.environ", {"APP_ENV": "prodution"}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "APP_ENV must be one of"):
                validate_production_database_configuration()

    def test_production_rejects_non_postgres_url(self):
        with patch.dict(
            "os.environ",
            {
                "APP_ENV": "production",
                "POSTGRES_URL": "sqlite:///production.db",
            },
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "must use a PostgreSQL"):
                validate_production_database_configuration()

    def test_production_accepts_postgres_url(self):
        with patch.dict(
            "os.environ",
            {
                "APP_ENV": "production",
                "POSTGRES_URL": "postgresql://example.invalid/essay_annotator",
            },
            clear=True,
        ):
            validate_production_database_configuration()


if __name__ == "__main__":
    unittest.main()
