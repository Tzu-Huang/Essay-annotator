import os
from pathlib import Path
from typing import Mapping


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def resolve_data_root(environ: Mapping[str, str] | None = None) -> Path:
    """Return the mutable data directory, independent of the release path."""
    values = os.environ if environ is None else environ
    configured = values.get("ESSAY_DATA_ROOT", "").strip()
    return Path(configured).expanduser() if configured else BACKEND_ROOT / "drive_data"


DATA_ROOT = resolve_data_root()
DATABASE_JSONL = DATA_ROOT / "finalized_data_jsonl" / "database.jsonl"
EMBED_JSONL = DATA_ROOT / "embed_output" / "embed.jsonl"
NEW_INPUT_DIR = DATA_ROOT / "organized_data" / "new_input"
