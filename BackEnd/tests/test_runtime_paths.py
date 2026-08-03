import unittest
from pathlib import Path

from app.paths import BACKEND_ROOT, DATABASE_JSONL, EMBED_JSONL, resolve_data_root
from embedding.make_embedding import Input_file, Output_file


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

    def test_embedding_input_and_output_use_resolved_data_paths(self):
        self.assertEqual(Input_file, DATABASE_JSONL)
        self.assertEqual(Output_file, EMBED_JSONL)


if __name__ == "__main__":
    unittest.main()
