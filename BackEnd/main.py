from fastapi import FastAPI
import json

# Code runs before the app starts
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


@app.get("/")
def read_root():
    return {"message": "testing"}

@app.post("/search")
def search():
    # TODO
    # make a search function at search_similar / user_interface that integrates everything
    return

@app.get("/essays/{essays_id}")
def get_essay(essays_id: str):
    essay = app.state.essays.get(essays_id)
    if essay: 
        return essay
    return {"error": "Essay not found"}
