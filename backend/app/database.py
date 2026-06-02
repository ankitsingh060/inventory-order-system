"""
database.py — Database engine, session factory, and dependency injection.

This module sets up the SQLAlchemy connection to PostgreSQL and provides
the `get_db` dependency that all route handlers use to obtain a session.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ─── Connection URL ────────────────────────────────────────────────────────────
# Read from environment variable (set in docker-compose.yml or .env)
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/inventorydb"
)

# ─── Engine ───────────────────────────────────────────────────────────────────
# pool_pre_ping=True: Tests each connection before use to handle stale connections
# pool_size and max_overflow: Connection pool settings for production performance
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ─── Session Factory ──────────────────────────────────────────────────────────
# autocommit=False: Changes are committed explicitly
# autoflush=False:  Prevents premature flushes that could cause issues
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Base Class ───────────────────────────────────────────────────────────────
# All ORM model classes will inherit from this Base
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session per request.

    Usage in route:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...

    The `finally` block guarantees the session is closed even if an
    exception is raised during request handling.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
