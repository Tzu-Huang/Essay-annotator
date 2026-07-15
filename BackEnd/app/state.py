import threading
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np


@dataclass
class AppData:
    essays: dict[str, dict] = field(default_factory=dict)
    database_essays: dict[str, dict] = field(default_factory=dict)
    ids: list[str] = field(default_factory=list)
    parent: list[str] = field(default_factory=list)
    previews: list[str] = field(default_factory=list)
    topic_texts: list[str] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    types: list[str] = field(default_factory=list)
    schools: list[str] = field(default_factory=list)
    topic_V: Any = None
    content_V: Any = None
    essay_count: int = 0
    data_path: str = ""
    ready: bool = False
    startup_error: Optional[str] = None
    started_at: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False, compare=False)
    # _lock is a single-process lock — see plan Global Constraints re: multi-worker deployments.

    def _rows(self) -> list[dict]:
        return [
            {
                "id": self.ids[i], "parent": self.parent[i], "preview": self.previews[i],
                "topic_text": self.topic_texts[i], "type": self.types[i], "school": self.schools[i],
                "topic_V": self.topic_V[i], "content_V": self.content_V[i],
            }
            for i in range(len(self.ids))
        ]

    def _apply_rows(self, rows: list[dict]) -> None:
        self.ids = [r["id"] for r in rows]
        self.parent = [r["parent"] for r in rows]
        self.previews = [r["preview"] for r in rows]
        self.topic_texts = [r["topic_text"] for r in rows]
        self.types = [r["type"] for r in rows]
        self.schools = [r["school"] for r in rows]
        self.topic_V = np.array([r["topic_V"] for r in rows]) if rows else np.empty((0, 0))
        self.content_V = np.array([r["content_V"] for r in rows]) if rows else np.empty((0, 0))

    def remove_essay_vectors(self, essay_id: str) -> None:
        with self._lock:
            rows = [r for r in self._rows() if r["parent"] != essay_id]
            self._apply_rows(rows)

    def replace_essay_vectors(self, essay_id: str, new_rows: list[dict]) -> None:
        with self._lock:
            rows = [r for r in self._rows() if r["parent"] != essay_id] + new_rows
            self._apply_rows(rows)

    def add_essay_vectors(self, new_rows: list[dict]) -> None:
        with self._lock:
            rows = self._rows() + new_rows
            self._apply_rows(rows)
