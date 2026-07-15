from embedding.make_embedding import build_output_record, chunk_text, embedding, normalize


def embed_essay_chunks(essay: dict, client, chunk_indices: list[int] | None = None) -> list[dict]:
    """
    Chunk essay["content"], embed only the chunks at `chunk_indices` (or ALL
    chunks if `chunk_indices` is None), and return chunk records ready to
    write to embed.jsonl.

    This is the single source of truth for the chunk/embed/normalize/
    build-output-record logic; embed_essay() below calls this with
    chunk_indices=None. It exists separately so callers that already know
    which chunk ids are already embedded (e.g.
    embedding.make_embedding.update_embeddings()'s skip-set) can avoid
    paying for an OpenAI API call on chunks that don't need re-embedding.

    essay: dict with keys id, topic, content, type, school, public, source_file
    client: an OpenAI client (or compatible mock) accepted by embedding()
    chunk_indices: indices (into chunk_text(essay["content"])) to embed;
        None means embed every chunk.
    """
    chunks = chunk_text(essay["content"])

    if chunk_indices is None:
        indices = list(range(len(chunks)))
    else:
        indices = chunk_indices

    if not indices:
        return []

    # normalize() only accepts a single vector (see make_embedding.normalize),
    # so each embedding result is normalized individually rather than as a batch.
    topic_vec = normalize(embedding(client, [essay["topic"]])[0])

    selected_chunks = [chunks[i] for i in indices]
    content_vecs = [normalize(vec) for vec in embedding(client, selected_chunks)]

    records = []
    for i, chunk, content_vec in zip(indices, selected_chunks, content_vecs):
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
    return embed_essay_chunks(essay, client, chunk_indices=None)
