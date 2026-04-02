from typing import Optional

def preview(text: str, max_chars: int = 200):

    "Generate a preview text"

    if not text:
        return ""
    return text[:max_chars] + ("..." if len(text) > max_chars else "")

def get_essay_info(essay):

    return {
        "id": essay["id"],
        "title": essay["title"],
        "preview": preview(essay["content"])
    }

def normalized_essay_type(value: Optional[str]) -> str:
    """
    Steps:
    1. Ensure input is a string
    2. Strip whitespace and lowercase
    3. Map common aliases → standardized type
    """
    if not isinstance(value, str):
        return ""

    normalized = value.strip().lower()

    # Map common variations to a single canonical form
    aliases = {
        "uc": "uc piq", # personal insight questions
        "piq": "uc piq",
        "ucpiq": "uc piq",
        "supplemental": "supplementals",
    }

    return aliases.get(normalized, normalized)