from fastapi import FastAPI
import json
from search_similar import
app = FastAPI()

@app.get("/")
def read_root():
    

def f1():
def f2

def read_jsonl
@app.get("/essays/{essays_id}/content")
def get_content(essays_id: str, content: str):
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
            
@app.get("/essays/{essays_id}/public")
def test(essays_id: str):
    with open("data/finalized_data_jsonl/database.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            essay = json.loads(line)
            if essay["id"] == essays_id:
                return essay
            

