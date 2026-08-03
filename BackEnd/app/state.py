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
    public: list[bool] = field(default_factory=list)
    deleted: list[bool] = field(default_factory=list)
    topic_V: Any = None
    content_V: Any = None
    essay_count: int = 0
    data_path: str = ""
    ready: bool = False
    startup_error: Optional[str] = None
    started_at: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False, compare=False)
    # _lock is a single-process lock; multi-worker synchronization is out of scope.

    def _rows(self) -> list[dict]:
        return [
            {
                "id": self.ids[i],
                "parent": self.parent[i],
                "preview": self.previews[i],
                "topic_text": self.topic_texts[i],
                "type": self.types[i],
                "school": self.schools[i],
                "public": self.public[i] if i < len(self.public) else False,
                "deleted": self.deleted[i] if i < len(self.deleted) else False,
                "topic_V": self.topic_V[i],
                "content_V": self.content_V[i],
            }
            for i in range(len(self.ids))
        ]

    def _apply_rows(self, rows: list[dict]) -> None:
        new_ids = [row["id"] for row in rows]
        new_parent = [row["parent"] for row in rows]
        new_previews = [row["preview"] for row in rows]
        new_topic_texts = [row["topic_text"] for row in rows]
        new_types = [row["type"] for row in rows]
        new_schools = [row["school"] for row in rows]
        new_public = [bool(row.get("public", False)) for row in rows]
        new_deleted = [bool(row.get("deleted", False)) for row in rows]
        if rows:
            new_topic_V = np.array([row["topic_V"] for row in rows])
            new_content_V = np.array([row["content_V"] for row in rows])
        else:
            prior_dim = self.topic_V.shape[1] if self.topic_V is not None and self.topic_V.size else 0
            new_topic_V = np.empty((0, prior_dim))
            new_content_V = np.empty((0, prior_dim))

        (
            self.ids,
            self.parent,
            self.previews,
            self.topic_texts,
            self.types,
            self.schools,
            self.public,
            self.deleted,
            self.topic_V,
            self.content_V,
        ) = (
            new_ids,
            new_parent,
            new_previews,
            new_topic_texts,
            new_types,
            new_schools,
            new_public,
            new_deleted,
            new_topic_V,
            new_content_V,
        )

    def remove_essay_vectors(self, essay_id: str) -> None:
        with self._lock:
            rows = [row for row in self._rows() if row["parent"] != essay_id]
            self._apply_rows(rows)

    def replace_essay_vectors(self, essay_id: str, new_rows: list[dict]) -> None:
        with self._lock:
            rows = [row for row in self._rows() if row["parent"] != essay_id] + new_rows
            self._apply_rows(rows)

    def add_essay_vectors(self, new_rows: list[dict]) -> None:
        with self._lock:
            rows = self._rows() + new_rows
            self._apply_rows(rows)

    def set_essay_visibility(
        self,
        essay_id: str,
        *,
        public: Optional[bool] = None,
        deleted: Optional[bool] = None,
    ) -> None:
        """Update visibility flags for every chunk of one essay, in place.

        Cheaper than rebuilding the vector arrays: the embeddings are unchanged,
        only eligibility is. Unknown essay_id is a no-op.
        """
        with self._lock:
            for i, pid in enumerate(self.parent):
                if pid != essay_id:
                    continue
                if public is not None:
                    self.public[i] = bool(public)
                if deleted is not None:
                    self.deleted[i] = bool(deleted)
