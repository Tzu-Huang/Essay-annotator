import json
import unittest
from unittest.mock import MagicMock

from service.extract_essay import MODEL, extract_prompt_and_content


class ExtractEssayTests(unittest.TestCase):
    def _client_returning(self, payload: dict):
        client = MagicMock()
        response = MagicMock()
        response.choices = [MagicMock(message=MagicMock(content=json.dumps(payload)))]
        client.chat.completions.create.return_value = response
        return client

    def test_extracts_topic_and_content(self):
        client = self._client_returning(
            {"topic": "Describe a challenge you overcame.", "content": "I once faced a challenge..."}
        )

        result = extract_prompt_and_content("Prompt: Describe a challenge...\n\nI once faced a challenge...", client)

        self.assertEqual(result["topic"], "Describe a challenge you overcame.")
        self.assertEqual(result["content"], "I once faced a challenge...")

    def test_missing_prompt_returns_empty_topic_not_none(self):
        client = self._client_returning({"topic": "", "content": "Just the essay body, no prompt found anywhere."})

        result = extract_prompt_and_content("Just the essay body, no prompt found anywhere.", client)

        self.assertEqual(result["topic"], "")
        self.assertIsInstance(result["topic"], str)
        self.assertEqual(result["content"], "Just the essay body, no prompt found anywhere.")

    def test_falls_back_to_raw_text_if_content_missing_from_response(self):
        client = self._client_returning({"topic": "A prompt"})  # no "content" key at all

        result = extract_prompt_and_content("The raw uploaded text.", client)

        self.assertEqual(result["content"], "The raw uploaded text.")

    def test_strips_whitespace_from_both_fields(self):
        client = self._client_returning({"topic": "  A prompt  ", "content": "  Body text  "})

        result = extract_prompt_and_content("raw", client)

        self.assertEqual(result["topic"], "A prompt")
        self.assertEqual(result["content"], "Body text")

    def test_uses_gpt4o_mini_model(self):
        client = self._client_returning({"topic": "", "content": "x"})

        extract_prompt_and_content("raw", client)

        called_kwargs = client.chat.completions.create.call_args.kwargs
        self.assertEqual(called_kwargs["model"], MODEL)
        self.assertEqual(MODEL, "gpt-4o-mini")


if __name__ == "__main__":
    unittest.main()
