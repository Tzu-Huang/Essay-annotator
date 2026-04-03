from fastapi import HTTPException
from openai import OpenAI
import numpy as np
import os

from embedding.search_similar import cosine_search, classify_query_input
from embedding.make_embedding import embedding, normalize
from app.helpers import normalized_essay_type

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def embed_input(query: str):

    """
    Convert a single input string into a normalized embedding vector.

    Steps:
    1. Create OpenAI client
    2. Generate embedding for the query
    3. Take the first embedding result
    4. Normalize the vector before returning

    Returns:
        normalized embedding vector
    """
    
    vecs = embedding(client, query)
    vec = vecs[0]
    normalized = normalize(vec)
    return np.asarray(normalized, dtype=np.float32).reshape(-1)

def run_search(app_state, topK: int, essay_type: list, topic: str, content: str):
    """
    Run the full search pipeline.

    Responsibilities:
    1. Check whether server data is ready
    2. Determine which search mode to use
       - topic only
       - content only
       - both
    3. Build query embeddings
    4. Filter database rows by essay_type
    5. Run cosine similarity search
    6. Return final search results
    """

    # Ensure startup loading finished successfully
    if not getattr(app_state, "ready", False):
        print("503")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Server not ready",
                "startup_error": getattr(app_state, "startup_error", None),
            },
        )

    # Decide whether the user provided topic, content, or both
    mode = classify_query_input(topic, content)
    if mode == "invalid":
        print("400")
        raise HTTPException(
            status_code=400,
            detail="Provide at least one non-empty input: topic or content",
        )

    # Build topic embedding if topic exists; otherwise use zero vector
    topic_vec = (
        embed_input(topic)
        if isinstance(topic, str) and topic.strip()
        else np.zeros(app_state.topics.shape[1], dtype=np.float32)
    )

    print("topic_vec")
    # Build content embedding if content exists; otherwise use zero vector
    content_vec = (
        embed_input(content)
        if isinstance(content, str) and content.strip()
        else np.zeros(app_state.V.shape[1], dtype=np.float32)
    )

    print("Content_vec")
    if topic_vec.ndim != 1:
        print("topic_vec.ndim")
        raise HTTPException(status_code=500, detail=f"topic_vec must be 1D, got shape {topic_vec.shape}")

    if content_vec.ndim != 1:
        print("content_vec.ndim")
        raise HTTPException(status_code=500, detail=f"content_vec must be 1D, got shape {content_vec.shape}")
    
    types = app_state.types
    normalized_inputs = [normalized_essay_type(e) for e in essay_type]

    print("All good")

    allowed_idx = []

    # handle "all"
    if "all" in normalized_inputs:
        allowed_idx = list(range(len(types)))
    else:
        for idx, t in enumerate(types):
            if normalized_essay_type(t) in normalized_inputs:
                allowed_idx.append(idx)
                    
    """
    TODO
    curl -X POST "http://44.201.62.0:8000/search" \
    -H "Content-Type: application/json" \
    -d '{
        "topK": 5,
        "essay_type": ["all"],
        "topic": "leadership",
        "content": "I led a robotics team and built a drone"
    }'
    {"detail":"400: {'error': 'No essays found for essay_type', 'essay_type': '', 'available_types': ['personal statement', 'supplementals', 'uc piq']}"}

    current issue: it's not accepting any essay type, not sure if it's only all 
    but need to test on 
    """

    print("yaya")

    # If no matching essay type exists, return helpful error info
    if len(allowed_idx) == 0:
        available_types = sorted(
            list({
                normalized_essay_type(t)
                for t in types
                if isinstance(t, str) and t.strip()
            })
        )
        print("ya you")
        print(essay_type)
        print(available_types)
        raise HTTPException(
            status_code=400,
            detail={
                "error": "No essays found for essay_type",
                "essay_type": essay_type,
                "available_types": available_types,
            },
        )

    # Filter embeddings and metadata to the allowed subset
    V_filtered = app_state.V[allowed_idx]
    topic_V_filtered = app_state.topics[allowed_idx]

    ids_filtered = [app_state.ids[i] for i in allowed_idx]
    parent_filtered = [app_state.parent[i] for i in allowed_idx]
    previews_filtered = [app_state.previews[i] for i in allowed_idx]
    topic_texts_filtered = [app_state.topic_texts[i] for i in allowed_idx]
    schools_filtered = [app_state.schools[i] for i in allowed_idx]

    # Run similarity search on filtered data

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
        schools=schools_filtered
    )
    print("all godod")
    return results