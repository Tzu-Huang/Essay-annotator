import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.create import AdminAuditLog, Essay, EssayEmbedding, OpenAIUsageEvent


EDITABLE_ESSAY_FIELDS = {"topic", "content", "type", "school", "public", "source_file", "metadata_json"}
EMBEDDING_RELEVANT_FIELDS = {"topic", "content", "type", "school"}


@dataclass
class ImportResult:
    seen: int = 0
    created: int = 0
    skipped_duplicates: int = 0
    invalid: int = 0


def utcnow():
    return datetime.now(timezone.utc)


def content_hash(topic: str, content: str) -> str:
    payload = json.dumps({"topic": topic or "", "content": content or ""}, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def essay_to_dict(essay: Essay, include_content: bool = True) -> dict:
    data = {
        "id": essay.id,
        "topic": essay.topic,
        "type": essay.type,
        "school": essay.school,
        "public": essay.public,
        "source_file": essay.source_file,
        "metadata": essay.metadata_json,
        "embedding_status": essay.embedding_status,
        "created_at": essay.created_at.isoformat() if essay.created_at else None,
        "updated_at": essay.updated_at.isoformat() if essay.updated_at else None,
        "deleted_at": essay.deleted_at.isoformat() if essay.deleted_at else None,
        "word_count": len((essay.content or "").split()),
    }
    if include_content:
        data["content"] = essay.content
    else:
        data["preview"] = (essay.content or "")[:220]
    return data


def audit_log(
    db: Session,
    actor_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None,
    before: dict | None = None,
    after: dict | None = None,
) -> AdminAuditLog:
    log = AdminAuditLog(
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=before,
        after_json=after,
    )
    db.add(log)
    return log


def load_essays_from_db(db: Session, include_deleted: bool = False) -> dict[str, dict]:
    query = db.query(Essay)
    if not include_deleted:
        query = query.filter(Essay.deleted_at.is_(None))
    return {essay.id: essay_to_dict(essay, include_content=True) for essay in query.all()}


def next_essay_id(db: Session) -> str:
    ids = [row[0] for row in db.query(Essay.id).filter(Essay.id.like("essay_%")).all()]
    max_number = 0
    for essay_id in ids:
        try:
            max_number = max(max_number, int(essay_id.split("_", 1)[1]))
        except (IndexError, ValueError):
            continue
    return f"essay_{max_number + 1:04d}"


def normalize_public(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1", "public"}
    return bool(value)


def validate_essay_payload(payload: dict) -> dict:
    topic = (payload.get("topic") or "").strip()
    content = (payload.get("content") or "").strip()
    if not topic or not content:
        raise ValueError("Essay topic and content are required")

    return {
        "id": (payload.get("id") or "").strip() or None,
        "topic": topic,
        "content": content,
        "type": (payload.get("type") or "").strip() or None,
        "school": (payload.get("school") or "").strip() or None,
        "public": normalize_public(payload.get("public", False)),
        "source_file": (payload.get("source_file") or "").strip() or None,
        "metadata_json": payload.get("metadata") or payload.get("metadata_json"),
    }


def import_essays_from_jsonl(db: Session, path: Path) -> ImportResult:
    result = ImportResult()
    existing_ids = {row[0] for row in db.query(Essay.id).all()}
    signatures = {
        (
            (row[0] or "").strip().lower(),
            (row[1] or "").strip().lower(),
            (row[2] or "").strip().lower(),
        )
        for row in db.query(Essay.topic, Essay.content, Essay.source_file).all()
    }

    with path.open("r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            result.seen += 1
            try:
                raw = json.loads(line)
                payload = validate_essay_payload(raw)
            except (json.JSONDecodeError, ValueError):
                result.invalid += 1
                continue

            signature = (
                payload["topic"].lower(),
                payload["content"].lower(),
                (payload["source_file"] or "").lower(),
            )
            if payload["id"] in existing_ids or signature in signatures:
                result.skipped_duplicates += 1
                continue

            essay = Essay(
                id=payload["id"] or next_essay_id(db),
                topic=payload["topic"],
                content=payload["content"],
                type=payload["type"],
                school=payload["school"],
                public=payload["public"],
                source_file=payload["source_file"],
                metadata_json=payload["metadata_json"],
                embedding_status="stale",
            )
            db.add(essay)
            existing_ids.add(essay.id)
            signatures.add(signature)
            result.created += 1

    return result


def export_essays_to_jsonl(db: Session, path: Path, include_deleted: bool = False) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    query = db.query(Essay)
    if not include_deleted:
        query = query.filter(Essay.deleted_at.is_(None))
    count = 0
    with path.open("w", encoding="utf-8") as f:
        for essay in query.order_by(Essay.id.asc()).all():
            row = essay_to_dict(essay, include_content=True)
            row["metadata"] = row.pop("metadata")
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            count += 1
    return count


def query_essays(
    db: Session,
    *,
    search: str | None = None,
    essay_type: str | None = None,
    school: str | None = None,
    public: bool | None = None,
    embedding_status: str | None = None,
    include_deleted: bool = False,
):
    query = db.query(Essay)
    if not include_deleted:
        query = query.filter(Essay.deleted_at.is_(None))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Essay.topic.ilike(pattern),
                Essay.content.ilike(pattern),
                Essay.school.ilike(pattern),
                Essay.source_file.ilike(pattern),
            )
        )
    if essay_type:
        query = query.filter(Essay.type == essay_type)
    if school:
        query = query.filter(Essay.school == school)
    if public is not None:
        query = query.filter(Essay.public == public)
    if embedding_status:
        query = query.filter(Essay.embedding_status == embedding_status)
    return query


def usage_event_to_dict(event: OpenAIUsageEvent) -> dict:
    return {
        "id": event.id,
        "feature": event.feature,
        "model": event.model,
        "input_tokens": event.input_tokens,
        "output_tokens": event.output_tokens,
        "estimated_cost": event.estimated_cost,
        "request_id": event.request_id,
        "status": event.status,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


def summarize_usage(db: Session, start: datetime | None = None, end: datetime | None = None) -> list[dict]:
    query = db.query(
        OpenAIUsageEvent.feature,
        OpenAIUsageEvent.model,
        OpenAIUsageEvent.status,
        func.count(OpenAIUsageEvent.id).label("requests"),
        func.coalesce(func.sum(OpenAIUsageEvent.input_tokens), 0).label("input_tokens"),
        func.coalesce(func.sum(OpenAIUsageEvent.output_tokens), 0).label("output_tokens"),
        func.coalesce(func.sum(OpenAIUsageEvent.estimated_cost), 0).label("estimated_cost"),
    )
    if start:
        query = query.filter(OpenAIUsageEvent.created_at >= start)
    if end:
        query = query.filter(OpenAIUsageEvent.created_at <= end)
    rows = query.group_by(OpenAIUsageEvent.feature, OpenAIUsageEvent.model, OpenAIUsageEvent.status).all()
    return [
        {
            "feature": row.feature,
            "model": row.model,
            "status": row.status,
            "requests": row.requests,
            "input_tokens": int(row.input_tokens or 0),
            "output_tokens": int(row.output_tokens or 0),
            "estimated_cost": float(row.estimated_cost or 0),
            "source": "local_app_events",
        }
        for row in rows
    ]
