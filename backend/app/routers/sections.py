"""
Note Sections Router - CRUD operations for note sections/categories
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import NoteSection, Note
from app.schemas import NoteSectionCreate, NoteSectionUpdate, NoteSectionResponse

router = APIRouter()


# Default sections to seed
DEFAULT_SECTIONS = [
    {"name": "Work", "color": "#3B82F6", "icon": "💼", "position": 0},
    {"name": "Ideas", "color": "#F59E0B", "icon": "💡", "position": 1},
    {"name": "Reference", "color": "#10B981", "icon": "📚", "position": 2},
    {"name": "Technical", "color": "#8B5CF6", "icon": "🔧", "position": 3},
    {"name": "Personal", "color": "#EC4899", "icon": "📝", "position": 4},
]


@router.get("/", response_model=List[NoteSectionResponse])
async def get_sections(
    db: AsyncSession = Depends(get_db)
):
    """Get all sections with note counts"""
    result = await db.execute(
        select(NoteSection).order_by(NoteSection.position)
    )
    sections = result.scalars().all()
    
    # If no sections exist, create defaults
    if len(sections) == 0:
        for section_data in DEFAULT_SECTIONS:
            section = NoteSection(**section_data)
            db.add(section)
        await db.commit()
        
        result = await db.execute(
            select(NoteSection).order_by(NoteSection.position)
        )
        sections = result.scalars().all()
    
    return sections


@router.get("/{section_id}", response_model=NoteSectionResponse)
async def get_section(
    section_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific section by ID"""
    result = await db.execute(
        select(NoteSection).where(NoteSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return section


@router.post("/", response_model=NoteSectionResponse)
async def create_section(
    section_data: NoteSectionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new section"""
    # Get max position
    result = await db.execute(select(func.max(NoteSection.position)))
    max_pos = result.scalar() or 0
    
    section = NoteSection(**section_data.model_dump())
    section.position = max_pos + 1
    
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.put("/{section_id}", response_model=NoteSectionResponse)
async def update_section(
    section_id: int,
    section_data: NoteSectionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a section"""
    result = await db.execute(
        select(NoteSection).where(NoteSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    update_data = section_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)
    
    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/{section_id}")
async def delete_section(
    section_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a section (notes become uncategorized)"""
    result = await db.execute(
        select(NoteSection).where(NoteSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    await db.delete(section)
    await db.commit()
    return {"message": "Section deleted successfully"}
