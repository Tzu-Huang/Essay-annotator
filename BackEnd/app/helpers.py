import json
from typing import Optional

def preview(text: str, max_chars: int = 200):

    "Generate a preview text"

    if not text:
        return ""
    return text[:max_chars] + ("..." if len(text) > max_chars else "")

def get_essay_info(essay):

    return {
        "id": essay["id"],
        "topic": essay["topic"],
        "preview": preview(essay["content"])
    }

def load_essays(db_path: str):
    database_essays = {}
    with open(db_path, "r", encoding="utf-8") as f:
        for line in f:
            essay = json.loads(line)
            database_essays[essay["id"]] = essay
    return database_essays