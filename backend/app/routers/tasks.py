"""
Tasks Router - CRUD operations for tasks and subtasks
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Task, TaskStatus, Subtask
from app.schemas import (
    TaskCreate, TaskUpdate, TaskResponse, TaskReorder,
    SubtaskCreate, SubtaskUpdate, SubtaskResponse
)

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all tasks, optionally filtered by status"""
    query = select(Task).options(selectinload(Task.subtasks)).order_by(asc(Task.order), desc(Task.created_at))
    
    if status:
        query = query.where(Task.status == status)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/stats")
async def get_task_stats(db: AsyncSession = Depends(get_db)):
    """Get task statistics"""
    result = await db.execute(
        select(Task.status, func.count(Task.id))
        .group_by(Task.status)
    )
    stats = {status.value: 0 for status in TaskStatus}
    for status, count in result.all():
        stats[status.value] = count
    
    total = sum(stats.values())
    return {
        "total": total,
        "by_status": stats
    }


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific task by ID"""
    result = await db.execute(
        select(Task).options(selectinload(Task.subtasks)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new task with optional subtasks"""
    # Get max order for new task
    result = await db.execute(
        select(func.max(Task.order))
    )
    max_order = result.scalar() or 0
    
    # Extract subtasks from task_data
    subtasks_data = task_data.subtasks or []
    task_dict = task_data.model_dump(exclude={'subtasks'})
    
    task = Task(
        **task_dict,
        order=max_order + 1
    )
    db.add(task)
    await db.flush()  # Get task ID
    
    # Create subtasks
    for idx, subtask_data in enumerate(subtasks_data):
        subtask = Subtask(
            task_id=task.id,
            title=subtask_data.title,
            completed=subtask_data.completed,
            order=idx
        )
        db.add(subtask)
    
    await db.commit()
    
    # Reload with subtasks
    result = await db.execute(
        select(Task).options(selectinload(Task.subtasks)).where(Task.id == task.id)
    )
    return result.scalar_one()


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a task"""
    result = await db.execute(
        select(Task).options(selectinload(Task.subtasks)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Handle auto-setting started_at and completed_at
    if 'status' in update_data:
        new_status = update_data['status']
        if new_status == TaskStatus.IN_PROGRESS and not task.started_at:
            task.started_at = datetime.utcnow()
        elif new_status == TaskStatus.DONE:
            if not task.started_at:
                task.started_at = datetime.utcnow()
            task.completed_at = datetime.utcnow()
        elif new_status == TaskStatus.NOT_STARTED:
            task.started_at = None
            task.completed_at = None

    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/reorder")
async def reorder_tasks(
    reorder_data: TaskReorder,
    db: AsyncSession = Depends(get_db)
):
    """Reorder tasks by updating their order field"""
    for index, task_id in enumerate(reorder_data.task_ids):
        result = await db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        if task:
            task.order = index
    
    await db.commit()
    return {"message": "Tasks reordered successfully"}


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a task"""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted successfully"}


# ============ Subtask Endpoints ============

@router.post("/{task_id}/subtasks", response_model=SubtaskResponse)
async def create_subtask(
    task_id: int,
    subtask_data: SubtaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new subtask for a task"""
    # Verify task exists
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get max order for new subtask
    result = await db.execute(
        select(func.max(Subtask.order)).where(Subtask.task_id == task_id)
    )
    max_order = result.scalar() or 0
    
    subtask = Subtask(
        task_id=task_id,
        title=subtask_data.title,
        completed=subtask_data.completed,
        order=max_order + 1
    )
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    task_id: int,
    subtask_id: int,
    subtask_data: SubtaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a subtask"""
    result = await db.execute(
        select(Subtask).where(Subtask.id == subtask_id, Subtask.task_id == task_id)
    )
    subtask = result.scalar_one_or_none()
    
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    update_data = subtask_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subtask, field, value)
    
    await db.commit()
    await db.refresh(subtask)
    return subtask


@router.delete("/{task_id}/subtasks/{subtask_id}")
async def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a subtask"""
    result = await db.execute(
        select(Subtask).where(Subtask.id == subtask_id, Subtask.task_id == task_id)
    )
    subtask = result.scalar_one_or_none()
    
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    await db.delete(subtask)
    await db.commit()
    return {"message": "Subtask deleted successfully"}
