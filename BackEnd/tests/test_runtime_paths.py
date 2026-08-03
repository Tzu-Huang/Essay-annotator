import unittest
from pathlib import Path

from app.paths import BACKEND_ROOT, resolve_data_root


class RuntimePathTests(unittest.TestCase):
    def test_defaults_to_release_local_drive_data_for_development(self):
        self.assertEqual(resolve_data_root({}), BACKEND_ROOT / "drive_data")

    def test_uses_shared_production_data_root(self):
        self.assertEqual(
            resolve_data_root({"ESSAY_DATA_ROOT": "/var/lib/essay-annotator/drive_data"}),
            Path("/var/lib/essay-annotator/drive_data"),
        )

    def test_ignores_blank_override(self):
        self.assertEqual(resolve_data_root({"ESSAY_DATA_ROOT": "  "}), BACKEND_ROOT / "drive_data")


if __name__ == "__main__":
    unittest.main()
