import os
import unittest
from pathlib import Path
from unittest.mock import patch

from runtime_paths import BACKEND_DIR, DEFAULT_DATA_ROOT, data_root, runtime_path


class RuntimePathTests(unittest.TestCase):
    def test_local_default_remains_backend_drive_data(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(data_root(), DEFAULT_DATA_ROOT)

    def test_configured_root_routes_runtime_files(self):
        configured = Path("C:/persistent/essay-data")
        with patch.dict(
            os.environ,
            {"APP_ENV": "development", "ESSAY_DATA_ROOT": str(configured)},
            clear=True,
        ):
            self.assertEqual(
                runtime_path("embed_output/embed.jsonl"),
                configured / "embed_output/embed.jsonl",
            )

    def test_production_requires_configured_root(self):
        with patch.dict(os.environ, {"APP_ENV": "production"}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "ESSAY_DATA_ROOT is required"):
                data_root()

    def test_production_rejects_relative_root(self):
        with patch.dict(
            os.environ,
            {"APP_ENV": "production", "ESSAY_DATA_ROOT": "drive_data"},
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "absolute path"):
                data_root()

    def test_production_rejects_release_local_root(self):
        release_local = BACKEND_DIR / "drive_data"
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "ESSAY_DATA_ROOT": str(release_local),
            },
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "outside the release"):
                data_root()


if __name__ == "__main__":
    unittest.main()
