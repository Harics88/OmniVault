"""
Bookmarks Router - CRUD operations for bookmarks
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Bookmark, BookmarkCategory
from app.schemas import (
    BookmarkCreate, BookmarkUpdate, BookmarkResponse,
    BookmarkCategoryCreate, BookmarkCategoryUpdate, BookmarkCategoryResponse
)

router = APIRouter()


# ============ Category Endpoints ============

@router.get("/categories", response_model=List[BookmarkCategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all bookmark categories"""
    result = await db.execute(select(BookmarkCategory).order_by(BookmarkCategory.order))
    return result.scalars().all()


@router.post("/categories", response_model=BookmarkCategoryResponse)
async def create_category(
    category_data: BookmarkCategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new bookmark category"""
    category = BookmarkCategory(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=BookmarkCategoryResponse)
async def update_category(
    category_id: int,
    category_data: BookmarkCategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a bookmark category"""
    result = await db.execute(
        select(BookmarkCategory).where(BookmarkCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a bookmark category"""
    result = await db.execute(
        select(BookmarkCategory).where(BookmarkCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}


# ============ Bookmark Endpoints ============



@router.get("/", response_model=List[BookmarkResponse])
async def get_bookmarks(
    search: str = None,
    category_id: int = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Get all bookmarks with optional search and category filter"""
    query = select(Bookmark).where(Bookmark.deleted_at.is_(None)).options(selectinload(Bookmark.entities)).order_by(Bookmark.order, desc(Bookmark.updated_at))

    
    if category_id:
        query = query.where(Bookmark.category_id == category_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Bookmark.title.ilike(search_pattern),
                Bookmark.url.ilike(search_pattern),
                Bookmark.description.ilike(search_pattern)
            )
        )
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/recent", response_model=List[BookmarkResponse])
async def get_recent_bookmarks(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get recent bookmarks for home screen"""
    result = await db.execute(
        select(Bookmark)
        .options(selectinload(Bookmark.entities))
        .where(Bookmark.deleted_at.is_(None))
        .order_by(desc(Bookmark.updated_at))
        .limit(limit)
    )
    return result.scalars().all()



@router.get("/{bookmark_id}", response_model=BookmarkResponse)
async def get_bookmark(
    bookmark_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific bookmark by ID"""
    result = await db.execute(
        select(Bookmark).options(selectinload(Bookmark.entities)).where(Bookmark.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return bookmark


@router.post("/", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new bookmark"""
    bookmark = Bookmark(**bookmark_data.model_dump())
    db.add(bookmark)
    await db.commit()
    
    # Reload with entities to satisfy ResponseModel
    result = await db.execute(
        select(Bookmark).options(selectinload(Bookmark.entities)).where(Bookmark.id == bookmark.id)
    )
    return result.scalar_one()


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: int,
    bookmark_data: BookmarkUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a bookmark"""
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    update_data = bookmark_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bookmark, field, value)
    
    await db.commit()
    
    # Reload with entities to satisfy ResponseModel
    result = await db.execute(
        select(Bookmark).options(selectinload(Bookmark.entities)).where(Bookmark.id == bookmark.id)
    )
    return result.scalar_one()


@router.delete("/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a bookmark"""
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    bookmark.deleted_at = datetime.utcnow()
    await db.commit()
    return {"message": "Bookmark moved to recycle bin"}



@router.post("/{bookmark_id}/open")
async def open_bookmark(
    bookmark_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Open a bookmark (local file or URL)"""
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    import webbrowser
    import os
    import platform

    url = bookmark.url
    
    # Check if it's a local file
    if bookmark.is_file or url.startswith('file://') or os.path.exists(url):
        try:
            if platform.system() == 'Windows':
                os.startfile(url)
            elif platform.system() == 'Darwin': # macOS
                import subprocess
                subprocess.call(['open', url])
            else: # linux variants
                import subprocess
                subprocess.call(['xdg-open', url])
            return {"message": "File opened successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not open file: {str(e)}")
    
    # Fallback to webbrowser for URLs
    webbrowser.open(url)
    return {"message": "URL opened successfully"}

