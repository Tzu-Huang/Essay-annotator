from fastapi import FastAPI
from fastapi import Query
import json

# -----------------------------
# Request/Response Schemas
# -----------------------------
async def lifespan(app: FastAPI):
    print("startup")
    essays = {}

    # Loads our essays into a dict, shorter runtime, just load once
    with open("data/finalized_data_jsonl/database.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            essay = json.loads(line)
            essays[essay["id"]] = essay

    app.state.essays = essays

    yield  # Separates startup and shutdown

    print("shut down")
    
app = FastAPI(lifespan=lifespan)

# -----------------------------
# Request/Response Schemas
# -----------------------------
def preview(text: str, max_chars: int) -> str:
    # Preview text
    pass

# -----------------------------
# Data loading / indexing functions
# -----------------------------
def load_essays_jsonl_as_dict():
    pass

def build_search_docs():
    pass


# -----------------------------
# Formatting / utility functions
# -----------------------------
def preview():
    pass

def get_essay_info():
    pass
# -----------------------------
# Routes
# ----------------------------
@app.get("/")
def read_root():
    return "This is the home page of the API from Essay-Annotator"

@app.get("/essays/{essay_id}")
def get_essayInfo(essay_id: str, include_content: bool = Query(default=False),):
    essay = app.state.essays.get(essay_id)

    if not essay:
        return {"Error": "Essay not found"}
    
    # if not essay.get("public", False):
    #    return {"error": "This essay is not public"}

    result = {
        "id": essay["id"],
        "topic": essay.get("topic"),
        "school": essay.get("school"),
        "type": essay.get("type"),
        "public": essay.get("public"),
    }

    if include_content:
        result["content"] = essay.get("content")

    return result

@app.get("/essays/{essays_id}/content")
def get_essay_content(essays_id: str):
    essay = app.state.essays.get(essays_id)
    if not essay:
        return {"error": "Essay not found"}

    content = essay.get("content")
    if content is None:
        return {"error": "No content field in this essay"}

    return {"id": essays_id, "content": content}

@app.post("/search")
def search():
    # TODO
    # make a search function at search_similar / user_interface that integrates everything
    return


