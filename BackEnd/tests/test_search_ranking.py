import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np

from embedding.search_similar import cosine_search, load_db_embeddings
from service.search_service import run_search


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


def _app_state():
    return SimpleNamespace(
        ids=["a_00", "b_00", "c_00"],
        parent=["a", "b", "c"],
        previews=["pa", "pb", "pc"],
        topic_texts=["ta", "tb", "tc"],
        types=["PS", "Supplemental", "PS"],
        schools=["A", "B", "C"],
        public=[True, True, False],
        deleted=[False, False, False],
        topic_V=np.array([[1.0, 0.0], [0.9, 0.1], [0.8, 0.2]]),
        content_V=np.array([[1.0, 0.0], [0.9, 0.1], [0.8, 0.2]]),
        essays={
            "a": {"content": "one two", "generated_title": "A"},
            "b": {"content": "three", "generated_title": "B"},
            "c": {"content": "four", "generated_title": "C"},
        },
    )


class RunSearchEligibilityTests(unittest.TestCase):
    def _run(self, essay_types, top_k=5, state=None):
        req = SimpleNamespace(topK=top_k, essay_types=essay_types, topic="hi", content="")
        with patch("service.search_service.get_client", return_value=object()), \
             patch("service.search_service.get_query_embedding",
                   return_value=np.array([1.0, 0.0], dtype=np.float32)):
            return run_search(req, state or _app_state())

    def test_private_essay_absent_from_results(self):
        out = self._run(["all"])
        self.assertNotIn("c", [r["parent_id"] for r in out["results"]])

    def test_deleted_essay_absent_from_results(self):
        state = _app_state()
        state.public = [True, True, True]
        state.deleted = [False, True, False]
        out = self._run(["all"], state=state)
        self.assertNotIn("b", [r["parent_id"] for r in out["results"]])

    def test_type_filter_does_not_shrink_result_count(self):
        # Only "a" and "c" are PS; "c" is private. Expect exactly "a".
        out = self._run(["PS"])
        self.assertEqual([r["parent_id"] for r in out["results"]], ["a"])

    def test_no_eligible_candidates_returns_empty_list(self):
        out = self._run(["University of California"])
        self.assertEqual(out["results"], [])

    def test_ranks_are_contiguous_from_one(self):
        out = self._run(["all"])
        self.assertEqual([r["rank"] for r in out["results"]], [1, 2])


class TopKFillTests(unittest.TestCase):
    def test_requested_topk_is_filled_when_enough_eligible_exist(self):
        # 6 public essays, but the 3 best-scoring are Supplementals.
        state = SimpleNamespace(
            ids=[f"e{i}_00" for i in range(6)],
            parent=[f"e{i}" for i in range(6)],
            previews=["p"] * 6,
            topic_texts=["t"] * 6,
            types=["Supplemental", "Supplemental", "Supplemental", "PS", "PS", "PS"],
            schools=["S"] * 6,
            public=[True] * 6,
            deleted=[False] * 6,
            topic_V=np.array([[1.0, 0.0], [0.99, 0.0], [0.98, 0.0],
                              [0.5, 0.0], [0.4, 0.0], [0.3, 0.0]]),
            content_V=np.array([[1.0, 0.0], [0.99, 0.0], [0.98, 0.0],
                                [0.5, 0.0], [0.4, 0.0], [0.3, 0.0]]),
            essays={f"e{i}": {"content": "w", "generated_title": None} for i in range(6)},
        )
        req = SimpleNamespace(topK=3, essay_types=["PS"], topic="hi", content="")
        with patch("service.search_service.get_client", return_value=object()), \
             patch("service.search_service.get_query_embedding",
                   return_value=np.array([1.0, 0.0], dtype=np.float32)):
            out = run_search(req, state)
        # Before the fix this returned 0 results: the top 3 were all Supplemental.
        self.assertEqual([r["parent_id"] for r in out["results"]], ["e3", "e4", "e5"])


if __name__ == "__main__":
    unittest.main()
