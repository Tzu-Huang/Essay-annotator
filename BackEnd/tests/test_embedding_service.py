import unittest
from unittest.mock import MagicMock

from service.embedding_service import embed_essay


class EmbeddingServiceTests(unittest.TestCase):
    def test_embed_essay_returns_chunk_records(self):
        client = MagicMock()
        # embedding() calls client.embeddings.create(...).data[i].embedding — mock the shape it expects.
        fake_response = MagicMock()
        fake_response.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]
        client.embeddings.create.return_value = fake_response

        essay = {
            "id": "essay_0099", "topic": "Why I love robotics", "content": "Short essay body.",
            "type": "Personal Statement", "school": "MIT", "public": True, "source_file": "manual",
        }
        records = embed_essay(essay, client)

        self.assertGreaterEqual(len(records), 1)
        self.assertEqual(records[0]["parent_id"], "essay_0099")
        self.assertEqual(records[0]["id"], "essay_0099_00")
        self.assertIn("topic_embedding", records[0])
        self.assertIn("content_embedding", records[0])


if __name__ == "__main__":
    unittest.main()
