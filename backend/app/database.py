"""
Database configuration and session management
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Database URL - SQLite for local-first storage
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///../data/mytasker.db")

# Ensure using aiosqlite
if not DATABASE_URL.startswith("sqlite+aiosqlite"):
    DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

# Extract DB_PATH for file operations
DB_PATH = DATABASE_URL.replace("sqlite+aiosqlite:///", "").replace("sqlite+aiosqlite://", "")
if DB_PATH.startswith("../"):
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", DB_PATH))

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
