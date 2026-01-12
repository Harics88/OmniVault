from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models import Tag

router = APIRouter()

class TagCreate(BaseModel):
    name: str
    color: str = "#3b82f6"

class TagRead(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TagRead])
async def get_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    return result.scalars().all()

@router.post("/", response_model=TagRead)
async def create_tag(tag: TagCreate, db: AsyncSession = Depends(get_db)):
    # Check if exists
    result = await db.execute(select(Tag).where(Tag.name == tag.name))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Tag already exists")

    new_tag = Tag(name=tag.name, color=tag.color)
    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)
    return new_tag

@router.delete("/{tag_id}")
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted"}
