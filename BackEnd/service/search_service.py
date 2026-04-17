from fastapi import HTTPException
from openai import OpenAI
import numpy as np
import os

from service.build_results import build_results
from embedding.search_similar import cosine_search, classify_query_input
from embedding.make_embedding import get_query_embedding


def get_client():
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def get_optional_query_embedding(text: str | None, client, dim: int) -> np.ndarray:
    if isinstance(text, str) and text.strip():
        return get_query_embedding(text, client)
    return np.zeros(dim, dtype=np.float32)

def run_search(req, app_state):
    client = get_client()
    
    # Parameters
    topK = req.topK
    essay_types = req.essay_types
    topic = req.topic
    content = req.content

    # mode
    mode = classify_query_input(topic, content) # Which search mode: topic only, content only, or both
    if mode == "invalid":
        raise HTTPException(
        status_code=400,
        detail="Need topic or content",
    )
    
    # dimension
    dim = app_state.topic_V.shape[1] # Both topic and content can use this dim because they are from the same model

    # topic_vec
    topic_vec = get_optional_query_embedding(topic, client, dim)

    # content_vec
    content_vec = get_optional_query_embedding(content, client, dim)

    # cosine_search
    indices, scores = cosine_search(
        topic_V=app_state.topic_V,
        content_V=app_state.content_V,
        topic_vec=topic_vec,
        content_vec=content_vec,
        mode=mode,
        top_k=topK,
        parent_ids =app_state.parent
    )
    print("essay_types:", essay_types, type(essay_types))
    results = build_results(indices, scores, app_state)
    
    # essay_types filter 
    if essay_types and "all" not in essay_types:
        results = [r for r in results if r["type"] in essay_types]

    return results