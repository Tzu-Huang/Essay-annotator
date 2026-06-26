from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database.create import SessionLocal, create_tables
from database.essays import export_essays_to_jsonl


DEFAULT_JSONL = ROOT / "drive_data" / "exports" / "essays_export.jsonl"


def main(path: str | None = None):
    target = Path(path) if path else DEFAULT_JSONL
    create_tables()
    db = SessionLocal()
    try:
        count = export_essays_to_jsonl(db, target)
    finally:
        db.close()

    print(f"Exported {count} essays -> {target}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
