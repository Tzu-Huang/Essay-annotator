import json
import os
import threading
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.state import AppData
from app.usage import record_openai_usage
from database.create import AdminAuditLog, Essay, EssayEmbedding, OpenAIUsageEvent, User, get_db
from database.essays import (
    audit_log,
    content_hash,
    daily_request_counts,
    essay_to_dict,
    import_essays_from_jsonl,
    next_essay_id,
    query_essays,
    summarize_usage,
    utcnow,
    validate_essay_payload,
)
from scripts.add_to_database import DATABASE_PATH as DATABASE_JSONL_PATH, NEW_INPUT_DIR as NEW_INPUT_DIR_PATH
from service.embed_store import append_records, remove_parent_ids, replace_parent_id
from service.embedding_service import embed_essay
from service.extract_essay import MODEL as EXTRACTION_MODEL, extract_prompt_and_content
from service.file_extraction import NoTextExtracted, UnsupportedFileType, extract_text
from service.generate_topic import MODEL as TITLE_GENERATION_MODEL
from service.ingest_service import scan_and_title_new_essays


load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

router = APIRouter(prefix="/admin", tags=["admin"])

def get_embedding_client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def _embed_jsonl_path() -> Path:
    # Reuse app.main's EMBED_JSONL constant rather than recomputing the path
    # string here; deferred import for the same circular-import reason as
    # _current_app_data() below.
    from app.main import EMBED_JSONL

    return EMBED_JSONL


def _current_app_data() -> AppData:
    # admin.py must not import app.main at module load time: main.py imports
    # this module (`from app.admin import ... router as admin_router`), so a
    # top-level `from app.main import app` here would be a circular import.
    # Deferring the import into this function call avoids that, since by the
    # time this runs, app.admin has already finished loading. There's also no
    # existing `Depends(get_app_data)`-style dependency in main.py to mirror,
    # and unit tests call endpoint functions directly (bypassing FastAPI's DI
    # container and any `Request` injection), so a plain helper that reaches
    # into the running app singleton is the pattern that works both in
    # production (uvicorn has run the lifespan, so app.state.data is a real
    # AppData) and in tests (lifespan never runs, so we lazily create an
    # empty AppData the first time this is called).
    from app.main import app as _fastapi_app

    data = getattr(_fastapi_app.state, "data", None)
    if data is None:
        data = AppData()
        _fastapi_app.state.data = data
    return data


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
    sort: Optional[str] = Query(default=None, pattern="^(id|topic|school|type|updated_at|embedding_status)$"),
    sort_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
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
        sort=sort,
        sort_dir=sort_dir,
    )
    total = query.count()
    if sort:
        rows = query.offset((page - 1) * page_size).limit(page_size).all()
    else:
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
    if essay.deleted_at is not None:
        raise HTTPException(status_code=409, detail="Cannot edit a soft-deleted essay; restore it first")
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


@router.post("/essays/{essay_id}/restore")
def restore_essay(essay_id: str, db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin_write)):
    essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    if essay.deleted_at is None:
        raise HTTPException(status_code=409, detail="Essay is not deleted")
    before = essay_to_dict(essay, include_content=True)
    essay.deleted_at = None
    essay.updated_at = utcnow()
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "restore", "essay", essay.id, before, after)
    db.commit()
    return {"essay": after}


@router.post("/essays/{essay_id}/hard-delete")
def hard_delete_essay(essay_id: str, db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin_write)):
    essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    if essay.deleted_at is None:
        raise HTTPException(status_code=409, detail="Essay must be soft-deleted before it can be hard-deleted")

    before = essay_to_dict(essay, include_content=True)

    # EssayEmbedding.essay_id is a foreign key to Essay.id — delete embeddings first.
    db.query(EssayEmbedding).filter(EssayEmbedding.essay_id == essay.id).delete()
    db.delete(essay)
    db.flush()

    remove_parent_ids(_embed_jsonl_path(), {essay_id})
    app_data: AppData = _current_app_data()
    app_data.remove_essay_vectors(essay_id)

    audit_log(db, actor.email, "hard_delete", "essay", essay_id, before, None)
    db.commit()
    return {"deleted": True, "essay_id": essay_id}


@router.post("/essays/{essay_id}/regenerate-embedding")
def trigger_embedding_regeneration(
    essay_id: str,
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin_write),
):
    essay = db.query(Essay).filter(Essay.id == essay_id, Essay.deleted_at.is_(None)).first()
    if not essay:
        raise HTTPException(status_code=404, detail="Essay not found")

    current_hash = content_hash(essay.topic, essay.content)
    existing_row = (
        db.query(EssayEmbedding)
        .filter_by(essay_id=essay.id)
        .order_by(EssayEmbedding.generated_at.desc())
        .first()
    )
    if essay.embedding_status == "current" and existing_row and existing_row.content_hash == current_hash:
        # Short-circuit: no OpenAI call when the embedding is already current
        # for this exact content, so repeated clicks don't burn spend.
        return {
            "essay": essay_to_dict(essay, include_content=True),
            "embedding_job": {"status": "current", "skipped": True},
        }

    before = essay_to_dict(essay, include_content=True)
    essay_dict = {
        "id": essay.id,
        "topic": essay.topic,
        "content": essay.content,
        "type": essay.type,
        "school": essay.school,
        "public": essay.public,
        "source_file": essay.source_file,
    }

    client = get_embedding_client()
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    try:
        records = embed_essay(essay_dict, client)
    except Exception as exc:
        record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="failed")
        db.commit()
        raise HTTPException(status_code=502, detail=f"Embedding generation failed: {exc}")
    record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="success")

    replace_parent_id(_embed_jsonl_path(), essay.id, records)
    rows = [
        {
            "id": r["id"],
            "parent": r["parent_id"],
            "preview": r["content"][:220],
            "topic_text": r["topic"],
            "type": r["type"],
            "school": r["school"],
            "topic_V": r["topic_embedding"],
            "content_V": r["content_embedding"],
        }
        for r in records
    ]
    app_data = _current_app_data()
    app_data.replace_essay_vectors(essay.id, rows)

    # Re-check content_hash *after* the OpenAI call: an edit landing mid-flight
    # must not be marked "current" over content that's now stale.
    db.refresh(essay)
    post_hash = content_hash(essay.topic, essay.content)
    embedding_row = EssayEmbedding(
        essay_id=essay.id,
        model=embedding_model,
        topic_embedding=records[0]["topic_embedding"] if records else None,
        content_embedding=[r["content_embedding"] for r in records],
        content_hash=post_hash,
    )
    db.add(embedding_row)
    essay.embedding_status = "current" if post_hash == current_hash else "stale"
    essay.updated_at = utcnow()
    db.flush()
    after = essay_to_dict(essay, include_content=True)
    audit_log(db, actor.email, "regenerate_embedding", "essay", essay.id, before, after)
    db.commit()
    return {"essay": after, "embedding_job": {"status": essay.embedding_status}}


@router.post("/essays/regenerate-stale-embeddings")
def regenerate_stale_embeddings(
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin_write),
):
    if not _import_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="An import or regeneration run is already in progress")
    try:
        stale_essays = (
            db.query(Essay)
            .filter(Essay.embedding_status != "current", Essay.deleted_at.is_(None))
            .all()
        )
        if not stale_essays:
            return {"attempted": 0, "succeeded": 0, "failed": 0}

        client = get_embedding_client()
        embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        app_data: AppData = _current_app_data()
        embed_path = _embed_jsonl_path()
        succeeded = 0
        failed = 0
        for essay in stale_essays:
            current_hash = content_hash(essay.topic, essay.content)
            essay_dict = {
                "id": essay.id,
                "topic": essay.topic,
                "content": essay.content,
                "type": essay.type,
                "school": essay.school,
                "public": essay.public,
                "source_file": essay.source_file,
            }
            try:
                records = embed_essay(essay_dict, client)
            except Exception:
                record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="failed")
                failed += 1
                continue  # leave embedding_status == "stale"; visible in the result, not silently dropped
            record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="success")

            replace_parent_id(embed_path, essay.id, records)
            rows = [
                {
                    "id": r["id"],
                    "parent": r["parent_id"],
                    "preview": r["content"][:220],
                    "topic_text": r["topic"],
                    "type": r["type"],
                    "school": r["school"],
                    "topic_V": r["topic_embedding"],
                    "content_V": r["content_embedding"],
                }
                for r in records
            ]
            app_data.replace_essay_vectors(essay.id, rows)

            db.refresh(essay)
            post_hash = content_hash(essay.topic, essay.content)
            db.add(
                EssayEmbedding(
                    essay_id=essay.id,
                    model=embedding_model,
                    topic_embedding=records[0]["topic_embedding"] if records else None,
                    content_embedding=[r["content_embedding"] for r in records],
                    content_hash=post_hash,
                )
            )
            essay.embedding_status = "current" if post_hash == current_hash else "stale"
            essay.updated_at = utcnow()
            succeeded += 1

        db.flush()
        result = {"attempted": len(stale_essays), "succeeded": succeeded, "failed": failed}
        audit_log(db, actor.email, "regenerate_stale_embeddings", "essay", None, None, result)
        db.commit()
        return result
    finally:
        _import_lock.release()


_import_lock = threading.Lock()


def append_to_database_jsonl(essays: list[dict]) -> None:
    DATABASE_JSONL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DATABASE_JSONL_PATH, "a", encoding="utf-8") as f:
        for essay in essays:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")


@router.post("/import-new-essays")
def import_new_essays(db: Session = Depends(get_db), actor: AdminActor = Depends(require_admin_write)):
    if not _import_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="An import is already running")
    try:
        client = get_embedding_client()
        embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        new_essays = scan_and_title_new_essays(NEW_INPUT_DIR_PATH, DATABASE_JSONL_PATH, client)
        if not new_essays:
            return {"created": 0, "skipped_duplicates": 0, "invalid": 0, "embedded": 0}

        # add_generated_titles() (called inside scan_and_title_new_essays) marks
        # generated_title=None per-essay on an LLM failure -- mirror that here as
        # one usage event per essay rather than reaching into scripts/add_to_database.py,
        # which is shared with the standalone CLI import path that has no db session.
        for essay in new_essays:
            record_openai_usage(
                db,
                feature="title_generation",
                model=TITLE_GENERATION_MODEL,
                status="success" if essay.get("generated_title") else "failed",
            )

        for essay in new_essays:
            essay["public"] = False  # imported essays unconditionally forced to non-public
        append_to_database_jsonl(new_essays)

        import_result = import_essays_from_jsonl(db, DATABASE_JSONL_PATH)

        # Only embed essays this call actually just created -- not the whole
        # DB-wide stale backlog (which may include essays made stale by an
        # unrelated PATCH long before this import ran). A freshly imported
        # essay should always be embedding_status == "stale", but the filter
        # below double-checks that invariant rather than assuming it.
        newly_imported = (
            db.query(Essay)
            .filter(
                Essay.id.in_(import_result.created_ids),
                Essay.embedding_status == "stale",
                Essay.deleted_at.is_(None),
            )
            .all()
            if import_result.created_ids
            else []
        )
        embedded_count = 0
        app_data: AppData = _current_app_data()
        embed_path = _embed_jsonl_path()
        all_records: list[dict] = []
        all_rows: list[dict] = []
        for essay in newly_imported:
            essay_dict = {
                "id": essay.id,
                "topic": essay.topic,
                "content": essay.content,
                "type": essay.type,
                "school": essay.school,
                "public": essay.public,
                "source_file": essay.source_file,
            }
            try:
                records = embed_essay(essay_dict, client)
            except Exception:
                record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="failed")
                continue  # leave embedding_status == "stale"; visible failure, not silently marked current
            record_openai_usage(db, feature="embedding_regen", model=embedding_model, status="success")
            all_records.extend(records)
            all_rows.extend(
                {
                    "id": r["id"],
                    "parent": r["parent_id"],
                    "preview": r["content"][:220],
                    "topic_text": r["topic"],
                    "type": r["type"],
                    "school": r["school"],
                    "topic_V": r["topic_embedding"],
                    "content_V": r["content_embedding"],
                }
                for r in records
            )
            db.add(
                EssayEmbedding(
                    essay_id=essay.id,
                    model=embedding_model,
                    topic_embedding=records[0]["topic_embedding"] if records else None,
                    content_embedding=[r["content_embedding"] for r in records],
                    content_hash=content_hash(essay.topic, essay.content),
                )
            )
            essay.embedding_status = "current"
            embedded_count += 1

        # These are freshly-imported essays that have never had embeddings
        # before, so there's nothing to "replace" -- a single append is
        # correct and avoids an unnecessary full read-modify-write of
        # embed.jsonl (and of AppData's rows) per essay.
        if all_records:
            append_records(embed_path, all_records)
        if all_rows:
            app_data.add_essay_vectors(all_rows)
        db.flush()

        result = {
            "created": import_result.created,
            "skipped_duplicates": import_result.skipped_duplicates,
            "invalid": import_result.invalid,
            "embedded": embedded_count,
        }
        audit_log(db, actor.email, "import_essays", "essay", None, None, result)
        db.commit()
        return result
    finally:
        _import_lock.release()


@router.post("/essays/upload-drafts")
async def upload_essay_drafts(
    files: list[UploadFile] = File(...),
    file_meta: str = Form(...),
    db: Session = Depends(get_db),
    actor: AdminActor = Depends(require_admin_write),
):
    """
    Pure extraction: for each uploaded file, extract its raw text and ask the
    LLM to split it into {topic, content}. Writes zero Essay rows -- drafts
    are returned to the caller for review; the existing POST /essays create
    endpoint is what actually persists one once reviewed.
    """
    try:
        meta_map = json.loads(file_meta)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="file_meta must be valid JSON") from exc

    client = get_embedding_client()
    drafts: list[dict] = []
    failed: list[dict] = []

    for upload in files:
        filename = upload.filename or "unknown"
        raw_bytes = await upload.read()

        try:
            raw_text = extract_text(filename, raw_bytes)
        except (UnsupportedFileType, NoTextExtracted) as exc:
            failed.append({"filename": filename, "error": str(exc)})
            continue

        try:
            extracted = extract_prompt_and_content(raw_text, client)
        except Exception as exc:
            record_openai_usage(db, feature="essay_extraction", model=EXTRACTION_MODEL, status="failed")
            failed.append({"filename": filename, "error": f"Extraction failed: {exc}"})
            continue
        record_openai_usage(db, feature="essay_extraction", model=EXTRACTION_MODEL, status="success")

        file_meta_entry = meta_map.get(filename, {}) if isinstance(meta_map, dict) else {}
        drafts.append(
            {
                "filename": filename,
                "topic": extracted["topic"],
                "content": extracted["content"],
                "type": file_meta_entry.get("type") or "",
                "school": file_meta_entry.get("school") or "",
                "public": False,
                "extraction_warning": (
                    None if extracted["topic"] else "No prompt detected — please fill in the Topic field manually."
                ),
            }
        )

    db.commit()
    return {"drafts": drafts, "failed": failed}


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
    local_daily = daily_request_counts(db, start_dt, end_dt)
    official = _fetch_openai_costs(start_dt, end_dt)
    return {
        "local": local_summary,
        "local_daily": local_daily,
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
