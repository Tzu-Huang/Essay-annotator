from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class AppData:
    essays: dict[str, dict] = field(default_factory=dict)
    ids: list[str] = field(default_factory=list)
    parent: list[str] = field(default_factory=list)
    previews: list[str] = field(default_factory=list)
    topic_texts: list[str] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    types: list[str] = field(default_factory=list)
    schools: list[str] = field(default_factory=list)
    V: Any = None
    essay_count: int = 0

    data_path: str = ""
    ready: bool = False
    startup_error: Optional[str] = None
    started_at: float = 0.0