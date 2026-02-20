"""
Entities Router - Manage the registry of servers, databases, projects, etc.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Entity, Task, Note, Snippet, Bookmark, LogEntry
from app.schemas import EntityCreate, EntityUpdate, EntityResponse

router = APIRouter()


@router.get("/", response_model=List[EntityResponse])
async def get_entities(
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all entities, optionally filtered by type and search query"""
    query = select(Entity).order_by(Entity.name)
    
    if type:
        query = query.where(Entity.type == type)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            Entity.name.ilike(search_pattern),
            Entity.aliases.ilike(search_pattern)
        ))
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific entity by ID"""
    result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return entity


@router.get("/{entity_id}/timeline")
async def get_entity_timeline(
    entity_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a combined timeline of all activities linked to this entity.
    Returns a sorted list of activities across types.
    """
    # Fetch entity to ensure it exists and load linked items
    result = await db.execute(
        select(Entity)
        .where(Entity.id == entity_id)
        .options(
            selectinload(Entity.log_entries),
            selectinload(Entity.tasks),
            selectinload(Entity.notes),
            selectinload(Entity.snippets),
            selectinload(Entity.bookmarks)
        )
    )
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    timeline = []
    
    # Helper to strip tags for plain text preview
    import re
    def strip_tags(html):
        return re.sub('<[^<]+?>', '', html)
    
    # Process Log Entries
    for entry in entity.log_entries:
        timeline.append({
            "id": entry.id,
            "type": "log_entry",
            "entry_type": entry.type,
            "title": strip_tags(entry.content)[:100], # Plain text preview
            "content": entry.content, # Full HTML content
            "timestamp": entry.timestamp,
            "date": entry.log_date
        })
        
    # Process Tasks
    for task in entity.tasks:
        timeline.append({
            "id": task.id,
            "type": "task",
            "title": task.title,
            "content": task.description,
            "status": task.status,
            "priority": task.priority,
            "timestamp": task.created_at,
            "updated_at": task.updated_at
        })

    # Process Notes
    for note in entity.notes:
        if note.deleted_at:
            continue
        timeline.append({
            "id": note.id,
            "type": "note",
            "title": note.title,
            "content": note.content,
            "timestamp": note.created_at,
            "updated_at": note.updated_at
        })

    # Process Bookmarks
    for bookmark in entity.bookmarks:
        timeline.append({
            "id": bookmark.id,
            "type": "bookmark",
            "title": bookmark.title,
            "url": bookmark.url,
            "content": bookmark.description,
            "timestamp": bookmark.created_at
        })
        
    # Sort by timestamp descending
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "entity": entity,
        "timeline": timeline
    }


@router.post("/", response_model=EntityResponse)
async def create_entity(
    entity_data: EntityCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new entity"""
    entity = Entity(**entity_data.model_dump())
    db.add(entity)
    await db.commit()
    await db.refresh(entity)
    return entity


@router.put("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: int,
    entity_data: EntityUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing entity"""
    result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    for key, value in entity_data.model_dump(exclude_unset=True).items():
        setattr(entity, key, value)
    
    await db.commit()
    await db.refresh(entity)
    return entity


@router.delete("/{entity_id}")
async def delete_entity(
    entity_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an entity"""
    result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    await db.delete(entity)
    await db.commit()
    return {"message": "Entity deleted successfully"}


@router.post("/{entity_id}/link/{item_type}/{item_id}")
async def link_entity(
    entity_id: int,
    item_type: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Link an entity to another item (task, note, etc.)"""
    result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    if item_type == "task":
        item_result = await db.execute(select(Task).where(Task.id == item_id))
        item = item_result.scalar_one_or_none()
        if item: entity.tasks.append(item)
    elif item_type == "note":
        item_result = await db.execute(select(Note).where(Note.id == item_id))
        item = item_result.scalar_one_or_none()
        if item: entity.notes.append(item)
    elif item_type == "snippet":
        item_result = await db.execute(select(Snippet).where(Snippet.id == item_id))
        item = item_result.scalar_one_or_none()
        if item: entity.snippets.append(item)
    elif item_type == "bookmark":
        item_result = await db.execute(select(Bookmark).where(Bookmark.id == item_id))
        item = item_result.scalar_one_or_none()
        if item: entity.bookmarks.append(item)
    else:
        raise HTTPException(status_code=400, detail=f"Invalid item type: {item_type}")

    if not item:
        raise HTTPException(status_code=404, detail=f"{item_type.capitalize()} not found")
        
    await db.commit()
    return {"message": f"Linked {item_type} to entity successfully"}


@router.delete("/{entity_id}/link/{item_type}/{item_id}")
async def unlink_entity(
    entity_id: int,
    item_type: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Unlink an entity from another item"""
    result = await db.execute(
        select(Entity).where(Entity.id == entity_id)
        .options(selectinload(getattr(Entity, f"{item_type}s" if not item_type.endswith('s') else item_type)))
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    collection = getattr(entity, f"{item_type}s" if item_type != "snippet" else "snippets")
    if item_type == "snippet": collection = entity.snippets
    elif item_type == "task": collection = entity.tasks
    elif item_type == "note": collection = entity.notes
    elif item_type == "bookmark": collection = entity.bookmarks
    
    item_to_remove = next((i for i in collection if i.id == item_id), None)
    if item_to_remove:
        collection.remove(item_to_remove)
        await db.commit()
        return {"message": "Unlinked successfully"}
    
    raise HTTPException(status_code=404, detail="Link not found")
