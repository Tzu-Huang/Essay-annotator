from embedding.make_embedding import build_output_record, chunk_text, embedding, normalize


def embed_essay(essay: dict, client) -> list[dict]:
    """
    Chunk and embed a single essay's content, returning chunk records ready
    to write to embed.jsonl. Mirrors the per-essay logic inside
    embedding.make_embedding.update_embeddings(), extracted so it can run
    outside the full-database batch job (see plan for regenerate-embedding /
    import-new-essays call sites).

    essay: dict with keys id, topic, content, type, school, public, source_file
    client: an OpenAI client (or compatible mock) accepted by embedding()
    """
    chunks = chunk_text(essay["content"])

    # normalize() only accepts a single vector (see make_embedding.normalize),
    # so each embedding result is normalized individually rather than as a batch.
    topic_vec = normalize(embedding(client, [essay["topic"]])[0])
    content_vecs = [normalize(vec) for vec in embedding(client, chunks)]

    records = []
    for i, (chunk, content_vec) in enumerate(zip(chunks, content_vecs)):
        record = {
            "parent_id": essay["id"],
            "id": f"{essay['id']}_{i:02d}",
            "topic": essay["topic"],
            "content": chunk,
            "type": essay.get("type"),
            "school": essay.get("school"),
            "public": essay.get("public", False),
            "source_file": essay.get("source_file"),
            "topic_embedding": topic_vec,
            "content_embedding": content_vec,
        }
        records.append(build_output_record(record))
    return records
