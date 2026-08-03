import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from embedding.search_similar import cosine_search, load_db_embeddings


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


class CosineSearchEligibilityTests(unittest.TestCase):
    def setUp(self):
        # Row 0 is the closest match to the query, row 2 the farthest.
        self.topic_V = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]])
        self.content_V = self.topic_V
        self.query = np.array([1.0, 0.0])
        self.parents = ["a", "b", "c"]

    def _search(self, top_k, eligible):
        return cosine_search(
            topic_V=self.topic_V, content_V=self.content_V,
            topic_vec=self.query, content_vec=self.query,
            mode="topic_only", top_k=top_k,
            parent_ids=self.parents, eligible=eligible,
        )

    def test_none_mask_preserves_existing_behavior(self):
        idx, _ = self._search(2, None)
        self.assertEqual(idx, [0, 1])

    def test_ineligible_rows_never_returned(self):
        idx, _ = self._search(3, np.array([False, True, True]))
        self.assertNotIn(0, idx)

    def test_ineligible_rows_do_not_consume_topk_slots(self):
        # Asking for 2 with row 0 blocked must still yield 2 results.
        idx, _ = self._search(2, np.array([False, True, True]))
        self.assertEqual(len(idx), 2)
        self.assertEqual(idx, [1, 2])

    def test_zero_eligible_returns_empty_not_error(self):
        idx, _ = self._search(5, np.array([False, False, False]))
        self.assertEqual(idx, [])

    def test_parent_dedup_still_applies(self):
        idx, _ = cosine_search(
            topic_V=self.topic_V, content_V=self.content_V,
            topic_vec=self.query, content_vec=self.query,
            mode="topic_only", top_k=3,
            parent_ids=["a", "a", "c"], eligible=np.array([True, True, True]),
        )
        self.assertEqual(idx, [0, 2])

    def test_fewer_eligible_than_topk_returns_what_exists(self):
        idx, _ = self._search(10, np.array([True, False, False]))
        self.assertEqual(idx, [0])


if __name__ == "__main__":
    unittest.main()
