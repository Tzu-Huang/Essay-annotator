import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.create import AdminAuditLog, Essay, EssayEmbedding, OpenAIUsageEvent, User, get_db
from database.essays import (
    audit_log,
    content_hash,
    essay_to_dict,
    next_essay_id,
    query_essays,
    summarize_usage,
    utcnow,
    validate_essay_payload,
)


load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

router = APIRouter(prefix="/admin", tags=["admin"])


def _split_env(name: str) -> set[str]:
    return {
        item.strip().lower()
        for item in os.getenv(name, "").split(",")
        if item.strip()
    }


def admin_emails() -> set[str]:
    return _split_env("ADMIN_EMAILS")


def admin_write_emails() -> set[str]:
    configured = _split_env("ADMIN_WRITE_EMAILS")
    return configured or admin_emails()


class AdminActor(BaseModel):
    email: str
    can_write: bool


def require_admin(x_admin_email: Optional[str] = Header(default=None)) -> AdminActor:
    email = (x_admin_email or "").strip().lower()
    allowlist = admin_emails()
    if not email:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    if not allowlist or ("*" not in allowlist and email not in allowlist):
        raise HTTPException(status_code=403, detail="Admin access denied")
    write_allowlist = admin_write_emails()
    return AdminActor(email=email, can_write="*" in write_allowlist or email in write_allowlist)


def require_admin_write(actor: AdminActor = Depends(require_admin)) -> AdminActor:
    if not actor.can_write:
        raise HTTPException(status_code=403, detail="Admin write access required")
    return actor


class EssayCreate(BaseModel):
    id: Optional[str] = None
    topic: str
    content: str
    type: Optional[str] = None
    school: Optional[str] = None
    public: bool = False
    source_file: Optional[str] = None
    metadata: Optional[dict] = None


class EssayUpdate(BaseModel):
    topic: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    school: Optional[str] = None
    public: Optional[bool] = None
    source_file: Optional[str] = None
    metadata: Optional[dict] = None


def _integration_status() -> dict:
    return {
        "postgres": {"configured": bool(os.getenv("POSTGRES_URL"))},
        "openai_api": {"configured": bool(os.getenv("OPENAI_API_KEY"))},
        "openai_usage": {
            "configured": bool(os.getenv("OPENAI_ADMIN_API_KEY")),
            "requires": "OPENAI_ADMIN_API_KEY",
        },
        "cloudwatch": {
            "configured": bool(os.getenv("AWS_REGION") and os.getenv("AWS_CLOUDWATCH_LOG_GROUP")),
            "region": os.getenv("AWS_REGION") or None,
            "log_group_configured": bool(os.getenv("AWS_CLOUDWATCH_LOG_GROUP")),
        },
        "admin_allowlist": {"configured": bool(admin_emails()), "count": len(admin_emails())},
    }


@router.get("/me")
def admin_me(actor: AdminActor = Depends(require_admin)):
    return {"email": actor.email, "can_write": actor.can_write}


@router.get("/overview")
def overview(db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin)):
    return {
        "actor": {"email": actor.email, "can_write": actor.can_write},
        "counts": {
            "essays": db.query(Essay).filter(Essay.deleted_at.is_(None)).count(),
            "deleted_essays": db.query(Essay).filter(Essay.deleted_at.isnot(None)).count(),
            "users": db.query(User).count(),
            "stale_embeddings": db.query(Essay).filter(Essay.embedding_status != "current").count(),
            "audit_logs": db.query(AdminAuditLog).count(),
        },
        "integrations": _integration_status(),
        "generated_at": utcnow().isoformat(),
    }


@router.get("/essays")
def list_essays(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: Optional[str] = None,
    essay_type: Optional[str] = None,
    school: Optional[str] = None,
    public: Optional[bool] = None,
    embedding_status: Optional[str] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin),
):
    query = query_essays(
        db,
        search=search,
        essay_type=essay_type,
        school=school,
        public=public,
        embedding_status=embedding_status,
        include_deleted=include_deleted,
    )
    total = query.count()
    rows = (
        query.order_by(Essay.updated_at.desc(), Essay.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [essay_to_dict(row, include_content=False) for row in rows],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/essays/{essay_id}")
def essay_detail(essay_id: str, db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin)):
    essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    audits = (
        db.query(AdminAuditLog)
        .filter(AdminAuditLog.entity_type == "essay", AdminAuditLog.entity_id == essay_id)
        .order_by(AdminAuditLog.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "essay": essay_to_dict(essay, include_content=True),
        "audit": [
            {
                "id": row.id,
                "actor_email": row.actor_email,
                "action": row.action,
                "before": row.before_json,
                "after": row.after_json,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in audits
        ],
    }


@router.post("/essays")
def create_essay(payload: EssayCreate, db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin_write)):
    try:
        values = validate_essay_payload(_model_data(payload))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    essay_id = values["id"] or next_essay_id(db)
    if db.query(Essay).filter(Essay.id == essay_id).first():
        raise HTTPException(status_code=409, detail="Essay ID already exists")

    essay = Essay(
        id=essay_id,
        topic=values["topic"],
        content=values["content"],
        type=values["type"],
        school=values["school"],
        public=values["public"],
        source_file=values["source_file"],
        metadata_json=values["metadata_json"],
        embedding_status="stale",
    )
    db.add(essay)
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "create", "essay", essay.id, None, after)
    db.commit()
    db.refresh(essay)
    return {"essay": essay_to_dict(essay, include_content=True)}


@router.patch("/essays/{essay_id}")
def update_essay(
    essay_id: str,
    payload: EssayUpdate,
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin_write),
):
    essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    before = essay_to_dict(essay, include_content=True)
    values = _model_data(payload, exclude_unset=True)
    if "metadata" in values:
        values["metadata_json"] = values.pop("metadata")
    if "topic" in values and not (values["topic"] or "").strip():
        raise HTTPException(status_code=400, detail="Essay topic is required")
    if "content" in values and not (values["content"] or "").strip():
        raise HTTPException(status_code=400, detail="Essay content is required")

    mark_stale = any(field in values for field in {"topic", "content", "type", "school"})
    for field, value in values.items():
        if field in {"topic", "content"} and isinstance(value, str):
            value = value.strip()
        setattr(essay, field, value)
    if mark_stale:
        essay.embedding_status = "stale"
    essay.updated_at = utcnow()
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "update", "essay", essay.id, before, after)
    db.commit()
    db.refresh(essay)
    return {"essay": essay_to_dict(essay, include_content=True)}


@router.delete("/essays/{essay_id}")
def soft_delete_essay(essay_id: str, db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin_write)):
    essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    before = essay_to_dict(essay, include_content=True)
    essay.deleted_at = utcnow()
    essay.updated_at = utcnow()
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "soft_delete", "essay", essay.id, before, after)
    db.commit()
    return {"essay": after}


@router.post("/essays/{essay_id}/regenerate-embedding")
def trigger_embedding_regeneration(
    essay_id: str,
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin_write),
):
    essay = db.query(Essay).filter(Essay.id == essay_id, Essay.deleted_at.is_(None)).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    before = essay_to_dict(essay, include_content=True)
    essay.embedding_status = "queued"
    embedding = EssayEmbedding(
        essay_id=essay.id,
        model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
        topic_embedding=None,
        content_embedding=None,
        content_hash=content_hash(essay.topic, essay.content),
    )
    db.add(embedding)
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "queue_embedding_regeneration", "essay", essay.id, before, after)
    db.commit()
    return {"essay": after, "embedding_job": {"status": "queued", "content_hash": embedding.content_hash}}


@router.get("/audit")
def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin),
):
    rows = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(limit).all()
    return {
        "items": [
            {
                "id": row.id,
                "actor_email": row.actor_email,
                "action": row.action,
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "before": row.before_json,
                "after": row.after_json,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }


def _parse_timestamp(value: Optional[str]) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp: {value}") from exc


@router.get("/openai/usage")
def openai_usage(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin),
):
    start_dt = _parse_timestamp(start) or (utcnow() - timedelta(days=30))
    end_dt = _parse_timestamp(end) or utcnow()
    local_summary = summarize_usage(db, start_dt, end_dt)
    official = _fetch_openai_costs(start_dt, end_dt)
    return {
        "local": local_summary,
        "official": official,
        "range": {"start": start_dt.isoformat(), "end": end_dt.isoformat()},
    }


def _fetch_openai_costs(start: datetime, end: datetime) -> dict:
    api_key = os.getenv("OPENAI_ADMIN_API_KEY")
    if not api_key:
        return {
            "configured": False,
            "error": "OPENAI_ADMIN_API_KEY is required for official organization cost data. OPENAI_API_KEY is still used for normal model calls, but it cannot read billing costs.",
            "source": "official_openai",
        }

    params = urllib.parse.urlencode(
        {
            "start_time": int(start.timestamp()),
            "end_time": int(end.timestamp()),
            "bucket_width": "1d",
        }
    )
    request = urllib.request.Request(
        f"https://api.openai.com/v1/organization/costs?{params}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return {"configured": True, "source": "official_openai", "data": json.loads(response.read().decode("utf-8"))}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 403:
            error = (
                "OpenAI returned 403 for organization costs. Use an admin/organization key with billing or usage read permission "
                "as OPENAI_ADMIN_API_KEY; a normal project API key cannot read this endpoint."
            )
        else:
            error = f"OpenAI costs request failed with HTTP {exc.code}: {body}"
        return {"configured": True, "source": "official_openai", "error": error, "status": exc.code}
    except Exception as exc:
        return {"configured": True, "source": "official_openai", "error": str(exc)}


@router.get("/logs")
def cloudwatch_logs(
    start_minutes_ago: int = Query(default=60, ge=1, le=10080),
    query: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    actor: AdminActor = Depends(require_admin),
):
    region = os.getenv("AWS_REGION")
    log_group = os.getenv("AWS_CLOUDWATCH_LOG_GROUP")
    if not region or not log_group:
        return {
            "configured": False,
            "error": "AWS_REGION and AWS_CLOUDWATCH_LOG_GROUP must be configured",
            "items": [],
        }

    try:
        import boto3
    except ImportError:
        return {"configured": False, "error": "boto3 is not installed", "items": []}

    client = boto3.client("logs", region_name=region)
    start_ms = int((utcnow() - timedelta(minutes=start_minutes_ago)).timestamp() * 1000)
    kwargs = {
        "logGroupName": log_group,
        "startTime": start_ms,
        "limit": limit,
    }
    if query:
        kwargs["filterPattern"] = query
    response = client.filter_log_events(**kwargs)
    severity_filter = severity.lower() if severity else None
    items = []
    for event in response.get("events", []):
        message = event.get("message", "")
        inferred = _infer_severity(message)
        if severity_filter and inferred.lower() != severity_filter:
            continue
        items.append(
            {
                "timestamp": datetime.fromtimestamp(event["timestamp"] / 1000, tz=timezone.utc).isoformat(),
                "message": message,
                "severity": inferred,
                "log_stream": event.get("logStreamName"),
                "event_id": event.get("eventId"),
            }
        )
    return {"configured": True, "items": items, "next_token": response.get("nextToken")}


def _infer_severity(message: str) -> str:
    upper = (message or "").upper()
    if "ERROR" in upper or "EXCEPTION" in upper or "TRACEBACK" in upper:
        return "error"
    if "WARN" in upper:
        return "warn"
    return "info"


def _model_data(model: BaseModel, **kwargs):
    if hasattr(model, "model_dump"):
        return model.model_dump(**kwargs)
    return model.dict(**kwargs)
