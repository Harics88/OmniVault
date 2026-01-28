"""
SQLAlchemy models for MyTasker
"""

from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Text, Integer, DateTime, Date, Boolean, ForeignKey, Enum as SQLEnum, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base

# Association Tables
class TaskStatus(str, enum.Enum):
    """Task status enumeration"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Association tables for many-to-many relationships
log_task_association = Table(
    'log_task_links',
    Base.metadata,
    Column('log_id', Integer, ForeignKey('daily_logs.id', ondelete='CASCADE'), primary_key=True),
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True)
)

log_note_association = Table(
    'log_note_links',
    Base.metadata,
    Column('log_id', Integer, ForeignKey('daily_logs.id', ondelete='CASCADE'), primary_key=True),
    Column('note_id', Integer, ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True)
)

log_snippet_association = Table(
    'log_snippet_links',
    Base.metadata,
    Column('log_id', Integer, ForeignKey('daily_logs.id', ondelete='CASCADE'), primary_key=True),
    Column('snippet_id', Integer, ForeignKey('snippets.id', ondelete='CASCADE'), primary_key=True)
)

log_bookmark_association = Table(
    'log_bookmark_links',
    Base.metadata,
    Column('log_id', Integer, ForeignKey('daily_logs.id', ondelete='CASCADE'), primary_key=True),
    Column('bookmark_id', Integer, ForeignKey('bookmarks.id', ondelete='CASCADE'), primary_key=True)
)

task_note_association = Table(
    'task_note_links',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('note_id', Integer, ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True)
)


class DailyLog(Base):
    """Daily log entries - free-text notebook style"""
    __tablename__ = 'daily_logs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks: Mapped[List["Task"]] = relationship(
        secondary=log_task_association,
        back_populates="daily_logs"
    )
    notes: Mapped[List["Note"]] = relationship(
        secondary=log_note_association,
        back_populates="daily_logs"
    )
    snippets: Mapped[List["Snippet"]] = relationship(
        secondary=log_snippet_association,
        back_populates="daily_logs"
    )
    bookmarks: Mapped[List["Bookmark"]] = relationship(
        secondary=log_bookmark_association,
        back_populates="daily_logs"
    )


class Task(Base):
    """Tasks with minimal fields"""
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.NOT_STARTED
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(TaskPriority),
        default=TaskPriority.MEDIUM
    )
    is_personal: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    daily_logs: Mapped[List["DailyLog"]] = relationship(
        secondary=log_task_association,
        back_populates="tasks"
    )
    notes: Mapped[List["Note"]] = relationship(
        secondary=task_note_association,
        back_populates="tasks"
    )
    subtasks: Mapped[List["Subtask"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Subtask.order"
    )


class Subtask(Base):
    """Subtasks/checklist items for tasks"""
    __tablename__ = 'subtasks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    task: Mapped["Task"] = relationship(back_populates="subtasks")


class NoteSection(Base):
    """Sections/categories for organizing notes"""
    __tablename__ = 'note_sections'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#3B82F6")  # Hex color
    icon: Mapped[Optional[str]] = mapped_column(String(20), default="📝")  # Emoji
    position: Mapped[int] = mapped_column(Integer, default=0)  # Sort order
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    notes: Mapped[List["Note"]] = relationship(
        back_populates="section",
        order_by="Note.updated_at.desc()"
    )


class Note(Base):
    """Notes for longer-form content"""
    __tablename__ = 'notes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    icon: Mapped[Optional[str]] = mapped_column(String(20), default="📄")  # Emoji icon
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('notes.id', ondelete='CASCADE'), nullable=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)  # Sort order within siblings
    section_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('note_sections.id', ondelete='SET NULL'), nullable=True
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=None)  # Soft delete
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    section: Mapped[Optional["NoteSection"]] = relationship(back_populates="notes")
    parent: Mapped[Optional["Note"]] = relationship(
        back_populates="children",
        remote_side=[id]
    )
    children: Mapped[List["Note"]] = relationship(
        back_populates="parent",
        order_by="Note.position, Note.title"
    )
    daily_logs: Mapped[List["DailyLog"]] = relationship(
        secondary=log_note_association,
        back_populates="notes"
    )
    tasks: Mapped[List["Task"]] = relationship(
        secondary=task_note_association,
        back_populates="notes"
    )


class Snippet(Base):
    """Code snippets with language support"""
    __tablename__ = 'snippets'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(50), default="text")
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    daily_logs: Mapped[List["DailyLog"]] = relationship(
        secondary=log_snippet_association,
        back_populates="snippets"
    )


class BookmarkCategory(Base):
    """Categories for bookmarks"""
    __tablename__ = 'bookmark_categories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), default="#3B82F6") # Default blue
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    bookmarks: Mapped[List["Bookmark"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Bookmark.order"
    )


class Bookmark(Base):
    """Web bookmarks with title and URL"""
    __tablename__ = 'bookmarks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('bookmark_categories.id', ondelete='SET NULL'), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    icon: Mapped[Optional[str]] = mapped_column(String(500), nullable=True) # Icon URL or path
    is_file: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped[Optional["BookmarkCategory"]] = relationship(back_populates="bookmarks")
    daily_logs: Mapped[List["DailyLog"]] = relationship(
        secondary=log_bookmark_association,
        back_populates="bookmarks"
    )







class SecretType(str, enum.Enum):
    """Secret type enumeration for vault"""
    DATABASE = "database"
    SFTP = "sftp"
    WEBSITE = "website"


class Secret(Base):
    """Vault secrets for storing credentials"""
    __tablename__ = 'secrets'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[SecretType] = mapped_column(
        SQLEnum(SecretType),
        nullable=False
    )
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    meta_json: Mapped[str] = mapped_column(Text, default="{}")  # JSON string for type-specific fields
    tags: Mapped[Optional[str]] = mapped_column(String(500), default="")  # Comma-separated tags
    username: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    password: Mapped[str] = mapped_column(Text, nullable=False)  # Plaintext for MVP
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AppConfig(Base):
    """General application settings/configuration"""
    __tablename__ = 'app_config'

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

