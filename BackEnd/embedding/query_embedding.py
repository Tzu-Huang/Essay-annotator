"""
query_embedding.py

Input:
    A folder containing .txt files (each file = one query)

Output:
    JSONL file where each line is:
    {"query": "...", "query_embedding": [...]}

Embeddings are normalized.
"""

import os
import json
from pathlib import Path
from openai import OpenAI
from make_embedding import normalize


# =========================
# Config
# =========================

INPUT_FOLDER = "drive_data/query_input"
OUTPUT_FILE = "drive_data/query_embed/query_embeddings.jsonl"
MODEL = "text-embedding-3-small"


# =========================
# Setup OpenAI client
# =========================

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


# =========================
# Helper functions
# =========================

def read_txt_files(folder_path):
    """
    Yield (filename, text) for each txt file.
    """
    folder = Path(folder_path)

    for file in folder.glob("*.txt"):
        with open(file, "r", encoding="utf-8") as f:
            text = f.read().strip()
            yield file.name, text


def write_jsonl(records, output_path):
    """
    Append records to JSONL.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "a", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


# =========================
# Main embedding logic
# =========================

def embed_queries(folder_path, output_file):

    results = []

    for filename, query in read_txt_files(folder_path):

        print(f"Embedding query from {filename}")

        response = client.embeddings.create(
            model=MODEL,
            input=query
        )

        embedding = response.data[0].embedding

        # normalize embedding
        embedding = normalize(embedding)

        record = {
            "query": query,
            "query_embedding": embedding
        }

        results.append(record)

    write_jsonl(results, output_file)

    print("\nEmbedding completed.")
    print(f"Output written to {output_file}")


# =========================
# Run
# =========================

if __name__ == "__main__":

    embed_queries(INPUT_FOLDER, OUTPUT_FILE)