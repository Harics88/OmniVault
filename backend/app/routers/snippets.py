"""
Snippets Router - CRUD operations for code snippets
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Snippet
from app.schemas import SnippetCreate, SnippetUpdate, SnippetResponse

router = APIRouter()

# Common programming languages
SUPPORTED_LANGUAGES = [
    "python", "javascript", "typescript", "sql", "bash", "shell",
    "java", "go", "rust", "cpp", "c", "csharp", "ruby", "php",
    "html", "css", "json", "yaml", "xml", "markdown", "text"
]


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {"languages": SUPPORTED_LANGUAGES}


@router.get("/", response_model=List[SnippetResponse])
async def get_snippets(
    language: str = None,
    search: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all snippets with optional filtering"""
    query = select(Snippet).where(Snippet.deleted_at.is_(None)).options(selectinload(Snippet.entities)).order_by(desc(Snippet.is_pinned), desc(Snippet.updated_at))

    
    if language:
        query = query.where(Snippet.language == language.lower())
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Snippet.title.ilike(search_pattern),
                Snippet.code.ilike(search_pattern),
                Snippet.description.ilike(search_pattern)
            )
        )
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/recent", response_model=List[SnippetResponse])
async def get_recent_snippets(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get recent snippets for home screen"""
    result = await db.execute(
        select(Snippet)
        .options(selectinload(Snippet.entities))
        .where(Snippet.deleted_at.is_(None))
        .order_by(desc(Snippet.updated_at))
        .limit(limit)
    )
    return result.scalars().all()



@router.get("/{snippet_id}", response_model=SnippetResponse)
async def get_snippet(
    snippet_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific snippet by ID"""
    result = await db.execute(
        select(Snippet).options(selectinload(Snippet.entities)).where(Snippet.id == snippet_id)
    )
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    return snippet


@router.post("/", response_model=SnippetResponse)
async def create_snippet(
    snippet_data: SnippetCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new snippet"""
    data = snippet_data.model_dump()
    data['language'] = data['language'].lower()
    
    snippet = Snippet(**data)
    db.add(snippet)
    await db.commit()
    
    # Reload with entities to satisfy ResponseModel
    result = await db.execute(
        select(Snippet).options(selectinload(Snippet.entities)).where(Snippet.id == snippet.id)
    )
    return result.scalar_one()


@router.put("/{snippet_id}", response_model=SnippetResponse)
async def update_snippet(
    snippet_id: int,
    snippet_data: SnippetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a snippet"""
    result = await db.execute(
        select(Snippet).where(Snippet.id == snippet_id)
    )
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    update_data = snippet_data.model_dump(exclude_unset=True)
    if 'language' in update_data:
        update_data['language'] = update_data['language'].lower()
    
    for field, value in update_data.items():
        setattr(snippet, field, value)
    
    await db.commit()
    
    # Reload with entities to satisfy ResponseModel
    result = await db.execute(
        select(Snippet).options(selectinload(Snippet.entities)).where(Snippet.id == snippet.id)
    )
    return result.scalar_one()


@router.delete("/{snippet_id}")
async def delete_snippet(
    snippet_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a snippet"""
    result = await db.execute(
        select(Snippet).where(Snippet.id == snippet_id)
    )
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    snippet.deleted_at = datetime.utcnow()
    await db.commit()
    return {"message": "Snippet moved to recycle bin"}

