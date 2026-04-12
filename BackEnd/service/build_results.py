

def similarity_label(score: float) -> str:
    percentage = max(score, 0) ** 0.5 * 100

    return round(percentage)

def build_results(indices, scores, app_state):
    results = []

    for rank, i in enumerate(indices, start=1):
        results.append({
            "rank":rank,
            "parent_id": app_state.parent[i],
            "id": app_state.ids[i],
            "topic": app_state.topic_texts[i],
            "content_preview": app_state.previews[i],
            "school": app_state.schools[i],
            "type": app_state.types[i],
            "similarity": similarity_label(scores[i]),
        })

    return results