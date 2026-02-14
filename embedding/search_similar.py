# Name: Zackery Liu
# Input: embed.jsonl (Database), user's query
# Output: top-k results (list[dict])

"""
Docstring for embedding.search_similar
Output: return top-k reuslts, including 
        1. rank
        2. id
        3. score
"""

import json
from pathlib import Path
import numpy as np

# =========================
# Config
# =========================
DB_JSONL = "data/embed_output/embed.jsonl"
QUERY_JSONL = "data/queries/queries.jsonl"
OUT_JSONL = "data/results/results.jsonl"
TOP_K = 5

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
                yield obj # Yield one record at a time for streaming processing

            except json.JSONDecodeError as e:
                # Very important for debugging bad lines
                print(f"[JSON ERROR] line {idx}: {e}")
                print("Preview:", line[:120])

def load_db_embeddings(db_path: str):
    """
    Input: db jsonl
    Output:
      - ids: list[str] length N
      - V: np.ndarray shape (N, d) float32
    """
    
    ids = []
    vecs = []

    for obj in read_jsonl(db_path):
        rid = obj.get("id")