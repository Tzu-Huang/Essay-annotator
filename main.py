from fastapi import FastAPI
import json
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "testing"}

@app.get("/essays/{essays_id}/{content}")
def test(essays_id: str, content: str):
    with open("data/finalized_data_jsonl/database.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            essay = json.loads(line)
            if essay["id"] == essays_id:
                return essay["content"]
            
@app.get("/essays/{essays_id}")
def test(essays_id: str):
    with open("data/finalized_data_jsonl/database.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            essay = json.loads(line)
            if essay["id"] == essays_id:
                return essay