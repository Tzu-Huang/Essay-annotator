import json
from pathlib import Path

MODEL = "gpt-4o-mini"


def load_prompt(path="extract_essay_prompt.txt"):
    base_dir = Path(__file__).resolve().parent
    full_path = base_dir / path
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_prompt_and_content(raw_text: str, client) -> dict:
    """
    Given the raw extracted text of an uploaded essay file, ask the LLM to
    split it into the essay prompt/question and the essay body.

    Returns {"topic": str, "content": str}. "topic" is "" (never None) when
    no distinct prompt can be found in the text -- the caller surfaces this
    as a review-step warning rather than treating it as a failure.
    """
    system_prompt = load_prompt()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_text},
        ],
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)

    return {
        "topic": (result.get("topic") or "").strip(),
        "content": (result.get("content") or raw_text).strip(),
    }
