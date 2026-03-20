from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from embedding.search_similar import load_db_embeddings, cosine_search, classify_query_input
from embedding.make_embedding import embedding, normalize
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, List
from openai import OpenAI
import numpy as np
import json
import os
from pathlib import Path
import time

BASE = Path(__file__).parent

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
print("OPENAI KEY: ", bool(os.environ.get("OPENAI_API_KEY")))

DB_JSONL   = BASE / "drive_data/finalized_data_jsonl/database.jsonl"
EMBED_JSONL = BASE / "drive_data/embed_output/embed.jsonl"

# -----------------------------
# Request/Response Schemas
# -----------------------------
async def lifespan(app: FastAPI):
    print("startup")

    app.state.started_at = time.time()
    app.state.ready = False
    app.state.startup_error = None

    essays = {}
    types = []
    
    try:
        # Loads our essays into a dict, shorter runtime, just load once
        with open(DB_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                essay = json.loads(line)
                essays[essay["id"]] = essay

        # load embeddings to do cosine similarity
        # TODO add topic
        ids, parent, previews, topic_texts, topics, V = load_db_embeddings(EMBED_JSONL)
        types = [essays[pid]["type"] if pid in essays else "unknown" for pid in parent]
        
        app.state.essays = essays
        app.state.ids = ids
        app.state.parent = parent
        app.state.V = V
        app.state.topics = topics
        app.state.previews = previews
        app.state.topic_texts = topic_texts
        app.state.types = types

        app.state.essay_count = len(essays)
        app.state.data_path = "drive_data/finalized_data_jsonl/database.jsonl"
        app.state.ready = True

        print(f"loaded {app.state.essay_count} essays")

    except Exception as e:
        app.state.essays = {}
        app.state.essay_count = 0
        app.state.ids = []          
        app.state.parent = []       
        app.state.previews = []     
        app.state.topic_texts = []
        app.state.V = None          
        app.state.types = []        
        app.state.ready = False
        app.state.startup_error = str(e)
        print(f"startup failed: {e}")

    yield  # Separates startup and shutdown

    print("shut down")
    
app = FastAPI(lifespan=lifespan)

# Allow frontend to make requests
app.add_middleware(CORSMiddleware,
    allow_origins=["http://44.201.62.0:8000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",   # Vite 常見
        "http://127.0.0.1:5173",         
                   
    ],  # your frontend URL
    
    allow_methods=["*"],
    allow_headers=["*"]
)

# -----------------------------
# Helper functions
# -----------------------------

def preview(text: str, max_chars: int = 200):
    if not text:
        return ""
    return text[:max_chars] + ("..." if len(text) > max_chars else "")

def get_essay_info(essay):
    return {
        "id": essay["id"], 
        "title": essay["title"], 
        "preview": preview(essay["content"])
    }

def normalize_essay_type(value: Optional[str]) -> str:
    if not isinstance(value, str):
        return ""

    normalized = value.strip().lower()
    aliases = {
        "uc": "uc piq",
        "piq": "uc piq",
        "ucpiq": "uc piq",
        "supplemental": "supplementals",
    }
    return aliases.get(normalized, normalized)


# -----------------------------
# Routes
# ----------------------------
@app.get("/health")
def health():
    """
    Liveness: service process is running.
    (Should return 200 even if not ready)
    """
    uptime = int(time.time() - app.state.started_at)
    return {
        "status": "ok",
        "uptime_sec": uptime,
        "ready": bool(getattr(app.state, "ready", False)),
        "essay_count": int(getattr(app.state, "essay_count", 0)),
        "data_path": str(getattr(app.state, "data_path", "")),
        "startup_error": getattr(app.state, "startup_error", None),
    }

@app.get("/ready")
def ready():
    """
    Readiness: Ready: 200, or else: 503
    """
    if not getattr(app.state, "ready", False):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "startup_error": getattr(app.state, "startup_error", "unknown"),
            },
        )

    return {"status": "ready", "essay_count": getattr(app.state, "essay_count", 0)}

@app.get("/")
def read_root():
    return {"message": "EssayLens API is running"}


DEFAULT_FIELDS = ["id", "topic", "type", "school", "public"]
ALLOWED_FIELDS = set(DEFAULT_FIELDS + ["content", "source_file", "metadata"])
@app.get("/essays/{essay_id}")
def get_essay(
    essay_id: str,
    fields: Optional[str] = Query(default=None, description="Comma-separated fields, e.g. topic,school,content"),
    include_content: bool = Query(default=False),
):
    essay = app.state.essays.get(essay_id)

    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    
    # if not essay.get("public", False):
    #    return {"error": "This essay is not public"}

    if fields is None:
        selected = set(DEFAULT_FIELDS)
        if include_content:
                selected.add("content")
    else:
        selected = {f.strip() for f in fields.split(",") if f.strip()}
        unknown = selected - ALLOWED_FIELDS
        if unknown:
            raise HTTPException(
                status_code=400,
                detail={"error": "Unknown fields", "unknown_fields": sorted(list(unknown))}
            )
    result = {}
    for k in selected:
        result[k] = essay.get(k)

    result["id"] = essay.get("id", essay_id)
    return result

def embed_input(query: str):
    """
    Create a normalized embedding for a single query.
    """
    client = OpenAI(api_key = os.environ["OPENAI_API_KEY"])
    
    vecs = embedding(client, query)
    vec = vecs[0]
    V = normalize(vec)
    return V

# ===========================
# Search endpoint
# ===========================
@app.post("/search")
def search(topK: int, essay_type, topic, content):

    print(f"INPUT: topK={topK}, essay_type={essay_type}, topic={topic}, content={content}")

    if not getattr(app.state, "ready", False):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Server not ready",
                "startup_error": getattr(app.state, "startup_error", None),
            },
        )

    mode = classify_query_input(topic, content)
    if mode == "invalid":
        raise HTTPException(
            status_code=400,
            detail="Provide at least one non-empty input: topic or content",
        )
    
    topic_vec = np.array(embed_input(topic)) if (isinstance(topic, str) and topic.strip()) else np.zeros(app.state.topics.shape[1], dtype=np.float32)
    content_vec = np.array(embed_input(content)) if (isinstance(content, str) and content.strip()) else np.zeros(app.state.V.shape[1], dtype=np.float32)

    print(f"DEBUG topic_vec[:5]: {topic_vec[:5]}")    # first 5 values
    print(f"DEBUG content_vec[:5]: {content_vec[:5]}")

    types = app.state.types
    essay_type = normalize_essay_type(essay_type)

    # filter out essay types with their corresponding ids
    if essay_type == "all":
        # arange generates a numpy array up to the length of the object  
        allowed_idx = np.arange(len(types))
    else:
        allowed_idx = [i for i, t in enumerate(types) if normalize_essay_type(t) == essay_type]

    if len(allowed_idx) == 0:
        available_types = sorted(list({normalize_essay_type(t) for t in types if isinstance(t, str) and t.strip()}))
        raise HTTPException(
            status_code=400,
            detail={
                "error": "No essays found for essay_type",
                "essay_type": essay_type,
                "available_types": available_types,
            },
        )
    
    V_filtered = app.state.V[allowed_idx]
    topic_V_filtered = app.state.topics[allowed_idx]

    ids_filtered = [app.state.ids[i] for i in allowed_idx]
    parent_filtered = [app.state.parent[i] for i in allowed_idx]
    previews_filtered = [app.state.previews[i] for i in allowed_idx]
    topic_texts_filtered = [app.state.topic_texts[i] for i in allowed_idx]
    # cosine search: 
    # handles dot product, sorting, get top K, remove duplicate parent id
    _, results = cosine_search(
        ids_filtered, 
        parent_filtered, 
        previews_filtered,
        topic_V_filtered,
        V_filtered,
        topic_vec,
        content_vec, 
        mode,
        topK,
        topic_texts=topic_texts_filtered,
    )
    
    return results