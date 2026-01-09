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
    current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # Goes up to backend root

    possible_paths = [
        db_path,
        os.path.abspath(db_path),
        os.path.join(os.getcwd(), db_path),
        os.path.join(current_dir, db_path.lstrip("/.")), # Handle ../data/mytasker.db relative to backend/
        os.path.join(current_dir, "data", "mytasker.db"),
        "/app/data/mytasker.db",
    ]
    
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
