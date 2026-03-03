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
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from openai import OpenAI
import os

# =========================
# Config
# =========================
DB_JSONL = "data/drive_data/finalized_data_jsonl/database.jsonl"
QUERY_JSONL = "data/testing/queries.jsonl"
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
        emb = obj.get("content_embedding")

        if not isinstance(rid, str):
            print("Invalid id")
            continue

        if not isinstance(emb, list) or len(emb) == 0:
            print("Invalid embedding for id:", rid)
            continue

        ids.append(rid)
        vecs.append(emb)

    # Convert vecs to Numpy matrix in order to do the dot product
    V = np.array(vecs, dtype=np.float32)
    return ids, V

def load_query_embeddings(q_path: str):

    query = []
    q_emb = []

    for obj in read_jsonl(q_path):
        content = obj.get("query")
        emb = obj.get("query_embedding")

        if not isinstance(content, str):
            print("Invalid content")
            continue
        if not isinstance(emb, list) or len(emb) == 0:
            print("Invalid embedding for content: ", content[:20])
            continue
        query.append(content)
        q_emb.append(emb)

    q_V = np.array(q_emb, dtype=np.float32)

    # return: shape=(number of queries, dimension of embedding)
    return query, q_V # text and vector (embedding numbers)

def check_shape(V, q_V):
    if V.size == 0:
        print("[ERROR] DB embedding matrix is empty. Check DB_JSONL / embedding key.")
        return False
    if q_V.size == 0:
        print("[ERROR] Query embedding matrix is empty. Check QUERY_JSONL / embedding key.")
        return False
    if V.ndim != 2 or q_V.ndim != 2:
        print("[ERROR] Embedding arrays must be 2D matrices.")
        return False
     
    return V.shape[1] == q_V.shape[1]

def cosine_search(ids, V, q_vec, TOP_K):
    """
    Compute Cosine similarity for one query against entire DB.
    """
    scores = V @ q_vec
    # print(scores.shape[0])

    k = min(TOP_K, scores.shape[0])

    # argpartition(): find the lowest k index
    # -scores: reverse so that we get the highest k index
    # k-1: we aim to divide the array into two parts: the first k smallest elements and the remaining 
    # O(N) instead of O(N log N)
    idx = np.argpartition(-scores, k-1)[:k] # Order is not guarantee

    # scores[idx]: [0.77, 0.91]
    # -scores[idx]: [-0.77, -0.91]
    # argsort(): [1, 0]
    # idx[]: [0.91, 0.77]
    idx = idx[np.argsort(-scores[idx])]

    results = []
    for rank, i in enumerate(idx, start=1):
        results.append({
            "rank": rank,
            "id": ids[i],
            "score": float(scores[i])
        })

    return results

def write_jsonl(path: str, records: list[dict]):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def main():
    ids, V = (load_db_embeddings(DB_JSONL))
    queries, q_V = (load_query_embeddings(QUERY_JSONL))
    # print()
    print(q_V)
    if not check_shape(V, q_V):
        return
    
    outputs = []
    for q_text, q_vec, in zip(queries, q_V):
        hits = cosine_search(ids, V, q_vec, TOP_K)
        outputs.append({
            "query": q_text,
            "top_k": TOP_K,
            "results": hits
        })

    write_jsonl(OUT_JSONL, outputs)
    print(f"[OK] Wrote {len(outputs)} query results -> {OUT_JSONL}")




if __name__ == "__main__":
    main()
   
    

