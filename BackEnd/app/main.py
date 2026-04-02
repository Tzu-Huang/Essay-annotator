from urllib import request

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from embedding.search_similar import load_db_embeddings
from dotenv import load_dotenv
from typing import Optional
import json
import os
from pathlib import Path
import time
from pydantic import BaseModel
# new import
from app.helpers import preview, normalized_essay_type, get_essay_info
from app.search_service import run_search
from compare_results.analysis import compare

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
# print("OPENAI KEY: ", bool(os.environ.get("OPENAI_API_KEY")))

BASE = Path(__file__).resolve().parent.parent
DB_JSONL = BASE / "drive_data/finalized_data_jsonl/database.jsonl"
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
# Routes
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "EssayLens API is running"}

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

# ===========================
# Search endpoint
# ===========================

class Search(BaseModel):
    topK: int
    essay_type: str
    topic: str
    content: str

@app.post("/search")
async def search(req: Search):
    """
    Search for similar essays based on topic/content input.
    Delegates the full search logic to search_service.run_search().
    """
    body = await request.json()
    print("RAW BODY:", body)
    return {"received": body}
    # return run_search(app.state, req.topK, req.essay_type, req.topic, req.content)


# ===========================
# Compare endpoint
# ===========================
class CompareRequest(BaseModel):
    user_input: str
    essay_id: str

# req: automatically change to the right format for backend
@app.post("/compare")
def compare_api(req: CompareRequest):
    # Load essays from app.state
    essays = app.state.essays
    essay = essays.get(req.essay_id)
    
    # Error handling
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    
    if not req.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input cannot be empty")

    essay_text = essay.get("content", "")
    try:
        # Call the actual function that do the actual comparison
        result = compare(user_essay=req.user_input, sample_essay=essay_text)
        return result
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Compare failed: {str(e)}")