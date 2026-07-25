import unittest
from unittest.mock import MagicMock

from service.embedding_service import embed_essay, embed_essay_chunks


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

    def test_embed_essay_chunks_skips_already_seen_chunk_indices(self):
        """
        Regression test for the partial-essay bug: when only SOME of an
        essay's chunk ids are already present in embed.jsonl (seen_ids),
        embed_essay_chunks(..., chunk_indices=<only the unseen ones>) must
        never call the OpenAI client with content for the already-seen
        chunk(s).
        """
        client = MagicMock()

        # Content forces chunk_text() to split into multiple paragraph chunks:
        # chunk_text() only splits when the essay exceeds ~300 tokens, so
        # each paragraph here is padded with enough unique words to push the
        # essay well past that threshold and yield several distinct chunks.
        p1 = " ".join(f"wordone{i}" for i in range(150))
        p2 = " ".join(f"wordtwo{i}" for i in range(150))
        p3 = " ".join(f"wordthree{i}" for i in range(150))
        content = f"{p1}\n\n{p2}\n\n{p3}"
        essay = {
            "id": "essay_0100", "topic": "Why I love many things", "content": content,
            "type": "Personal Statement", "school": "MIT", "public": True, "source_file": "manual",
        }

        from embedding.make_embedding import chunk_text
        chunks = chunk_text(content)
        self.assertGreaterEqual(len(chunks), 2, "test fixture must produce >1 chunk")

        # Pretend chunk 0 is already embedded (in seen_ids); only chunk 1+ is unseen.
        seen_ids = {f"{essay['id']}_00"}
        unseen_indices = [i for i in range(len(chunks)) if f"{essay['id']}_{i:02d}" not in seen_ids]
        self.assertEqual(unseen_indices, list(range(1, len(chunks))))

        # embeddings.create is called once for the topic, once for the
        # (filtered) content chunks. Return enough vectors for whichever
        # call is made.
        def fake_create(model, input):
            resp = MagicMock()
            resp.data = [MagicMock(embedding=[0.1, 0.2, 0.3]) for _ in input]
            return resp

        client.embeddings.create.side_effect = fake_create

        records = embed_essay_chunks(essay, client, chunk_indices=unseen_indices)

        # Only the unseen chunks should have been written.
        self.assertEqual(len(records), len(unseen_indices))
        returned_ids = {rec["id"] for rec in records}
        self.assertNotIn(f"{essay['id']}_00", returned_ids)

        # Inspect every call made to embeddings.create and confirm the
        # already-seen chunk's exact text was never sent for embedding.
        seen_chunk_text = chunks[0]
        for call in client.embeddings.create.call_args_list:
            sent_input = call.kwargs.get("input", call.args[1] if len(call.args) > 1 else None)
            self.assertNotIn(seen_chunk_text, sent_input)


if __name__ == "__main__":
    unittest.main()
