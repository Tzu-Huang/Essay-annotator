import json
import tempfile
import unittest
from pathlib import Path

from service.embed_store import append_records, remove_parent_ids, replace_parent_id


class EmbedStoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False)
        self.path = Path(self.tmp.name)
        self.tmp.close()

    def tearDown(self):
        self.path.unlink(missing_ok=True)

    def test_append_then_remove(self):
        append_records(self.path, [
            {"parent_id": "essay_0001", "id": "essay_0001_00", "topic": "T"},
            {"parent_id": "essay_0002", "id": "essay_0002_00", "topic": "T2"},
        ])
        lines = self.path.read_text(encoding="utf-8-sig").strip().splitlines()
        self.assertEqual(len(lines), 2)

        removed = remove_parent_ids(self.path, {"essay_0001"})
        self.assertEqual(len(removed), 1)
        remaining = [json.loads(l) for l in self.path.read_text(encoding="utf-8-sig").strip().splitlines()]
        self.assertEqual([r["parent_id"] for r in remaining], ["essay_0002"])

    def test_replace_parent_id(self):
        append_records(self.path, [{"parent_id": "essay_0001", "id": "essay_0001_00", "topic": "old"}])
        replace_parent_id(self.path, "essay_0001", [
            {"parent_id": "essay_0001", "id": "essay_0001_00", "topic": "new"},
            {"parent_id": "essay_0001", "id": "essay_0001_01", "topic": "new"},
        ])
        remaining = [json.loads(l) for l in self.path.read_text(encoding="utf-8-sig").strip().splitlines()]
        self.assertEqual(len(remaining), 2)
        self.assertTrue(all(r["topic"] == "new" for r in remaining))


if __name__ == "__main__":
    unittest.main()
