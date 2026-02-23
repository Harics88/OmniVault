from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import os
from app.database import DATABASE_URL, get_db

from app.version import VERSION

router = APIRouter()

@router.get("/version")
async def get_system_version():
    """Get the current application version"""
    return {"version": VERSION}

from sqlalchemy import select, func, desc

from app.models import Task, Subtask, Note, NoteSection, Snippet, Bookmark, BookmarkCategory, DailyLog, LogEntry, Entity, Secret
import json
from datetime import datetime, date, timedelta

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
        "version": VERSION,
        "counts": {
            "tasks": task_count,
            "notes": note_count,
            "snippets": snippet_count,
            "bookmarks": bookmark_count
        }
    }


@router.get("/dashboard-overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """Aggregated stats for the dashboard in a single call"""
    today = date.today()
    
    # 1. Tasks stats
    tasks_done_today = await db.scalar(
        select(func.count()).select_from(Task)
        .where(func.date(Task.completed_at) == today)
    )
    active_tasks = await db.scalar(
        select(func.count()).select_from(Task)
        .where(Task.status != "done")
    )
    
    # 2. Notes stats
    notes_updated_today = await db.scalar(
        select(func.count()).select_from(Note)
        .where(func.date(Note.updated_at) == today)
        .where(Note.deleted_at.is_(None))
    )
    
    # 3. Activity stats (last 24h)
    recent_activity = await db.scalar(
        select(func.count()).select_from(LogEntry)
        .where(LogEntry.timestamp >= datetime.utcnow() - timedelta(hours=24))
    )
    
    # 4. Streak calculation
    streak = 0
    # Simplified streak: check consecutive days in DailyLog
    logs_res = await db.execute(select(DailyLog.date).order_by(desc(DailyLog.date)))
    log_dates = [l.date for l in logs_res.scalars().all()]
    
    check_date = today
    if log_dates and log_dates[0] == today:
        for d in log_dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
    elif log_dates and log_dates[0] == today - timedelta(days=1):
        # Streak still alive if last log was yesterday
        check_date = today - timedelta(days=1)
        for d in log_dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
                
    # 5. Global counts
    total_notes = await db.scalar(select(func.count()).select_from(Note).where(Note.deleted_at.is_(None)))
    total_snippets = await db.scalar(select(func.count()).select_from(Snippet))
    total_bookmarks = await db.scalar(select(func.count()).select_from(Bookmark))
    
    return {
        "tasks": {
            "done_today": tasks_done_today,
            "active": active_tasks
        },
        "notes": {
            "updated_today": notes_updated_today,
            "total": total_notes
        },
        "activity": {
            "entries_24h": recent_activity,
            "streak": streak
        },
        "counts": {
            "snippets": total_snippets,
            "bookmarks": total_bookmarks
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
        .where(Note.deleted_at.is_(None))
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


@router.get("/timeline")
async def get_global_timeline(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get a global chronological timeline of all activities"""
    timeline = []
    
    import re
    def strip_tags(html):
        if not html: return ""
        return re.sub('<[^<]+?>', '', html)
    
    # 1. Daily Logs / entries
    from app.models import LogEntry
    log_entries_result = await db.execute(
        select(LogEntry)
        .order_by(desc(LogEntry.timestamp))
        .limit(limit)
    )
    for entry in log_entries_result.scalars():
        timeline.append({
            "id": entry.id,
            "type": "log_entry",
            "entry_type": entry.type,
            "title": strip_tags(entry.content)[:100],
            "content": entry.content,
            "timestamp": entry.timestamp,
            "date": entry.log_date
        })
        
    # 2. Tasks (Created or Updated)
    tasks_result = await db.execute(
        select(Task)
        .order_by(desc(Task.updated_at))
        .limit(limit)
    )
    for task in tasks_result.scalars():
        timeline.append({
            "id": task.id,
            "type": "task",
            "title": task.title,
            "content": task.description,
            "status": task.status,
            "priority": task.priority,
            "timestamp": task.updated_at
        })
        
    # 3. Notes
    notes_result = await db.execute(
        select(Note)
        .where(Note.deleted_at.is_(None))
        .order_by(desc(Note.updated_at))
        .limit(limit)
    )
    for note in notes_result.scalars():
        timeline.append({
            "id": note.id,
            "type": "note",
            "title": note.title,
            "content": note.content,
            "timestamp": note.updated_at
        })
        
    # Sort and limit
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline[:limit]


@router.get("/export")
async def export_all_data(db: AsyncSession = Depends(get_db)):
    """Export all application data as a single JSON object"""
    
    def json_serial(obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError (f"Type {type(obj)} not serializable")

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "tasks": [],
        "subtasks": [],
        "notes": [],
        "note_sections": [],
        "snippets": [],
        "bookmarks": [],
        "bookmark_categories": [],
        "daily_logs": [],
        "log_entries": [],
        "entities": [],
        "secrets": []
    }

    # Fetch all data from all tables
    # 1. Tasks & Subtasks
    tasks_res = await db.execute(select(Task))
    for t in tasks_res.scalars():
        export_data["tasks"].append({
            "id": t.id, "title": t.title, "description": t.description, "status": t.status,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "started_at": t.started_at.isoformat() if t.started_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "priority": t.priority, "is_personal": t.is_personal, "order": t.order,
            "created_at": t.created_at.isoformat(), "updated_at": t.updated_at.isoformat()
        })
    
    subtasks_res = await db.execute(select(Subtask))
    for s in subtasks_res.scalars():
        export_data["subtasks"].append({
            "id": s.id, "task_id": s.task_id, "title": s.title, "completed": s.completed,
            "order": s.order, "created_at": s.created_at.isoformat()
        })

    # 2. Notes & Sections
    notes_res = await db.execute(select(Note))
    for n in notes_res.scalars():
        export_data["notes"].append({
            "id": n.id, "title": n.title, "content": n.content, "icon": n.icon,
            "parent_id": n.parent_id, "position": n.position, "section_id": n.section_id,
            "is_pinned": n.is_pinned, "deleted_at": n.deleted_at.isoformat() if n.deleted_at else None,
            "created_at": n.created_at.isoformat(), "updated_at": n.updated_at.isoformat()
        })
    
    sections_res = await db.execute(select(NoteSection))
    for ns in sections_res.scalars():
        export_data["note_sections"].append({
            "id": ns.id, "name": ns.name, "color": ns.color, "icon": ns.icon,
            "position": ns.position, "created_at": ns.created_at.isoformat()
        })

    # 3. Snippets
    snippets_res = await db.execute(select(Snippet))
    for sn in snippets_res.scalars():
        export_data["snippets"].append({
            "id": sn.id, "title": sn.title, "code": sn.code, "language": sn.language,
            "is_pinned": sn.is_pinned, "description": sn.description,
            "created_at": sn.created_at.isoformat(), "updated_at": sn.updated_at.isoformat()
        })

    # 4. Bookmarks & Categories
    bookmarks_res = await db.execute(select(Bookmark))
    for b in bookmarks_res.scalars():
        export_data["bookmarks"].append({
            "id": b.id, "category_id": b.category_id, "title": b.title, "url": b.url,
            "description": b.description, "icon": b.icon, "is_file": b.is_file, "order": b.order,
            "created_at": b.created_at.isoformat(), "updated_at": b.updated_at.isoformat()
        })
        
    bcat_res = await db.execute(select(BookmarkCategory))
    for bc in bcat_res.scalars():
        export_data["bookmark_categories"].append({
            "id": bc.id, "name": bc.name, "color": bc.color, "order": bc.order,
            "created_at": bc.created_at.isoformat()
        })

    # 5. Daily Logs & Log Entries
    logs_res = await db.execute(select(DailyLog))
    for dl in logs_res.scalars():
        export_data["daily_logs"].append({
            "id": dl.id, "date": dl.date.isoformat(), "content": dl.content,
            "created_at": dl.created_at.isoformat(), "updated_at": dl.updated_at.isoformat()
        })
        
    entries_res = await db.execute(select(LogEntry))
    for le in entries_res.scalars():
        export_data["log_entries"].append({
            "id": le.id, "log_date": le.log_date.isoformat(), "type": le.type,
            "content": le.content, "timestamp": le.timestamp.isoformat(),
            "created_at": le.created_at.isoformat(), "updated_at": le.updated_at.isoformat()
        })

    # 6. Entities
    entities_res = await db.execute(select(Entity))
    for e in entities_res.scalars():
        export_data["entities"].append({
            "id": e.id, "type": e.type, "name": e.name, "aliases": e.aliases,
            "status": e.status, "meta_json": e.meta_json,
            "created_at": e.created_at.isoformat(), "updated_at": e.updated_at.isoformat()
        })

    # 7. Secrets (Vault)
    secrets_res = await db.execute(select(Secret))
    for sec in secrets_res.scalars():
        export_data["secrets"].append({
            "id": sec.id, "type": sec.type, "label": sec.label, "meta_json": sec.meta_json,
            "tags": sec.tags, "username": sec.username, "password": sec.password,
            "notes": sec.notes, "created_at": sec.created_at.isoformat(),
            "updated_at": sec.updated_at.isoformat()
        })

    return export_data


def format_size(bytes):
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} PB"
