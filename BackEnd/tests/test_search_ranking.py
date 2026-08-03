import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from embedding.search_similar import load_db_embeddings


def _record(rid, pid, public):
    return {
        "parent_id": pid, "id": rid, "topic": "t", "content": "c",
        "type": "PS", "school": "A", "public": public,
        "topic_embedding": [1.0, 0.0], "content_embedding": [1.0, 0.0],
    }


class LoadDbEmbeddingsVisibilityTests(unittest.TestCase):
    def _write(self, records):
        tmp = Path(tempfile.mkdtemp()) / "embed.jsonl"
        with tmp.open("w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r) + "\n")
        return str(tmp)

    def test_reads_public_flag(self):
        path = self._write([_record("a_00", "a", True), _record("b_00", "b", False)])
        ids, parent, previews, topic_texts, public, topic_V, content_V = load_db_embeddings(path)
        self.assertEqual(ids, ["a_00", "b_00"])
        self.assertEqual(public, [True, False])

    def test_missing_public_defaults_to_false(self):
        rec = _record("c_00", "c", True)
        del rec["public"]
        path = self._write([rec])
        _, _, _, _, public, _, _ = load_db_embeddings(path)
        self.assertEqual(public, [False])


if __name__ == "__main__":
    unittest.main()
