import unittest
import numpy as np

from app.state import AppData


class AppDataMutationTests(unittest.TestCase):
    def setUp(self):
        self.data = AppData(
            ids=["e1_00", "e2_00"],
            parent=["e1", "e2"],
            previews=["p1", "p2"],
            topic_texts=["t1", "t2"],
            types=["PS", "PS"],
            schools=["A", "B"],
            topic_V=np.array([[1.0, 0.0], [0.0, 1.0]]),
            content_V=np.array([[1.0, 0.0], [0.0, 1.0]]),
        )

    def test_remove_essay_vectors(self):
        self.data.remove_essay_vectors("e1")
        self.assertEqual(self.data.parent, ["e2"])
        self.assertEqual(self.data.topic_V.shape[0], 1)

    def test_remove_all_essay_vectors_preserves_embedding_dim(self):
        self.data.remove_essay_vectors("e1")
        self.data.remove_essay_vectors("e2")
        self.assertEqual(self.data.parent, [])
        self.assertEqual(self.data.topic_V.shape, (0, 2))
        self.assertEqual(self.data.content_V.shape, (0, 2))

    def test_replace_essay_vectors(self):
        new_row = {
            "id": "e1_00", "parent": "e1", "preview": "new preview", "topic_text": "new topic",
            "type": "PS", "school": "A", "topic_V": np.array([0.5, 0.5]), "content_V": np.array([0.5, 0.5]),
        }
        self.data.replace_essay_vectors("e1", [new_row])
        self.assertEqual(self.data.previews[self.data.parent.index("e1")], "new preview")

    def test_add_essay_vectors(self):
        new_row = {
            "id": "e3_00", "parent": "e3", "preview": "p3", "topic_text": "t3",
            "type": "PS", "school": "C", "topic_V": np.array([1.0, 1.0]), "content_V": np.array([1.0, 1.0]),
        }
        self.data.add_essay_vectors([new_row])
        self.assertIn("e3", self.data.parent)
        self.assertEqual(self.data.topic_V.shape[0], 3)


class AppDataVisibilityTests(unittest.TestCase):
    def setUp(self):
        self.data = AppData(
            ids=["e1_00", "e2_00"],
            parent=["e1", "e2"],
            previews=["p1", "p2"],
            topic_texts=["t1", "t2"],
            types=["PS", "PS"],
            schools=["A", "B"],
            public=[True, False],
            deleted=[False, False],
            topic_V=np.array([[1.0, 0.0], [0.0, 1.0]]),
            content_V=np.array([[1.0, 0.0], [0.0, 1.0]]),
        )

    def test_remove_preserves_visibility_alignment(self):
        self.data.remove_essay_vectors("e1")
        self.assertEqual(self.data.parent, ["e2"])
        self.assertEqual(self.data.public, [False])
        self.assertEqual(self.data.deleted, [False])

    def test_add_defaults_to_not_public(self):
        self.data.add_essay_vectors([{
            "id": "e3_00", "parent": "e3", "preview": "p3", "topic_text": "t3",
            "type": "PS", "school": "C",
            "topic_V": np.array([1.0, 1.0]), "content_V": np.array([1.0, 1.0]),
        }])
        self.assertEqual(self.data.public[-1], False)
        self.assertEqual(self.data.deleted[-1], False)

    def test_add_honors_explicit_flags(self):
        self.data.add_essay_vectors([{
            "id": "e4_00", "parent": "e4", "preview": "p4", "topic_text": "t4",
            "type": "PS", "school": "D", "public": True, "deleted": False,
            "topic_V": np.array([1.0, 1.0]), "content_V": np.array([1.0, 1.0]),
        }])
        self.assertEqual(self.data.public[-1], True)

    def test_set_essay_visibility_updates_all_chunks(self):
        self.data.add_essay_vectors([{
            "id": "e1_01", "parent": "e1", "preview": "p1b", "topic_text": "t1",
            "type": "PS", "school": "A", "public": True,
            "topic_V": np.array([1.0, 1.0]), "content_V": np.array([1.0, 1.0]),
        }])
        self.data.set_essay_visibility("e1", deleted=True)
        for i, pid in enumerate(self.data.parent):
            if pid == "e1":
                self.assertTrue(self.data.deleted[i])

    def test_set_essay_visibility_unknown_id_is_noop(self):
        self.data.set_essay_visibility("nope", deleted=True)
        self.assertEqual(self.data.deleted, [False, False])


if __name__ == "__main__":
    unittest.main()
