import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from service.ingest_service import scan_and_title_new_essays


class IngestServiceTests(unittest.TestCase):
    def test_scan_and_title_returns_titled_essays(self):
        with tempfile.TemporaryDirectory() as tmp:
            new_input_dir = Path(tmp) / "new_input"
            new_input_dir.mkdir()
            (new_input_dir / "sample.txt").write_text(
                "prompt: Why this school?\ncontent: Because reasons.", encoding="utf-8"
            )
            database_path = Path(tmp) / "database.jsonl"
            database_path.write_text("", encoding="utf-8")

            fake_client = MagicMock()
            # add_generated_titles (called by scan_and_title_new_essays) resolves
            # get_topic via scripts.add_to_database's own module-level import, so
            # that's the name that must be patched -- not service.ingest_service's
            # (which never binds get_topic at all).
            with patch("scripts.add_to_database.get_topic", return_value="Why This School"):
                essays = scan_and_title_new_essays(new_input_dir, database_path, fake_client)

            self.assertEqual(len(essays), 1)
            self.assertEqual(essays[0]["generated_title"], "Why This School")


if __name__ == "__main__":
    unittest.main()
