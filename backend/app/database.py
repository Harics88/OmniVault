"""
Database configuration and session management
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Database URL - SQLite for local-first storage
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///../data/mytasker.db")

# Create async engine
engine = create_async_engine(
    DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///"),
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
