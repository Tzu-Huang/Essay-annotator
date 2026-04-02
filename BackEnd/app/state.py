from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class AppData:
    essays: dict = field(default_factory=dict)
    ids: list = field(default_factory=list)
    parent: list = field(default_factory=list)
    previews: list = field(default_factory=list)
    topic_texts: list = field(default_factory=list)
    topics: list = field(default_factory=list)
    types: list = field(default_factory=list) # personal statement, uc, supplements

    V: Optional[Any] = None

    essay_count: int = 0
    data_path: str = ""
    ready: bool = False
    startup_error: Optional[str] = None
    started_at: float = 0.0