import time
import json
from app.helpers import load_essays
from service.search_service import run_search
from app.state import AppData
from compare_results.analysis import compare
from dotenv import load_dotenv
from embedding.search_similar import load_db_embeddings
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from typing import Optional


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

    data = AppData(
        started_at=time.time(),
    )
    
    try:
        essays = load_essays(DB_JSONL)

        ids, parent, previews, topic_texts, topic_V, content_V = load_db_embeddings(EMBED_JSONL)
        types = [essays[pid]["type"] if pid in essays else "unknown" for pid in parent]
        schools = [essays[pid].get("school", "Unknown") if pid in essays else "none" for pid in parent]
        
        data.essays = essays
        data.ids = ids
        data.parent = parent
        data.previews = previews
        data.topic_texts = topic_texts       
        data.types = types
        data.schools = schools
        data.topic_V = topic_V
        data.content_V = content_V
        data.ready = True

        print(f"loaded {data.essay_count} essays")

    except Exception as e:
        data.startup_error = str(e)
        data.ready = False
        print(f"startup failed: {e}")

    app.state.data = data

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
    data = app.state.data
    uptime = int(time.time() - data.started_at)
    return {
        "status": "ok",
        "uptime_sec": uptime,
        "ready": data.ready,
        "essay_count": data.essay_count,
        "data_path": data.data_path,
        "startup_error": data.startup_error,
    }

@app.get("/ready")
def ready():
    """
    Readiness: Ready: 200, or else: 503
    """
    data = app.state.data
    if not data.ready:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "startup_error": data.startup_error or "unknown",
            },
        )

    return {"status": "ready", "essay_count": data.essay_count}

DEFAULT_FIELDS = ["id", "topic", "type", "school", "public"]
ALLOWED_FIELDS = set(DEFAULT_FIELDS + ["content", "source_file", "metadata"])

# TODO: frontend is taking parent id
@app.get("/essays/{essay_id}")
def get_essay(
    essay_id: str,
    fields: Optional[str] = Query(default=None, description="Comma-separated fields, e.g. topic,school,content"),
    include_content: bool = Query(default=False),
):
    data = app.state.data
    essay = data.essays.get(essay_id)

    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")

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

    # originally this get "id" will get the chunked id ? 
    result["id"] = essay.get("id", essay_id)
    return result

# ===========================
# Search endpoint
# ===========================

class Search(BaseModel):
    topK: int
    essay_types: list
    topic: str
    content: str
    
@app.post("/search")
def search(req: Search, request: Request):
    """
    Search for similar essays based on topic/content input.
    Delegates the full search logic to search_service.run_search().
    """

    try: 
        results = run_search(req, request.app.state.data)

        print(results)
        return results

    except Exception as e:
        print("[Error] /search API did not run successfully")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ===========================
# Compare endpoint
# ===========================
class CompareRequest(BaseModel):
    user_input: str

# req: automatically change to the right format for backend
@app.post("/compare/{essay_id}")
def compare_api(essay_id: str, req: CompareRequest):
    # Load essays from app.state
    data = app.state.data
    
    # Error handling
    if not hasattr(data, "essays"):
        raise HTTPException(status_code=500, detail="Server essays data not initialized")

    essay = data.essays.get(essay_id)
    print(essay)
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
