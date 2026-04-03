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
TOPIC_WEIGHT = 0.3
CONTENT_WEIGHT = 0.7

# This is currently the main def that shows the preview text
def preview_text(text: str, max_len:int = 200) -> str:
    if not text:
        return ""
    
    text = text.strip()
    if len(text) <= max_len:
        return text
    
    cut = text[:max_len]
    last_space = cut.rfind(" ")
    last_punct = max(cut.rfind("."), cut.rfind(","), cut.rfind(";"), cut.rfind("!"), cut.rfind("?"))

    split_pos = max(last_space, last_punct)
    # prevent you cut way too early
    if split_pos < max_len * 0.6:
        split_pos = max_len

    preview = text[:split_pos].rstrip() + "..."
    return preview

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

def classify_query_input(q_topic, q_content):
    topic_ok = isinstance(q_topic, str) and q_topic.strip() != ""
    content_ok = isinstance(q_content, str) and q_content.strip() != ""

    if not topic_ok and not content_ok:
        return "invalid"
    elif topic_ok and not content_ok:
        return "topic_only"
    elif not topic_ok and content_ok:
        return "content_only"
    else:
        return "hybrid"

def load_query_embeddings(q_path: str):

    queries = []
    topic_q_emb = []
    content_q_emb = []

    dim = None

    for obj in read_jsonl(q_path):
        q_topic = obj.get("q_topic")
        q_content = obj.get("q_content")

        topic_emb = obj.get("topic_embedding")
        content_emb = obj.get("content_embedding")

        # 🔥 NEW: classify input
        mode = classify_query_input(q_topic, q_content)

        # ❌ no input → skip
        if mode == "invalid":
            print("[ERROR] Query input empty. Need topic or content.")
            continue

        has_topic_emb = isinstance(topic_emb, list) and len(topic_emb) > 0
        has_content_emb = isinstance(content_emb, list) and len(content_emb) > 0

        if dim is None:
            if has_topic_emb:
                dim = len(topic_emb)
            elif has_content_emb:
                dim = len(content_emb)

        if dim is None:
            print("[ERROR] No embeddings found in query.")
            continue

        if has_topic_emb and len(topic_emb) != dim:
            print("[WARN] topic embedding dimension mismatch")
            continue

        if has_content_emb and len(content_emb) != dim:
            print("[WARN] content embedding dimension mismatch")
            continue

        # 🔥 ensure embedding matches mode
        if mode in ("topic_only", "hybrid") and not has_topic_emb:
            print("[ERROR] topic exists but embedding missing")
            continue

        if mode in ("content_only", "hybrid") and not has_content_emb:
            print("[ERROR] content exists but embedding missing")
            continue

        if not has_topic_emb:
            topic_emb = [0.0] * dim

        if not has_content_emb:
            content_emb = [0.0] * dim

        queries.append({
            "q_topic": q_topic,
            "q_content": q_content,
            "mode": mode   # 🔥 NEW
        })

        topic_q_emb.append(topic_emb)
        content_q_emb.append(content_emb)

    if len(topic_q_emb) == 0 or len(content_q_emb) == 0:
        return queries, None, None

    topic_q_V = np.array(topic_q_emb, dtype=np.float32)
    content_q_V = np.array(content_q_emb, dtype=np.float32)

    return queries, topic_q_V, content_q_V
 
def load_db_embeddings(db_path: str):
    """
    Input: db jsonl

    Output:
      - ids: list[str]
      - parent: list[str | None]
      - previews: list[str]
        - topic_texts: list[str]
      - topic_V: np.ndarray shape (N, d)
      - content_V: np.ndarray shape (N, d)
    """

    ids = []
    parent = []
    previews = []
    topic_texts = []
    topic_vecs = []
    content_vecs = []

    dim = None

    for obj in read_jsonl(db_path):
        rid = obj.get("id")
        pid = obj.get("parent_id")

        topic_emb = obj.get("topic_embedding")
        content_emb = obj.get("content_embedding")

        if not isinstance(rid, str):
            print("[WARN] Invalid id, skipping record")
            continue

        has_topic = isinstance(topic_emb, list) and len(topic_emb) > 0
        has_content = isinstance(content_emb, list) and len(content_emb) > 0

        if not has_topic and not has_content:
            print(f"[WARN] Invalid embeddings for id: {rid}")
            continue

        if dim is None:
            if has_topic:
                dim = len(topic_emb)
            elif has_content:
                dim = len(content_emb)

        if has_topic and len(topic_emb) != dim:
            print(f"[WARN] topic embedding dimension mismatch for id: {rid}")
            continue

        if has_content and len(content_emb) != dim:
            print(f"[WARN] content embedding dimension mismatch for id: {rid}")
            continue

        if not has_topic:
            topic_emb = [0.0] * dim

        if not has_content:
            content_emb = [0.0] * dim

        ids.append(rid)
        parent.append(pid)
        previews.append(preview_text(obj.get("content", "")))
        topic_texts.append((obj.get("topic") or "").strip())
        topic_vecs.append(topic_emb)
        content_vecs.append(content_emb)

    if len(topic_vecs) == 0 or len(content_vecs) == 0:
        return ids, parent, previews, topic_texts, None, None

    topic_V = np.array(topic_vecs, dtype=np.float32)
    content_V = np.array(content_vecs, dtype=np.float32)

    return ids, parent, previews, topic_texts, topic_V, content_V

def check_shape(topic_V, content_V, topic_q_V, content_q_V):
    if topic_V is None or content_V is None:
        print("[ERROR] DB embedding matrix is empty. Check DB_JSONL / embedding key.")
        return False

    if topic_q_V is None or content_q_V is None:
        print("[ERROR] Query embedding matrix is empty. Check QUERY_JSONL / embedding key.")
        return False

    if topic_V.size == 0 or content_V.size == 0:
        print("[ERROR] DB embedding matrix is empty.")
        return False

    if topic_q_V.size == 0 or content_q_V.size == 0:
        print("[ERROR] Query embedding matrix is empty.")
        return False

    if topic_V.ndim != 2 or content_V.ndim != 2 or topic_q_V.ndim != 2 or content_q_V.ndim != 2:
        print("[ERROR] Embedding arrays must be 2D matrices.")
        return False

    if not (
        topic_V.shape[1] == content_V.shape[1] ==
        topic_q_V.shape[1] == content_q_V.shape[1]
    ):
        print("[ERROR] Embedding dimensions do not match.")
        print("topic_V shape:", topic_V.shape)
        print("content_V shape:", content_V.shape)
        print("topic_q_V shape:", topic_q_V.shape)
        print("content_q_V shape:", content_q_V.shape)
        return False

    return True

def cosine_search(
    ids,
    parent,
    previews,
    topic_V,
    content_V,
    topic_vec,
    content_vec,
    mode,
    TOP_K,
    types,
    topic_weight=0.3,
    content_weight=0.7,
    topic_texts=None,
    schools=None
):
    """
    Compute cosine similarity for one query against entire DB.

    Cases:
    1. only topic   -> compare topic only
    2. only content -> compare content only
    3. both         -> weighted topic + content
    """

    topic_scores = topic_V @ topic_vec
    content_scores = content_V @ content_vec

    if mode == "topic_only":
        scores = topic_scores

    elif mode == "content_only":
        scores = content_scores

    elif mode == "hybrid":
        scores = topic_weight * topic_scores + content_weight * content_scores

    else:
        print("[ERROR] Invalid query mode")
        return "invalid", []

    sorted_idx = np.argsort(-scores)

    results = []
    seen_parents = set()

    for i in sorted_idx:
        pid = parent[i]

        if pid in seen_parents:
            continue

        results.append({
            "rank": len(results) + 1,
            "parent_id": pid,
            "id": ids[i],
            "topic": topic_texts[i] if topic_texts is not None and i < len(topic_texts) else None,
            "score": float(scores[i]),
            "topic_score": float(topic_scores[i]),
            "content_score": float(content_scores[i]),
            "content_preview": previews[i],
            "school": schools[i] if schools else "none",
            "type": types[i] if types else "none"
        })

        seen_parents.add(pid)

        if len(results) == TOP_K:
            break

    return mode, results

def write_jsonl(path: str, records: list[dict]):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def main():
    ids, parent, previews, topic_texts, topic_V, content_V = (load_db_embeddings(DB_JSONL))
    queries, topic_q_V, content_q_V = (load_query_embeddings(QUERY_JSONL))

    if not check_shape(topic_V, content_V, topic_q_V, content_q_V):
        return
    
    outputs = []

    for q_obj, topic_vec, content_vec in zip(queries, topic_q_V, content_q_V):
        mode, hits = cosine_search(
            ids=ids,
            parent=parent,
            previews=previews,
            topic_V=topic_V,
            content_V=content_V,
            topic_vec=topic_vec,
            content_vec=content_vec,
            mode=q_obj["mode"],  
            TOP_K=TOP_K,
            topic_weight=TOPIC_WEIGHT,
            content_weight=CONTENT_WEIGHT,
            topic_texts=topic_texts,
        )
        outputs.append({
            "q_topic": q_obj["q_topic"],
            "q_content": q_obj["q_content"],
            "mode": mode,
            "top_k": TOP_K,
            "results": hits
        })

    write_jsonl(OUT_JSONL, outputs)
    print(f"[OK] Wrote {len(outputs)} query results -> {OUT_JSONL}")

if __name__ == "__main__":
    main()
   
    


