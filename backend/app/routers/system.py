from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import os
from app.database import DATABASE_URL, get_db

router = APIRouter()

from sqlalchemy import select, func
from app.models import Task, Note, Snippet, Bookmark

@router.get("/stats")
async def get_system_stats(db: AsyncSession = Depends(get_db)):
    """Get system stats like database size and object counts"""
    database_url = DATABASE_URL
    if database_url.startswith("sqlite+aiosqlite:///"):
        db_path = database_url.replace("sqlite+aiosqlite:///", "")
    elif database_url.startswith("sqlite:///"):
        db_path = database_url.replace("sqlite:///", "")
    else:
        db_path = "mytasker.db" # Fallback

    # Try different possible paths
    # Handle relative paths properly relative to the backend app root
    # Current file is backend/app/routers/system.py
    # Backend root is backend/
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # Handle relative path from backend root (e.g. "../data/mytasker.db" relative to "backend/app")
    # Actually, DATABASE_URL is usually relative to where the app is started (backend/)

    possible_paths = [
        db_path, # As is (relative to CWD)
        os.path.abspath(db_path), # Absolute
        os.path.join(backend_root, db_path), # Relative to backend root
    ]
    
    # Special handling for common relative paths like "../data/mytasker.db"
    if db_path.startswith(".."):
        # Resolve .. relative to backend_root if it was meant to be relative to app/
        # But if we run from backend/, then ".." puts us outside backend/
        pass

    # Add hardcoded fallback for likely Docker/Standard paths
    possible_paths.extend([
        os.path.join(backend_root, "mytasker.db"),
        "/app/backend/mytasker.db",
        "/app/mytasker.db"
    ])

    size_bytes = 0
    actual_path = None
    for path in possible_paths:
        if os.path.exists(path) and os.path.isfile(path):
            actual_path = path
            size_bytes = os.path.getsize(path)
            break

    # Entity counts
    task_count = await db.scalar(select(func.count()).select_from(Task))
    # Exclude deleted notes from total count if possible, or just show total
    note_count = await db.scalar(select(func.count()).select_from(Note).where(Note.deleted_at.is_(None)))
    snippet_count = await db.scalar(select(func.count()).select_from(Snippet))
    bookmark_count = await db.scalar(select(func.count()).select_from(Bookmark))
    
    return {
        "database_size_bytes": size_bytes,
        "database_size_human": format_size(size_bytes),
        "counts": {
            "tasks": task_count,
            "notes": note_count,
            "snippets": snippet_count,
            "bookmarks": bookmark_count
        }
    }

def format_size(bytes):
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} PB"
