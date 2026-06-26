"""
This is a file that creates the database for us to track users.

Includes:
    1. specific uuid(prevent data leak)
    2. user email
    3. user name
    4. when did they create the account
    5. login counts (track returning users)
    6. last login time

"""
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv
from datetime import datetime, timezone
from pathlib import Path
import uuid
import os

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

POSTGRES_URL = os.getenv("POSTGRES_URL")
DATABASE_URL = POSTGRES_URL or f"sqlite:///{Path(__file__).resolve().parent.parent / 'app_data.db'}"

# Connect to PostgreSQL in production. A local SQLite fallback keeps scripts and
# tests usable before deployment configuration is present.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id          = Column(String,   primary_key=True, default=lambda: str(uuid.uuid4()))
    email       = Column(String,   unique=True, nullable=False)
    name        = Column(String,   nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    login_count = Column(Integer,  default=1)
    last_login  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Essay(Base):
    __tablename__ = "essays"

    id               = Column(String, primary_key=True)
    topic            = Column(Text, nullable=False)
    content          = Column(Text, nullable=False)
    type             = Column(String, nullable=True)
    school           = Column(String, nullable=True)
    public           = Column(Boolean, default=False, nullable=False)
    source_file      = Column(String, nullable=True)
    metadata_json    = Column(JSON, nullable=True)
    embedding_status = Column(String, default="stale", nullable=False)
    created_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at       = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deleted_at       = Column(DateTime, nullable=True)

class EssayEmbedding(Base):
    __tablename__ = "essay_embeddings"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    essay_id          = Column(String, ForeignKey("essays.id"), nullable=False, index=True)
    model             = Column(String, nullable=False)
    topic_embedding   = Column(JSON, nullable=True)
    content_embedding = Column(JSON, nullable=True)
    content_hash      = Column(String, nullable=False)
    generated_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    actor_email = Column(String, nullable=False, index=True)
    action      = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id   = Column(String, nullable=True, index=True)
    before_json = Column(JSON, nullable=True)
    after_json  = Column(JSON, nullable=True)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class OpenAIUsageEvent(Base):
    __tablename__ = "openai_usage_events"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    feature        = Column(String, nullable=False, index=True)
    model          = Column(String, nullable=True, index=True)
    input_tokens   = Column(Integer, nullable=True)
    output_tokens  = Column(Integer, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    request_id     = Column(String, nullable=True)
    status         = Column(String, default="success", nullable=False, index=True)
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

# runs it when every time a user log in
def get_db():
    # Each has its own unique session that won't interfere others
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the table if it does not exist
def create_tables():
    Base.metadata.create_all(bind=engine)
