# Input: jsonl file 
# Output:

import os
import json
from pathlib import Path
from openai import OpenAI   # 之後做 embedding 會用到（先留著）

# =========================
# Config
# =========================

# Input JSONL file (finalized schema)
file_path = 'data/finalized_data_json/corpus.jsonl'


# =========================
# Helper functions
# =========================

def read_jsonl(path):
    """
    Read a JSONL file line by line.
    Each line should be a valid JSON object.
    
    Yield: dict (one record per line)
    """
    with open(path, "r", encoding="utf-8-sig") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()

            # Skip empty lines
            if not line:
                continue

            try:
                obj = json.loads(line)
                yield obj
                # print(obj)
            except json.JSONDecodeError as e:
                # Very important for debugging bad lines
                print(f"[JSON ERROR] line {idx}: {e}")
                print("Preview:", line[:120])


def extract_text_fields(obj):
    """
    Given one JSON object, extract topic and content.
    Return None if required fields are missing.
    """
    topic = obj.get("topic")
    content = obj.get("content")

    if topic is None or content is None:
        return None

    # Basic cleanup (important before embedding)
    topic = topic.strip()
    content = content.strip()

    if not topic or not content:
        return None

    return {
        "id": obj.get("id"),
        "topic": topic,
        "content": content,
        "type": obj.get("type"),
        "school": obj.get("school"),
        "public": obj.get("public"),
        "source_file": obj.get("source_file"),
    }

def embedding(client, text):
    """
    input: array (list[str])
    output: vectors
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input= text
    )
    return [item.embedding for item in response.data]

  

# =========================
# Main logic
# =========================

def main():
    print("Loading data from JSONL...\n")

    records = []

    # Step 1: read jsonl line by line
    for obj in read_jsonl(file_path):
        record = extract_text_fields(obj)
        if record is None:
            continue
        records.append(record)

    print(f"Loaded {len(records)} valid records.\n")

    # Step 2: Embedding
    client = OpenAI(api_key = os.environ["OPENAI_API_KEY"])
    topics = []
    contents = []

    # Step 2: sanity check (print first few)
    for r in enumerate(records[:len(records)]):
        # print(f"--- Record {i} ---")
        # print("ID:", r["id"])
        # print("Topic:", r["topic"])
        # print("Content preview:", r["content"][:80])
        # print()

        topics.append(r["topic"])
        contents.append(r["content"])

    # Step 3: Embedding

    content_vecs = embedding(client, contents)
    topic_vecs = embedding(client, topics)
    
    # Step 4: Store and export
    # for i in records:


if __name__ == "__main__":
    main()
