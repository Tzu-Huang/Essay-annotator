from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.create import SessionLocal, create_tables
from database.essays import import_essays_from_jsonl


DEFAULT_JSONL = ROOT / "drive_data" / "finalized_data_jsonl" / "database.jsonl"


def main(path: str | None = None):
    source = Path(path) if path else DEFAULT_JSONL
    if not source.exists():
        raise SystemExit(f"JSONL file not found: {source}")

    create_tables()
    db = SessionLocal()
    try:
        result = import_essays_from_jsonl(db, source)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(
        "Imported essays: "
        f"seen={result.seen}, created={result.created}, "
        f"skipped_duplicates={result.skipped_duplicates}, invalid={result.invalid}"
    )


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
