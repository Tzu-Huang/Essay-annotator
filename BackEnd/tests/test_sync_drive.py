import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import sync_drive


class SyncDriveSmokeTests(unittest.TestCase):
    def test_makefile_uses_backend_relative_sync_script(self):
        repo_root = Path(__file__).resolve().parents[2]
        makefile = (repo_root / "Makefile").read_text(encoding="utf-8")

        self.assertIn(
            "cd BackEnd && python scripts/sync_drive.py",
            makefile,
        )
        self.assertNotIn(
            "cd BackEnd && python BackEnd/scripts/sync_drive.py",
            makefile,
        )

    def test_cli_imports_and_forwards_arguments_without_google_access(self):
        argv = [
            "sync_drive.py",
            "--folder_id",
            "test-folder",
            "--out",
            "test-output",
        ]

        with patch.object(sys, "argv", argv), patch.object(sync_drive, "run_sync") as run_sync:
            sync_drive.main()

        run_sync.assert_called_once_with("test-folder", "test-output")


if __name__ == "__main__":
    unittest.main()
