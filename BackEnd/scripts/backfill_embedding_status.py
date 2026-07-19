"""One-time backfill: mark embedding_status="current" for every essay that
already has an EssayEmbedding row, since the flag defaults to "stale" and was
never retroactively set for essays embedded before this status-tracking
system existed (see docs/superpowers/specs/2026-07-17-admin-console-redesign-design.md,
section 1). Safe to re-run; the second run always updates 0 rows.

Usage (from BackEnd/, with .venv activated):
    python scripts/backfill_embedding_status.py
"""
import sys
from pathlib import Path

script_dir = Path(__file__).parent
ROOT = script_dir.resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.create import SessionLocal
from database.essays import backfill_current_embedding_status


def main() -> None:
    db = SessionLocal()
    try:
        updated = backfill_current_embedding_status(db)
        db.commit()
        print(f"Marked {updated} essay(s) embedding_status=current")
    finally:
        db.close()


if __name__ == "__main__":
    main()
