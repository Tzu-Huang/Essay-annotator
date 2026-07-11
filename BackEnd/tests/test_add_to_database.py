import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.add_to_database import add_generated_titles


class FakeChatCompletions:
    def __init__(self, script):
        self._script = script

    def create(self, *, model, messages, max_tokens):
        user_content = messages[1]["content"]
        for key, outcome in self._script.items():
            if key in user_content:
                if isinstance(outcome, Exception):
                    raise outcome
                return SimpleNamespace(
                    choices=[SimpleNamespace(message=SimpleNamespace(content=outcome))]
                )
        raise AssertionError(f"No script match for message: {user_content}")


class FakeClient:
    def __init__(self, script):
        self.chat = SimpleNamespace(completions=FakeChatCompletions(script))


class AddGeneratedTitlesTests(unittest.TestCase):
    def test_sets_generated_title_for_each_essay(self):
        essays = [
            {"id": "essay_0001", "topic": "Topic A", "content": "Content A"},
            {"id": "essay_0002", "topic": "Topic B", "content": "Content B"},
        ]
        client = FakeClient({
            "Topic: Topic A": "Generated Title A",
            "Topic: Topic B": "Generated Title B",
        })

        add_generated_titles(essays, client)

        self.assertEqual(essays[0]["generated_title"], "Generated Title A")
        self.assertEqual(essays[1]["generated_title"], "Generated Title B")
        self.assertEqual(essays[0]["topic"], "Topic A")

    def test_skips_failed_essay_and_continues(self):
        essays = [
            {"id": "essay_0001", "topic": "Broken", "content": "Content A"},
            {"id": "essay_0002", "topic": "Fine", "content": "Content B"},
        ]
        client = FakeClient({
            "Topic: Broken": RuntimeError("API failure"),
            "Topic: Fine": "Generated Title B",
        })

        add_generated_titles(essays, client)

        self.assertIsNone(essays[0]["generated_title"])
        self.assertEqual(essays[1]["generated_title"], "Generated Title B")


if __name__ == "__main__":
    unittest.main()
