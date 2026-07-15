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


if __name__ == "__main__":
    unittest.main()
