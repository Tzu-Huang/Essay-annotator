import re
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path


# ===========================
# Compare config
# ===========================
load_dotenv()
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = "gpt-5.4-mini"

MIN_COMPARE_WORDS = 80
MAX_SUGGESTIONS = 3


def get_compare_limit(word_count: int) -> int:
    if word_count < 120:
        return 2
    if word_count < 300:
        return 3
    if word_count < 600:
        return 4
    return 5

def load_prompt(path="compare_prompt.txt"):
    base_dir = Path(__file__).resolve().parent
    full_path = base_dir / path

    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


# Upon the prompt template, replace the user_essay and database_essay in the prompt
def build_prompt(template, user_essay, database_essay):
    prompt = template.replace("{user_input}", user_essay)
    prompt = prompt.replace("{database_essay}", database_essay)
    return prompt


# Count the number of words from the input
def count_words(text: str) -> int:
    return len((text or "").split())


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]


def split_sentences(text: str) -> list[str]:
    return [
        s.strip()
        for s in re.split(r'(?<=[.!?])\s+', text or "")
        if s.strip()
    ]


def find_sentence_index(sentences: list[str], target: str) -> int | None:
    target = normalize_text(target)

    for i, sentence in enumerate(sentences):
        normalized_sentence = normalize_text(sentence)

        if normalized_sentence == target:
            return i

        if target in normalized_sentence:
            return i

        if normalized_sentence in target:
            return i

    return None


def find_paragraph_index(paragraphs: list[str], sentence: str) -> int | None:
    sentence = normalize_text(sentence)

    for i, paragraph in enumerate(paragraphs):
        if sentence in normalize_text(paragraph):
            return i

    return None


def prepare_compare_context(user_essay: str, database_essay: str):
    user_paragraphs = split_paragraphs(user_essay)
    db_paragraphs = split_paragraphs(database_essay)

    user_sentences = split_sentences(user_essay)
    db_sentences = split_sentences(database_essay)

    return {
        "user_word_count": count_words(user_essay),
        "user_paragraphs": user_paragraphs,
        "db_paragraphs": db_paragraphs,
        "user_sentences": user_sentences,
        "db_sentences": db_sentences,
    }


def clean_suggestions(raw_suggestions):
    if not isinstance(raw_suggestions, list):
        return []

    return [
        suggestion.strip()
        for suggestion in raw_suggestions
        if isinstance(suggestion, str) and suggestion.strip()
    ][:MAX_SUGGESTIONS]


def clean_comparison(text: str) -> str:
    comparison = (text or "").strip()

    if len(comparison) > 400:
        comparison = comparison[:400] + "..."

    return comparison


def finalize_compare_result(raw_result: dict, essay_id: str, context: dict):
    comparisons = raw_result.get("comparisons", [])

    if not isinstance(comparisons, list):
        comparisons = []

    cleaned = []
    seen_pairs = set()

    max_comparisons = get_compare_limit(context["user_word_count"])

    for item in comparisons:
        if len(cleaned) >= max_comparisons:
            break

        if not isinstance(item, dict):
            continue

        user_sentence = item.get("user_sentence", "").strip()
        example_sentence = item.get("example_sentence", "").strip()

        if not user_sentence or not example_sentence:
            continue

        pair_key = (
            normalize_text(user_sentence),
            normalize_text(example_sentence),
        )

        if pair_key in seen_pairs:
            continue

        seen_pairs.add(pair_key)

        user_sentence_index = find_sentence_index(
            context["user_sentences"],
            user_sentence
        )

        example_paragraph_index = find_paragraph_index(
            context["db_paragraphs"],
            example_sentence
        )

        if user_sentence_index is None or example_paragraph_index is None:
            continue

        cleaned.append({
            "id": len(cleaned) + 1,
            "user_sentence": user_sentence,
            "user_sentence_index": user_sentence_index,
            "example_sentence": example_sentence,
            "example_paragraph": context["db_paragraphs"][example_paragraph_index],
            "example_paragraph_index": example_paragraph_index,
            "comparison": clean_comparison(item.get("comparison", "")),
            "suggestions": clean_suggestions(item.get("suggestions", [])),
        })

    return {
        "essay_id": essay_id,
        "too_short": False,
        "comparisons": cleaned,
    }


# Call the LLM model that we're using, and feed with our prompt
def call_llm(prompt):
    response = client.responses.create(
        model=MODEL,
        input=prompt
    )

    return response.output_text


def parse_response(text):
    try:
        return json.loads(text)
    except Exception:
        return {
            "error": "failed to parse",
            "raw": text
        }


def compare(user_essay: str, sample_essay: str):
    # 1. load prompt template
    template = load_prompt()

    # 2. build prompt
    prompt = build_prompt(template, user_essay, sample_essay)

    # 3. call LLM
    raw_output = call_llm(prompt)

    # 4. parse into dict
    result = parse_response(raw_output)

    return result