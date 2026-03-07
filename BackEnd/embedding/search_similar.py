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

# =========================
# Config
# =========================
DB_JSONL = "drive_data/embed_output/embed.jsonl"
QUERY_JSONL = "drive_data/query_embed/query_embeddings.jsonl"
OUT_JSONL = "drive_data/results/results.jsonl"
TOP_K = 5


def first_200_chars(text: str) -> str:
    clean = (text or "").replace("\n", " ").strip()
    return clean[:200]

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
    
    ids, parent, vecs, previews = [], [], [], []

    for obj in read_jsonl(db_path):
        rid = obj.get("id")
        pid = obj.get("parent_id")
        emb = obj.get("content_embedding")

        if not isinstance(rid, str):
            print("[WARN] Invalid id, skipping record")
            continue

        if not isinstance(emb, list) or len(emb) == 0:
            print(f"[WARN] Invalid embedding for id: {rid}")
            continue

        ids.append(rid)
        vecs.append(emb)
        parent.append(pid)
        previews.append(first_200_chars(obj.get("content", "")))

    # Convert vecs to Numpy matrix in order to do the dot product
    V = np.array(vecs, dtype=np.float32)
    return ids, parent, previews, V

def load_query_embeddings(q_path: str):

    query = []
    q_emb = []

    # NOTE: from front end, we should get two inputs, and save it in dict, 
    # so we can get it here
    for obj in read_jsonl(q_path):
        # topic = obj.get("topic")
        # paragraph = obj.get("paragraph")

        # topic_emb = 
        # Accept either key name based on producer format.
        content = obj.get("essay") or obj.get("query")
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

def cosine_search(ids, parent, previews, V, q_vec, TOP_K):
    """
    Compute Cosine similarity for one query against entire DB.
    """
    scores = V @ q_vec

    # full sort, all candidates, handle too many duplicates
    sorted_idx = np.argsort(-scores)

    results = []
    seen_parents = set()  # stores unique values, average runtime O(1)
    
    for i in sorted_idx: 
        pid = parent[i]

        if pid in seen_parents:
            continue
        
        results.append({
            "rank": len(results)+1,
            "parent_id": pid,
            "id": ids[i],
            "score": float(scores[i]),
            "content_preview": previews[i]
        })

        seen_parents.add(pid)

        if len(results) == TOP_K:
            break

    return results

def write_jsonl(path: str, records: list[dict]):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def main():
    ids, parent, previews, V = (load_db_embeddings(DB_JSONL))
    queries, q_V = (load_query_embeddings(QUERY_JSONL))

    if not check_shape(V, q_V):
        return
    
    outputs = []
    for q_text, q_vec, in zip(queries, q_V):
        hits = cosine_search(ids, parent, previews, V, q_vec, TOP_K)
        outputs.append({
            # TODO
            # "topic": 
            # "paragraph"
            "query": q_text, # split this
            "top_k": TOP_K,
            "results": hits
        })

    write_jsonl(OUT_JSONL, outputs)
    print(f"[OK] Wrote {len(outputs)} query results -> {OUT_JSONL}")


if __name__ == "__main__":
    main()
   
    


