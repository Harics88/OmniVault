"""
Log Entries Router - Individual "check-ins" within a daily log.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import LogEntry, DailyLog, Entity
from app.schemas import LogEntryCreate, LogEntryUpdate, LogEntryResponse

router = APIRouter()


@router.post("/", response_model=LogEntryResponse)
async def create_log_entry(
    entry_data: LogEntryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new log entry (check-in)"""
    # Ensure DailyLog exists for this date
    result = await db.execute(
        select(DailyLog).where(DailyLog.date == entry_data.log_date)
    )
    daily_log = result.scalar_one_or_none()
    
    if not daily_log:
        daily_log = DailyLog(date=entry_data.log_date, content="")
        db.add(daily_log)
        await db.flush()

    # Create entry
    entry = LogEntry(
        log_date=entry_data.log_date,
        type=entry_data.type,
        content=entry_data.content,
        timestamp=entry_data.timestamp
    )
    
    # Handle entity links
    if entry_data.entity_ids:
        entity_result = await db.execute(
            select(Entity).where(Entity.id.in_(entry_data.entity_ids))
        )
        entities = entity_result.scalars().all()
        entry.entities.extend(entities)
        
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    
    # Re-load with entities relationship to avoid MissingGreenlet on serialization
    result = await db.execute(
        select(LogEntry).where(LogEntry.id == entry.id)
        .options(selectinload(LogEntry.entities))
    )
    entry = result.scalar_one()
    return entry


@router.put("/{entry_id}", response_model=LogEntryResponse)
async def update_log_entry(
    entry_id: int,
    entry_data: LogEntryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing log entry"""
    result = await db.execute(
        select(LogEntry).where(LogEntry.id == entry_id)
        .options(selectinload(LogEntry.entities))
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    
    for key, value in entry_data.model_dump(exclude_unset=True).items():
        if key == "entity_ids":
            if value is not None:
                entity_result = await db.execute(
                    select(Entity).where(Entity.id.in_(value))
                )
                entities = entity_result.scalars().all()
                entry.entities = list(entities)
        else:
            setattr(entry, key, value)
    
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
async def delete_log_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a log entry"""
    result = await db.execute(
        select(LogEntry).where(LogEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    
    await db.delete(entry)
    await db.commit()
    return {"message": "Log entry deleted successfully"}
