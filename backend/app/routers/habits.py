from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, timedelta, datetime

from app.database import get_db
from app.models import Habit

router = APIRouter()

class HabitCreate(BaseModel):
    title: str

class HabitRead(BaseModel):
    id: int
    title: str
    streak: int
    completed_today: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[HabitRead])
async def get_habits(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit))
    habits = result.scalars().all()

    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()

    response = []
    for h in habits:
        completed_today = h.last_completed_date == today_str

        # Auto-reset streak if skipped yesterday (logic could be more complex, but simple for now)
        # If last completed was before yesterday, streak is broken.
        # But we only reset on write/toggle usually. For read, just display.
        # Let's display raw for now, logic on toggle.

        response.append({
            "id": h.id,
            "title": h.title,
            "streak": h.streak,
            "completed_today": completed_today
        })
    return response

@router.post("/", response_model=HabitRead)
async def create_habit(habit: HabitCreate, db: AsyncSession = Depends(get_db)):
    new_habit = Habit(title=habit.title)
    db.add(new_habit)
    await db.commit()
    await db.refresh(new_habit)
    return {
        "id": new_habit.id,
        "title": new_habit.title,
        "streak": new_habit.streak,
        "completed_today": False
    }

@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, db: AsyncSession = Depends(get_db)):
    habit = await db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()
    return {"message": "Habit deleted"}

@router.post("/{habit_id}/toggle")
async def toggle_habit(habit_id: int, db: AsyncSession = Depends(get_db)):
    habit = await db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()

    if habit.last_completed_date == today_str:
        # Untoggle
        habit.last_completed_date = None
        habit.streak = max(0, habit.streak - 1)
        # If we untoggle, we might need to know if it was streak of yesterday to restore.
        # Simple logic: just decrement.
    else:
        # Toggle
        if habit.last_completed_date == yesterday_str:
             habit.streak += 1
        elif habit.last_completed_date != today_str: # Missed days or new
             habit.streak = 1 # Reset to 1 (today)

        habit.last_completed_date = today_str

    await db.commit()
    await db.refresh(habit)
    return {"message": "Toggled"}
