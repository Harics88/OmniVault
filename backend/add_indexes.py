"""
Database Performance Optimization - Add Indexes
Creates indexes for commonly queried columns to improve performance
"""

import asyncio
from sqlalchemy import text
from app.database import engine

async def add_indexes():
    """Add performance indexes to database tables"""
    
    indexes = [
        # Notes indexes
        "CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)",
        "CREATE INDEX IF NOT EXISTS idx_notes_section_id ON notes(section_id)",
        "CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)",
        
        # Tasks indexes
        "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at)",
        
        # Subtasks indexes
        "CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)",
        "CREATE INDEX IF NOT EXISTS idx_subtasks_order ON subtasks(order_index)",
        
        # Snippets indexes
        "CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language)",
        "CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC)",
        
        # Bookmarks indexes
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id ON bookmarks(category_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_is_file ON bookmarks(is_file)",
        
        # Sections (Note Folders) indexes
        "CREATE INDEX IF NOT EXISTS idx_sections_parent_id ON sections(parent_id)",
        "CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order_index)",
        
        # Daily Logs indexes
        "CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date)",
    ]
    
    async with engine.begin() as conn:
        for index_sql in indexes:
            try:
                await conn.execute(text(index_sql))
                print(f"✅ Created: {index_sql.split('idx_')[1].split(' ON')[0]}")
            except Exception as e:
                print(f"❌ Failed: {index_sql.split('idx_')[1].split(' ON')[0]} - {e}")
    
    print("\n✅ Database indexes created successfully!")
    print("Performance should be improved for queries on indexed columns.")

if __name__ == "__main__":
    print("Adding database indexes for performance optimization...")
    print("-" * 60)
    asyncio.run(add_indexes())
