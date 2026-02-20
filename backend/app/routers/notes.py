"""
Notes Router - CRUD operations for notes
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, asc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Note, NoteSection
from app.schemas import NoteCreate, NoteUpdate, NoteResponse, NoteTreeResponse

router = APIRouter()


def build_note_tree(notes: List[Note], parent_id: Optional[int] = None) -> List[dict]:
    """Recursively build a tree structure from flat notes list"""
    tree = []
    for note in notes:
        if note.parent_id == parent_id:
            children = build_note_tree(notes, note.id)
            tree.append({
                "id": note.id,
                "title": note.title,
                "icon": note.icon or "📄",
                "parent_id": note.parent_id,
                "section_id": note.section_id,  # For folder grouping
                "position": note.position,
                "is_pinned": note.is_pinned,
                "children": children,
                "created_at": note.created_at,
                "updated_at": note.updated_at
            })
    # Sort by position, then by title
    tree.sort(key=lambda x: (x["position"], x["title"]))
    return tree



@router.get("/tree", response_model=List[NoteTreeResponse])
async def get_notes_tree(
    db: AsyncSession = Depends(get_db)
):
    """Get all notes as a hierarchical tree structure (excluding deleted)"""
    try:
        # Try to filter by deleted_at if column exists
        result = await db.execute(
            select(Note)
            .where(Note.deleted_at.is_(None))
            .order_by(asc(Note.position), asc(Note.title))
        )
    except Exception:
        # Fallback if deleted_at column doesn't exist yet
        result = await db.execute(
            select(Note).order_by(asc(Note.position), asc(Note.title))
        )
    notes = result.scalars().all()
    return build_note_tree(notes, None)


@router.get("/{note_id}/breadcrumb")
async def get_note_breadcrumb(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get the breadcrumb path from root to this note"""
    breadcrumb = []
    current_id = note_id
    
    # Walk up the tree to build breadcrumb
    while current_id is not None:
        result = await db.execute(
            select(Note).where(Note.id == current_id)
        )
        note = result.scalar_one_or_none()
        
        if not note:
            break
            
        breadcrumb.insert(0, {
            "id": note.id,
            "title": note.title,
            "icon": note.icon or "📄"
        })
        current_id = note.parent_id
    
    return breadcrumb


@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    search: str = None,
    parent_id: Optional[int] = Query(None, description="Filter by parent note ID. Use -1 for root notes only."),
    section_id: int = None,
    is_pinned: bool = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all notes with optional search, parent, section, and pin filters (excluding deleted)"""
    try:
        query = select(Note).options(selectinload(Note.section), selectinload(Note.entities)).where(
            Note.deleted_at.is_(None)
        ).order_by(
            desc(Note.is_pinned),  # Pinned first
            asc(Note.position),
            desc(Note.updated_at)
        )
    except Exception:
        # Fallback if deleted_at column doesn't exist
        query = select(Note).options(selectinload(Note.section), selectinload(Note.entities)).order_by(
            desc(Note.is_pinned),
            asc(Note.position),
            desc(Note.updated_at)
        )
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Note.title.ilike(search_pattern),
                Note.content.ilike(search_pattern)
            )
        )
    
    # Filter by parent_id: -1 means root notes only (parent_id is NULL)
    if parent_id is not None:
        if parent_id == -1:
            query = query.where(Note.parent_id.is_(None))
        else:
            query = query.where(Note.parent_id == parent_id)
    
    if section_id is not None:
        query = query.where(Note.section_id == section_id)
    
    if is_pinned is not None:
        query = query.where(Note.is_pinned == is_pinned)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()



@router.get("/recent", response_model=List[NoteResponse])
async def get_recent_notes(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get recent notes for home screen (excluding deleted)"""
    try:
        result = await db.execute(
            select(Note)
            .options(selectinload(Note.section), selectinload(Note.entities))
            .where(Note.deleted_at.is_(None))
            .order_by(desc(Note.updated_at))
            .limit(limit)
        )
    except Exception:
        # Fallback if deleted_at column doesn't exist
        result = await db.execute(
            select(Note)
            .options(selectinload(Note.section), selectinload(Note.entities))
            .order_by(desc(Note.updated_at))
            .limit(limit)
        )
    return result.scalars().all()


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific note by ID"""
    result = await db.execute(
        select(Note).options(selectinload(Note.section), selectinload(Note.entities)).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note


@router.post("/", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new note"""
    note = Note(**note_data.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    
    # Reload with section to satisfy ResponseModel
    result = await db.execute(
        select(Note).options(selectinload(Note.section), selectinload(Note.entities)).where(Note.id == note.id)
    )
    return result.scalar_one()


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a note"""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    note.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(note)
    
    # Reload with section to satisfy ResponseModel
    result = await db.execute(
        select(Note).options(selectinload(Note.section), selectinload(Note.entities)).where(Note.id == note.id)
    )
    return result.scalar_one()


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a note (move to recycle bin) or permanently delete if column doesn't exist"""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    try:
        # Try soft delete by setting deleted_at timestamp
        note.deleted_at = datetime.utcnow()
        await db.commit()
        return {"message": "Note moved to recycle bin"}
    except Exception:
        # Fallback to permanent delete if deleted_at column doesn't exist
        await db.delete(note)
        await db.commit()
        return {"message": "Note deleted successfully"}


@router.get("/recycle-bin/list", response_model=List[NoteResponse])
async def get_deleted_notes(
    db: AsyncSession = Depends(get_db)
):
    """Get all deleted notes (recycle bin)"""
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.section), selectinload(Note.entities))
        .where(Note.deleted_at.isnot(None))
        .order_by(desc(Note.deleted_at))
    )
    return result.scalars().all()


@router.post("/{note_id}/restore")
async def restore_note(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Restore a note from recycle bin"""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.deleted_at is None:
        raise HTTPException(status_code=400, detail="Note is not in recycle bin")
    
    # Restore by clearing deleted_at
    note.deleted_at = None
    note.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Note restored successfully"}


@router.delete("/{note_id}/permanent")
async def permanently_delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete a note from recycle bin"""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await db.delete(note)
    await db.commit()
    return {"message": "Note permanently deleted"}


@router.post("/recycle-bin/restore-bulk")
async def restore_notes_bulk(
    note_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """Restore multiple notes from recycle bin"""
    result = await db.execute(
        select(Note).where(Note.id.in_(note_ids))
    )
    notes = result.scalars().all()
    
    for note in notes:
        if note.deleted_at is not None:
            note.deleted_at = None
            note.updated_at = datetime.utcnow()
    
    await db.commit()
    return {"message": f"{len(notes)} notes restored"}


@router.delete("/recycle-bin/delete-bulk")
async def permanently_delete_notes_bulk(
    note_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete multiple notes from recycle bin"""
    result = await db.execute(
        select(Note).where(Note.id.in_(note_ids))
    )
    notes = result.scalars().all()
    
    for note in notes:
        await db.delete(note)
    
    await db.commit()
    return {"message": f"{len(notes)} notes permanently deleted"}


@router.delete("/recycle-bin/empty")
async def empty_recycle_bin(
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete all notes from recycle bin"""
    result = await db.execute(
        select(Note).where(Note.deleted_at.isnot(None))
    )
    notes = result.scalars().all()
    
    for note in notes:
        await db.delete(note)
    
    await db.commit()
    return {"message": "Recycle bin emptied"}

