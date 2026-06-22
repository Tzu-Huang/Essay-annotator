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
from sqlalchemy import Column, String, DateTime, Integer
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

# Connect to PostgreSQL
engine = create_engine(POSTGRES_URL)
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
