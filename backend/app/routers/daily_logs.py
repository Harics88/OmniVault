"""
Daily Logs Router - CRUD operations for daily log entries
"""

from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import DailyLog
from app.schemas import DailyLogCreate, DailyLogUpdate, DailyLogResponse

router = APIRouter()


@router.get("/", response_model=List[DailyLogResponse])
async def get_daily_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all daily logs, ordered by date descending"""
    result = await db.execute(
        select(DailyLog)
        .order_by(desc(DailyLog.date))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/today", response_model=DailyLogResponse)
async def get_today_log(db: AsyncSession = Depends(get_db)):
    """Get or create today's log"""
    today = date.today()
    result = await db.execute(
        select(DailyLog).where(DailyLog.date == today)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        log = DailyLog(date=today, content="")
        db.add(log)
        await db.commit()
        await db.refresh(log)
    
    return log


@router.get("/date/{log_date}", response_model=DailyLogResponse)
async def get_log_by_date(
    log_date: date,
    db: AsyncSession = Depends(get_db)
):
    """Get log for a specific date"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.date == log_date)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        # Create empty log for that date
        log = DailyLog(date=log_date, content="")
        db.add(log)
        await db.commit()
        await db.refresh(log)
    
    return log


@router.get("/{log_id}", response_model=DailyLogResponse)
async def get_daily_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific daily log by ID"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    return log


@router.post("/", response_model=DailyLogResponse)
async def create_daily_log(
    log_data: DailyLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new daily log"""
    # Check if log already exists for this date
    result = await db.execute(
        select(DailyLog).where(DailyLog.date == log_data.date)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Log for {log_data.date} already exists"
        )
    
    log = DailyLog(**log_data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.put("/{log_id}", response_model=DailyLogResponse)
async def update_daily_log(
    log_id: int,
    log_data: DailyLogUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a daily log (auto-save support)"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    log.content = log_data.content
    log.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(log)
    return log


@router.put("/date/{log_date}", response_model=DailyLogResponse)
async def update_log_by_date(
    log_date: date,
    log_data: DailyLogUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update log by date (creates if doesn't exist)"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.date == log_date)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        log = DailyLog(date=log_date, content=log_data.content)
        db.add(log)
    else:
        log.content = log_data.content
        log.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}")
async def delete_daily_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a daily log"""
    result = await db.execute(
        select(DailyLog).where(DailyLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    await db.delete(log)
    await db.commit()
    return {"message": "Daily log deleted successfully"}
