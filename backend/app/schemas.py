"""
Pydantic schemas for request/response validation
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models import TaskStatus


# ============ Daily Log Schemas ============

class DailyLogBase(BaseModel):
    content: str = ""


class DailyLogCreate(DailyLogBase):
    date: date


class DailyLogUpdate(DailyLogBase):
    pass


class DailyLogResponse(DailyLogBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    date: date
    created_at: datetime
    updated_at: datetime


# ============ Subtask Schemas ============

class SubtaskBase(BaseModel):
    title: str
    completed: bool = False


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None


class SubtaskResponse(SubtaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    task_id: int
    order: int
    created_at: datetime


# ============ Task Schemas ============

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    status: TaskStatus = TaskStatus.NOT_STARTED
    due_date: Optional[date] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TaskCreate(TaskBase):
    subtasks: Optional[List[SubtaskCreate]] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[date] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    order: Optional[int] = None


class TaskReorder(BaseModel):
    task_ids: List[int]


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order: int
    subtasks: List[SubtaskResponse] = []
    created_at: datetime
    updated_at: datetime


# ============ Note Schemas ============

class NoteBase(BaseModel):
    title: str
    content: str = ""


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime


# ============ Snippet Schemas ============

class SnippetBase(BaseModel):
    title: str
    code: str
    language: str = "text"
    description: Optional[str] = ""


class SnippetCreate(SnippetBase):
    pass


class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None


class SnippetResponse(SnippetBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime


# ============ Bookmark Category Schemas ============

class BookmarkCategoryBase(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    order: int = 0


class BookmarkCategoryCreate(BookmarkCategoryBase):
    pass


class BookmarkCategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class BookmarkCategoryResponse(BookmarkCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


# ============ Bookmark Schemas ============

class BookmarkBase(BaseModel):
    title: str
    url: str
    description: Optional[str] = ""
    category_id: Optional[int] = None
    icon: Optional[str] = None
    is_file: bool = False
    order: int = 0


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    icon: Optional[str] = None
    is_file: Optional[bool] = None
    order: Optional[int] = None


class BookmarkResponse(BookmarkBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime



# ============ Search Schemas ============

class SearchResult(BaseModel):
    type: str  # 'task', 'note', 'snippet', 'bookmark', 'daily_log'
    id: int
    title: str
    preview: str
    updated_at: datetime


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


# ============ Link Schemas ============

class LinkItems(BaseModel):
    item_ids: List[int]
