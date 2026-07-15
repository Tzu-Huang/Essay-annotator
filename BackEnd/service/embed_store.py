import json
import threading
from pathlib import Path

_LOCK = threading.Lock()
# Single-process lock only — see plan Global Constraints re: multi-worker deployments.


def _read_all(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8-sig") as f:
        return [json.loads(line) for line in f if line.strip()]


def _write_all(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8-sig") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def remove_parent_ids(path: Path, parent_ids: set[str]) -> list[dict]:
    with _LOCK:
        records = _read_all(path)
        kept = [r for r in records if r.get("parent_id") not in parent_ids]
        removed = [r for r in records if r.get("parent_id") in parent_ids]
        _write_all(path, kept)
        return removed


def append_records(path: Path, records: list[dict]) -> None:
    with _LOCK:
        existing = _read_all(path)
        _write_all(path, existing + records)


def replace_parent_id(path: Path, parent_id: str, new_records: list[dict]) -> None:
    with _LOCK:
        existing = _read_all(path)
        kept = [r for r in existing if r.get("parent_id") != parent_id]
        _write_all(path, kept + new_records)
