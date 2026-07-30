import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_restored_files import validate_restored_files


class RestoredFileValidationTests(unittest.TestCase):
    def write_restore(self, root: Path, *, parent_id: str = "essay_0001") -> None:
        database_path = root / "finalized_data_jsonl" / "database.jsonl"
        embedding_path = root / "embed_output" / "embed.jsonl"
        database_path.parent.mkdir(parents=True)
        embedding_path.parent.mkdir(parents=True)
        database_path.write_text(
            json.dumps(
                {
                    "id": "essay_0001",
                    "topic": "A topic",
                    "content": "Representative content",
                    "type": "personal",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        embedding_path.write_text(
            json.dumps(
                {
                    "id": "essay_0001_00",
                    "parent_id": parent_id,
                    "topic": "A topic",
                    "content": "Representative content",
                    "topic_embedding": [1.0, 0.0],
                    "content_embedding": [0.0, 1.0],
                }
            )
            + "\n",
            encoding="utf-8",
        )

    def test_application_loaders_read_restored_files(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            self.write_restore(root)
            result = validate_restored_files(root)

        self.assertEqual(result["essay_count"], 1)
        self.assertEqual(result["embedding_count"], 1)
        self.assertEqual(result["embedding_dimensions"], 2)

    def test_missing_embedding_parent_fails_validation(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            self.write_restore(root, parent_id="missing")
            with self.assertRaisesRegex(RuntimeError, "missing essays"):
                validate_restored_files(root)


if __name__ == "__main__":
    unittest.main()
