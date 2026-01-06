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
    db_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    actual_path = "/app/data/mytasker.db"
    if not os.path.exists(actual_path):
        actual_path = db_path
    
    size_bytes = 0
    if os.path.exists(actual_path):
        size_bytes = os.path.getsize(actual_path)

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
