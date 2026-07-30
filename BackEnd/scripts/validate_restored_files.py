"""Validate restored authoritative files through production application loaders."""

import argparse
import math
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.helpers import load_essays
from embedding.search_similar import load_db_embeddings


def validate_restored_files(data_root: Path) -> dict[str, int]:
    database_path = data_root / "finalized_data_jsonl" / "database.jsonl"
    embedding_path = data_root / "embed_output" / "embed.jsonl"

    essays = load_essays(database_path)
    ids, parents, previews, topics, topic_vectors, content_vectors = (
        load_db_embeddings(embedding_path)
    )

    if not essays:
        raise RuntimeError("application essay loader returned no essays")
    if not ids or topic_vectors is None or content_vectors is None:
        raise RuntimeError("application embedding loader returned no embeddings")
    if len(ids) != len(parents):
        raise RuntimeError("embedding IDs and parent IDs have different counts")

    missing_parents = sorted(set(parents) - set(essays))
    if missing_parents:
        raise RuntimeError(
            f"restored embeddings reference {len(missing_parents)} missing essays"
        )

    representative_essay = essays[parents[0]]
    if not representative_essay.get("topic") or not representative_essay.get("content"):
        raise RuntimeError("representative restored essay is not application-readable")
    if topic_vectors.shape[0] != len(ids) or content_vectors.shape[0] != len(ids):
        raise RuntimeError("application embedding matrices have unexpected row counts")
    if not math.isfinite(float(topic_vectors[0][0])):
        raise RuntimeError("representative restored topic embedding is invalid")
    if not math.isfinite(float(content_vectors[0][0])):
        raise RuntimeError("representative restored content embedding is invalid")

    return {
        "essay_count": len(essays),
        "embedding_count": len(ids),
        "embedding_dimensions": int(topic_vectors.shape[1]),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-root", required=True, type=Path)
    args = parser.parse_args()
    result = validate_restored_files(args.data_root)
    print(
        "application_read=pass "
        f"essays={result['essay_count']} "
        f"embeddings={result['embedding_count']} "
        f"dimensions={result['embedding_dimensions']}"
    )


if __name__ == "__main__":
    main()
