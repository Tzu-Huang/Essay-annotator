"""Release-independent runtime paths for mutable application data."""

import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_ROOT = BACKEND_DIR / "drive_data"


def data_root() -> Path:
    configured = os.getenv("ESSAY_DATA_ROOT", "").strip()
    root = Path(configured).expanduser() if configured else DEFAULT_DATA_ROOT
    if os.getenv("APP_ENV", "development").strip().lower() == "production":
        if not configured:
            raise RuntimeError(
                "ESSAY_DATA_ROOT is required when APP_ENV=production"
            )
        if not root.is_absolute():
            raise RuntimeError(
                "ESSAY_DATA_ROOT must be an absolute path in production"
            )
        try:
            root.resolve(strict=False).relative_to(BACKEND_DIR)
        except ValueError:
            pass
        else:
            raise RuntimeError(
                "ESSAY_DATA_ROOT must be outside the release directory in production"
            )
    return root


def runtime_path(relative_path: str) -> Path:
    return data_root() / relative_path
