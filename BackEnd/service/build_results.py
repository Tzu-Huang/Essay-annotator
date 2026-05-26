def similarity_label(score: float) -> str:
    percentage = max(score, 0) ** 0.5 * 100

    return round(percentage)

def build_results(indices, scores, app_state):
    results = []

    for rank, i in enumerate(indices, start=1):
        parent_id = app_state.parent[i]

        # Pull full essay to compute word_count — content is not stored in the
        # embedding index so we look it up from the essays dict
        essay = app_state.essays.get(parent_id, {})
        content = essay.get("content", "")
        word_count = len(content.split()) if content else 0

        results.append({
            "rank": rank,
            "parent_id": parent_id,
            "id": app_state.ids[i],
            "topic": app_state.topic_texts[i],
            "content_preview": app_state.previews[i],
            "school": app_state.schools[i],
            "type": app_state.types[i],
            "similarity": similarity_label(scores[i]),
            "word_count": word_count,
            "hero_image": essay.get("hero_image", ""),
        })

    return results