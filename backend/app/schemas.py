"""
Pydantic schemas for request/response validation
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models import TaskStatus, TaskPriority
import enum


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
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    is_personal: bool = False


class TaskCreate(TaskBase):
    subtasks: Optional[List[SubtaskCreate]] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    is_personal: Optional[bool] = None
    order: Optional[int] = None


class TaskReorder(BaseModel):
    task_ids: List[int]


class SubtaskReorder(BaseModel):
    subtask_ids: List[int]


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order: int
    subtasks: List[SubtaskResponse] = []
    created_at: datetime
    updated_at: datetime


# ============ Note Section Schemas ============

class NoteSectionBase(BaseModel):
    name: str
    color: str = "#3B82F6"
    icon: Optional[str] = "📝"
    position: int = 0


class NoteSectionCreate(NoteSectionBase):
    pass


class NoteSectionUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    position: Optional[int] = None


class NoteSectionResponse(NoteSectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


# ============ Note Schemas ============

class NoteBase(BaseModel):
    title: str
    content: str = ""
    icon: Optional[str] = "📄"
    parent_id: Optional[int] = None
    position: int = 0
    section_id: Optional[int] = None
    is_pinned: bool = False
    tags: Optional[str] = ""


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    position: Optional[int] = None
    section_id: Optional[int] = None
    is_pinned: Optional[bool] = None
    tags: Optional[str] = None


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
    section: Optional[NoteSectionResponse] = None


# Forward reference for recursive children
class NoteTreeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    icon: Optional[str] = "📄"
    parent_id: Optional[int] = None
    section_id: Optional[int] = None
    position: int = 0
    is_pinned: bool = False
    children: List["NoteTreeResponse"] = []
    created_at: datetime
    updated_at: datetime


# Resolve forward reference
NoteTreeResponse.model_rebuild()


# ============ Snippet Schemas ============

class SnippetLanguage(str, enum.Enum):
    PYTHON = "python"
    SQL = "sql"
    BASH = "bash"
    SHELL = "shell"


class SnippetBase(BaseModel):
    title: str
    code: str
    language: SnippetLanguage = SnippetLanguage.PYTHON
    is_pinned: bool = False
    description: Optional[str] = ""


class SnippetCreate(SnippetBase):
    pass


class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    language: Optional[SnippetLanguage] = None
    is_pinned: Optional[bool] = None
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
    metadata: Optional[dict] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


# ============ Link Schemas ============

class LinkItems(BaseModel):
    item_ids: List[int]
