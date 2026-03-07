from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from embedding.search_similar import load_db_embeddings
from pydantic import BaseModel
from typing import Optional, List
import json
import time

DB_JSONL = "Backend/drive_data/finalized_data_jsonl/database.jsonl"

# -----------------------------
# Request/Response Schemas
# -----------------------------
async def lifespan(app: FastAPI):
    print("startup")

    app.state.started_at = time.time()
    app.state.ready = False
    app.state.startup_error = None

    essays = {}
    
    try:
        # Loads our essays into a dict, shorter runtime, just load once
        with open("drive_data/finalized_data_jsonl/database.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                essay = json.loads(line)
                essays[essay["id"]] = essay

        ids, parent, V = load_db_embeddings(DB_JSONL)
        
        app.state.essays = essays
        app.state.ids = ids
        app.state.parent = parent
        app.state.V = V
        app.state.essay_count = len(essays)
        app.state.data_path = "drive_data/finalized_data_jsonl/database.jsonl"
        app.state.ready = True

        print(f"loaded {app.state.essay_count} essays")
    except Exception as e:
        app.state.essays = {}
        app.state.essay_count = 0
        app.state.ready = False
        app.state.startup_error = str(e)
        print(f"startup failed: {e}")

    yield  # Separates startup and shutdown

    print("shut down")
    
app = FastAPI(lifespan=lifespan)

# Allow frontend to make requests
app.add_middleware(CORSMiddleware,
    allow_origins=["http:/44.201.62:8000"],  # your frontend URL
    allow_methods=["*"],
    allow_headers=["*"]
)


# -----------------------------
# Request/Response Schemas
# -----------------------------


# -----------------------------
# Data loading / indexing functions
# -----------------------------
def load_essays_jsonl_as_dict():
    pass

def preview(text: str, max_chars: int = 200):
    if not text:
        return ""
    return text[:max_chars] + ("..." if len(text) > max_chars else "")

# -----------------------------
# Formatting / utility functions
# -----------------------------

def get_essay_info():
    pass
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

@app.post("/search")
def search():
    # TODO
    # make a search function at search_similar / user_interface that integrates everything
    return


