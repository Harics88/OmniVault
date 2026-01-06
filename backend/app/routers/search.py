"""
Search Router - Global search across all entities
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc

from app.database import get_db
from app.models import DailyLog, Task, Note, Snippet, Bookmark
from app.schemas import SearchResult, SearchResponse

router = APIRouter()


@router.get("/", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Global search across all entities for @ linking support"""
    results: List[SearchResult] = []
    search_pattern = f"%{q}%"
    
    # Search Tasks
    task_result = await db.execute(
        select(Task)
        .where(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )
        .order_by(desc(Task.updated_at))
        .limit(limit)
    )
    for task in task_result.scalars():
        results.append(SearchResult(
            type="task",
            id=task.id,
            title=task.title,
            preview=task.description[:100] if task.description else "",
            updated_at=task.updated_at
        ))
    
    # Search Notes
    note_result = await db.execute(
        select(Note)
        .where(
            or_(
                Note.title.ilike(search_pattern),
                Note.content.ilike(search_pattern)
            )
        )
        .order_by(desc(Note.updated_at))
        .limit(limit)
    )
    for note in note_result.scalars():
        results.append(SearchResult(
            type="note",
            id=note.id,
            title=note.title,
            preview=note.content[:100] if note.content else "",
            updated_at=note.updated_at
        ))
    
    # Search Snippets
    snippet_result = await db.execute(
        select(Snippet)
        .where(
            or_(
                Snippet.title.ilike(search_pattern),
                Snippet.code.ilike(search_pattern),
                Snippet.description.ilike(search_pattern)
            )
        )
        .order_by(desc(Snippet.updated_at))
        .limit(limit)
    )
    for snippet in snippet_result.scalars():
        results.append(SearchResult(
            type="snippet",
            id=snippet.id,
            title=f"{snippet.title} ({snippet.language})",
            preview=snippet.code[:100] if snippet.code else "",
            updated_at=snippet.updated_at
        ))
    
    # Search Bookmarks
    bookmark_result = await db.execute(
        select(Bookmark)
        .where(
            or_(
                Bookmark.title.ilike(search_pattern),
                Bookmark.url.ilike(search_pattern),
                Bookmark.description.ilike(search_pattern)
            )
        )
        .order_by(desc(Bookmark.updated_at))
        .limit(limit)
    )
    for bookmark in bookmark_result.scalars():
        results.append(SearchResult(
            type="bookmark",
            id=bookmark.id,
            title=bookmark.title,
            preview=bookmark.url,
            updated_at=bookmark.updated_at
        ))

    # Search Daily Logs
    log_result = await db.execute(
        select(DailyLog)
        .where(DailyLog.content.ilike(search_pattern))
        .order_by(desc(DailyLog.date))
        .limit(limit)
    )
    for log in log_result.scalars():
        results.append(SearchResult(
            type="daily_log",
            id=log.id,
            title=f"Log: {log.date.strftime('%Y-%m-%d')}",
            preview=log.content[:100] if log.content else "",
            updated_at=log.updated_at,
            metadata={"date": log.date.strftime('%Y-%m-%d')}
        ))
    
    # Sort by updated_at and limit
    results.sort(key=lambda x: x.updated_at, reverse=True)
    results = results[:limit]
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results)
    )


@router.get("/linkable")
async def get_linkable_items(
    q: str = Query("", description="Optional filter"),
    db: AsyncSession = Depends(get_db)
):
    """Get all linkable items for @ autocomplete"""
    items = {"tasks": [], "notes": [], "snippets": [], "bookmarks": [], "daily_logs": []}
    
    search_pattern = f"%{q}%" if q else "%"
    
    # Tasks
    result = await db.execute(
        select(Task.id, Task.title, Task.status)
        .where(Task.title.ilike(search_pattern))
        .order_by(desc(Task.updated_at))
        .limit(10)
    )
    items["tasks"] = [{"id": r[0], "title": r[1], "status": r[2].value} for r in result.all()]
    
    # Notes
    result = await db.execute(
        select(Note.id, Note.title)
        .where(Note.title.ilike(search_pattern))
        .order_by(desc(Note.updated_at))
        .limit(10)
    )
    items["notes"] = [{"id": r[0], "title": r[1]} for r in result.all()]
    
    # Snippets
    result = await db.execute(
        select(Snippet.id, Snippet.title, Snippet.language)
        .where(Snippet.title.ilike(search_pattern))
        .order_by(desc(Snippet.updated_at))
        .limit(10)
    )
    items["snippets"] = [{"id": r[0], "title": r[1], "language": r[2]} for r in result.all()]
    
    # Bookmarks
    result = await db.execute(
        select(Bookmark.id, Bookmark.title, Bookmark.url)
        .where(Bookmark.title.ilike(search_pattern))
        .order_by(desc(Bookmark.updated_at))
        .limit(10)
    )
    items["bookmarks"] = [{"id": r[0], "title": r[1], "url": r[2]} for r in result.all()]

    # Daily Logs
    result = await db.execute(
        select(DailyLog.id, DailyLog.date)
        .where(DailyLog.content.ilike(search_pattern))
        .order_by(desc(DailyLog.date))
        .limit(10)
    )
    items["daily_logs"] = [{"id": r[0], "title": f"Log {r[1].strftime('%Y-%m-%d')}", "date": r[1].strftime('%Y-%m-%d')} for r in result.all()]
    
    return items
