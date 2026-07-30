"""One-time backfill: mark embedding_status="current" for every essay present
in embed.jsonl, since the flag defaults to "stale" and was never retroactively
set for essays embedded before this status-tracking system existed -- notably
essays embedded via the standalone embedding/make_embedding.py script, which
only ever wrote to embed.jsonl and never touched the EssayEmbedding table (see
docs/superpowers/specs/2026-07-17-admin-console-redesign-design.md, section 1).
Safe to re-run; a run with no new embed.jsonl entries updates 0 rows.

Usage (from BackEnd/, with .venv activated):
    python scripts/backfill_embedding_status.py
"""
import sys
from pathlib import Path
from runtime_paths import runtime_path

script_dir = Path(__file__).parent
ROOT = script_dir.resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.create import SessionLocal
from database.essays import backfill_current_embedding_status

EMBED_JSONL = runtime_path("embed_output/embed.jsonl")


def main() -> None:
    db = SessionLocal()
    try:
        updated = backfill_current_embedding_status(db, EMBED_JSONL)
        db.commit()
        print(f"Marked {updated} essay(s) embedding_status=current")
    finally:
        db.close()


if __name__ == "__main__":
    main()
