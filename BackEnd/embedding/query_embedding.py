"""
query_embedding.py

Input:
    A folder containing up to two .txt files
    - one for topic
    - one for content


Output:
    JSONL file where each line is:
    {
        "q_topic": "... or None",
        "q_content": "... or None",
        "topic_embedding": [... ] or None,
        "content_embedding": [... ] or None
    }

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

    topic_text = None
    content_text = None

    txt_files = list(folder.glob("*.txt")) # find the txt file in the path

    if len(txt_files) > 2:
        raise ValueError("Input folder should contain at most 2 .txt files (topic/content).")

    for file in txt_files:
        filename = file.stem.lower() # filename without .txt

        with open(file, "r", encoding="utf-8") as f:
            text = f.read().strip()
        
        if "topic" in filename:
            topic_text = text
        elif "content" in filename:
            content_text = text
        else:
            print(f"Warning: Cannot identify file type")
    
    return topic_text, content_text

def write_jsonl(records, output_path):
    """
    Append records to JSONL.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "a", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def get_embedding(text):
    """
    Generate normalized embedding for a text.
    Returns None if text is None or empty.
    """
    if text is None or text.strip() == "":
        return None

    response = client.embeddings.create(
        model=MODEL,
        input=text
    )

    embedding = response.data[0].embedding
    return normalize(embedding)

# =========================
# Main embedding logic
# =========================

def embed_queries(folder_path, output_file):
    topic, content = read_txt_files(folder_path)

    print("Detected files:")
    print(f"q_topic   = {'FOUND' if topic is not None else 'None'}")
    print(f"q_content = {'FOUND' if content is not None else 'None'}")

    topic_embedding = get_embedding(topic)
    content_embedding = get_embedding(content)

    record = {
        "q_topic": topic,
        "q_content": content,
        "topic_embedding": topic_embedding,
        "content_embedding": content_embedding
    }

    write_jsonl([record], output_file)

    print("\nEmbedding completed.")
    print(f"Output written to {output_file}")


# =========================
# Run
# =========================

if __name__ == "__main__":

    embed_queries(INPUT_FOLDER, OUTPUT_FILE)