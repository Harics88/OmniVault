from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import os
from app.database import DATABASE_URL, get_db

router = APIRouter()

from sqlalchemy import select, func
from app.models import Task, Note, Snippet, Bookmark, DailyLog

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

@router.get("/activity")
async def get_activity_data(db: AsyncSession = Depends(get_db)):
    """Get activity data for heatmap (last 365 days)"""
    # We aggregate counts from different tables
    activity = {} # date_str -> count
    
    # 1. Tasks completed
    task_results = await db.execute(
        select(func.date(Task.completed_at), func.count())
        .where(Task.completed_at.is_not(None))
        .group_by(func.date(Task.completed_at))
    )
    for date_str, count in task_results:
        if date_str:
            activity[date_str] = activity.get(date_str, 0) + count
            
    # 2. Daily Logs
    log_results = await db.execute(
        select(DailyLog.date, func.count())
        .group_by(DailyLog.date)
    )
    for d, count in log_results:
        date_str = d.strftime('%Y-%m-%d')
        activity[date_str] = activity.get(date_str, 0) + count
        
    # 3. Notes created
    note_results = await db.execute(
        select(func.date(Note.created_at), func.count())
        .group_by(func.date(Note.created_at))
    )
    for date_str, count in note_results:
        if date_str:
            activity[date_str] = activity.get(date_str, 0) + count
            
    # 4. Snippets created
    snippet_results = await db.execute(
        select(func.date(Snippet.created_at), func.count())
        .group_by(func.date(Snippet.created_at))
    )
    for date_str, count in snippet_results:
        if date_str:
            activity[date_str] = activity.get(date_str, 0) + count

    # Convert to list of dicts with levels for frontend
    max_count = max(activity.values()) if activity else 0
    import math
    
    result = []
    for d, c in activity.items():
        level = 0
        if c > 0:
            if max_count > 0:
                # Map to 1-4 level scale
                level = math.ceil((c / max_count) * 4)
                level = min(4, level) # Cap just in case
            else:
                level = 1
        result.append({"date": d, "count": c, "level": level})
        
    return sorted(result, key=lambda x: x["date"])


def format_size(bytes):
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} PB"
