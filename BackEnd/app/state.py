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
    # _apply_rows() below combines its field assignments into a single tuple-assignment
    # statement to narrow (not eliminate) the race window for lock-free readers in
    # search_service.py. This is NOT a formal atomicity guarantee — CPython does not
    # guarantee a multi-target assignment is atomic against thread switches. A true fix
    # would bundle these fields into one swappable object and update search_service.py's
    # read path accordingly; that is out of scope here.

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
        # Compute all new values into locals first, touching self only in the final
        # combined assignment below — see the note near `_lock` for why this narrows
        # (but does not eliminate) the race window for lock-free readers.
        new_ids = [r["id"] for r in rows]
        new_parent = [r["parent"] for r in rows]
        new_previews = [r["preview"] for r in rows]
        new_topic_texts = [r["topic_text"] for r in rows]
        new_types = [r["type"] for r in rows]
        new_schools = [r["school"] for r in rows]
        if rows:
            new_topic_V = np.array([r["topic_V"] for r in rows])
            new_content_V = np.array([r["content_V"] for r in rows])
        else:
            # Preserve the embedding dimension when all rows are removed, instead of
            # collapsing to (0, 0) — downstream code (search_service.py,
            # embedding/search_similar.py) relies on topic_V.shape[1] for the dim.
            prior_dim = self.topic_V.shape[1] if self.topic_V is not None and self.topic_V.size else 0
            new_topic_V = np.empty((0, prior_dim))
            new_content_V = np.empty((0, prior_dim))

        (
            self.ids, self.parent, self.previews, self.topic_texts,
            self.types, self.schools, self.topic_V, self.content_V,
        ) = (new_ids, new_parent, new_previews, new_topic_texts, new_types, new_schools, new_topic_V, new_content_V)

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
