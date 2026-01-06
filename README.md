# MyTasker

A **dark-mode, local-first, single-user productivity app** for data engineers. Built with React, TypeScript, FastAPI, and SQLite.

## Features

### 🏠 Dashboard
- Quick stats overview (Active Tasks, Notes, Snippets, Bookmarks)
- Recent activity feed (tasks, notes, snippets, bookmarks)
- Direct navigation to any entity
- Real-time updates across all sections

### 📝 Daily Log
- Free-text notebook-style editor with rich text support
- Auto-save enabled
- Inline linking via `@` symbol (tasks, notes, snippets, bookmarks)
- Code snippet formatting with syntax highlighting
- Date navigation (previous/next days)
- TipTap editor with full formatting toolbar

### ✅ Tasks
- Multiple view modes: List, Board (Kanban), and Table
- Status: Not Started / In Progress / Done
- Priority levels: Low, Medium, High
- Subtasks with drag-and-drop reordering
- Full-screen task detail popout (`/tasks/:id`)
- Date tracking: Due Date, Started At, Completed At
- Side panel for quick task editing
- Persistent view mode preference

### 📄 Notes
- Hierarchical folder structure with drag-and-drop
- Rich text editor with full formatting support
- Soft delete with Recycle Bin
- Bulk operations (restore, delete, empty bin)
- Full-text search
- Breadcrumb navigation
- Quick access from sidebar
- Direct linking (`/notes/:id`)

### 💻 Code Snippets
- Syntax highlighting for 20+ languages
- One-click copy functionality
- Language filtering
- Direct linking (`/snippets/:id`)
- Description and metadata support
- Search across all snippets

### 🔖 Bookmarks
- Categorized bookmark organization with custom colors
- Support for both web URLs and local file paths
- Quick search across all bookmarks
- Category-based grouping
- External link support with automatic URL validation
- Local file opening via backend API

### 🔍 Global Search
- `Cmd/Ctrl+K` to open
- Search across all entities (tasks, notes, snippets, bookmarks, daily logs)
- Keyboard navigation
- Quick preview and navigation

### 🗑️ Recycle Bin
- Soft delete for notes
- Bulk restore operations
- Bulk permanent delete
- Empty entire recycle bin
- 30-day retention policy

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Query / TanStack Query (data fetching & caching)
- React Router v6 (routing)
- TipTap (rich text editor)
- Lucide Icons
- Prism React Renderer (syntax highlighting)
- date-fns (date utilities)

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy 2.0 (async ORM)
- SQLite (local-first database)
- Pydantic v2 (data validation)
- Uvicorn (ASGI server)

**DevOps:**
- Docker & Docker Compose
- Multi-stage builds for optimization

## Getting Started

### 🚀 **Enterprise / Standalone Edition (No Installation)**
**Perfect for corporate laptops, USB drives, or non-technical users.**

1.  **[Download MyTasker.exe](standalone/dist/MyTasker.exe)** (~56 MB) from this repository.
2.  **Double-click** to run.
3.  That's it! 

*   Runs instantly without Docker, Python, or Node.js.
*   Creates a `data/` folder next to the executable for your database.
*   Copy the executable to any Windows PC to run it.

---

### Prerequisites (For Developers)
- Docker & Docker Compose (recommended)
- OR Node.js 18+ and Python 3.11+ (for local development)

### Quick Start with Docker (For Developers)

```bash
# Clone the repository
git clone https://github.com/Harics88/MyTasker.git
cd MyTasker

# Start with Docker Compose
docker-compose up --build

# Access the app
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:5173
```

## Project Structure

```
MyTasker/
├── docker-compose.yml
├── start_mytasker.bat          # Windows startup script
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── src/
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx
│       │   ├── SearchModal.tsx
│       │   ├── TaskCard.tsx
│       │   ├── TaskPanel.tsx
│       │   ├── TaskTableView.tsx
│       │   ├── TaskListView.tsx
│       │   ├── NoteTree.tsx
│       │   ├── Breadcrumb.tsx
│       │   ├── ConfirmModal.tsx
│       │   ├── Calendar.tsx
│       │   ├── Editor/          # TipTap rich text editor
│       │   └── RichTextEditor.tsx
│       ├── pages/
│       │   ├── Home.tsx         # Dashboard
│       │   ├── DailyLog.tsx
│       │   ├── Tasks.tsx
│       │   ├── TaskPopout.tsx   # Full-screen task view
│       │   ├── Notes.tsx
│       │   ├── RecycleBin.tsx
│       │   ├── Snippets.tsx
│       │   ├── Bookmarks.tsx
│       │   ├── Settings.tsx
│       │   └── Shortcuts.tsx
│       ├── hooks/
│       │   └── useKeyboardShortcuts.ts
│       ├── lib/
│       │   └── api.ts           # API client
│       └── types/
│           └── index.ts
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py              # FastAPI app
        ├── database.py          # Database setup
        ├── models.py            # SQLAlchemy models
        ├── schemas.py           # Pydantic schemas
        └── routers/
            ├── daily_logs.py
            ├── tasks.py
            ├── notes.py
            ├── sections.py      # Note folders
            ├── snippets.py
            ├── bookmarks.py
            ├── search.py
            └── system.py        # System stats
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + D` | Go to today's daily log |
| `Cmd/Ctrl + K` | Open global search |
| `Cmd/Ctrl + Shift + C` | Create new snippet |
| `Cmd/Ctrl + Shift + H` | Go to Home |
| `Cmd/Ctrl + Shift + T` | Go to Tasks |
| `Cmd/Ctrl + Shift + N` | Go to Notes |
| `Cmd/Ctrl + Shift + S` | Go to Snippets |
| `Cmd/Ctrl + Shift + B` | Go to Bookmarks |
| `Escape` | Close modals/panels |

## API Endpoints

### System
- `GET /api/system/stats` - Get system statistics (counts for all entities)

### Daily Logs
- `GET /api/daily-logs` - List all logs
- `GET /api/daily-logs/today` - Get today's log
- `GET /api/daily-logs/date/{date}` - Get log by date
- `PUT /api/daily-logs/date/{date}` - Update log by date

### Tasks
- `GET /api/tasks` - List tasks (optional status filter)
- `GET /api/tasks/{id}` - Get single task
- `GET /api/tasks/stats` - Get task statistics
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/reorder` - Reorder tasks
- `DELETE /api/tasks/{id}` - Delete task
- **Subtasks:**
  - `POST /api/tasks/{task_id}/subtasks` - Create subtask
  - `PUT /api/tasks/{task_id}/subtasks/{subtask_id}` - Update subtask
  - `DELETE /api/tasks/{task_id}/subtasks/{subtask_id}` - Delete subtask
  - `POST /api/tasks/{task_id}/subtasks/reorder` - Reorder subtasks

### Notes
- `GET /api/notes` - List notes (non-deleted)
- `GET /api/notes/recent` - Get recent notes
- `GET /api/notes/{id}` - Get single note
- `GET /api/notes/{id}/breadcrumb` - Get note breadcrumb path
- `POST /api/notes` - Create note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Soft delete note
- **Recycle Bin:**
  - `GET /api/notes/deleted` - List deleted notes
  - `POST /api/notes/{id}/restore` - Restore deleted note
  - `DELETE /api/notes/{id}/permanent` - Permanently delete note
  - `POST /api/notes/restore-bulk` - Bulk restore notes
  - `POST /api/notes/delete-bulk` - Bulk permanent delete
  - `POST /api/notes/empty-recycle-bin` - Empty entire recycle bin

### Sections (Note Folders)
- `GET /api/sections/tree` - Get hierarchical folder tree
- `POST /api/sections` - Create folder
- `PUT /api/sections/{id}` - Update folder
- `DELETE /api/sections/{id}` - Delete folder

### Snippets
- `GET /api/snippets` - List snippets (with optional language/search filters)
- `GET /api/snippets/{id}` - Get single snippet
- `GET /api/snippets/languages` - Get supported languages
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/{id}` - Update snippet
- `DELETE /api/snippets/{id}` - Delete snippet

### Bookmarks
- `GET /api/bookmarks` - List bookmarks (with optional search)
- `GET /api/bookmarks/categories` - List bookmark categories
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks/{id}` - Update bookmark
- `DELETE /api/bookmarks/{id}` - Delete bookmark
- `POST /api/bookmarks/{id}/open` - Open bookmark (for local files)
- **Categories:**
  - `POST /api/bookmarks/categories` - Create category
  - `PUT /api/bookmarks/categories/{id}` - Update category
  - `DELETE /api/bookmarks/categories/{id}` - Delete category

### Search
- `GET /api/search?q={query}` - Global search across all entities
- `GET /api/search/linkable` - Get linkable items for @ autocomplete

## Design System

### Colors
```css
--background: #0F1117;       /* Main background */
--background-card: #151922;  /* Card background */
--background-elevated: #1A1F2E; /* Elevated surfaces */
--background-hover: #1C2230; /* Hover state */
--border: #252B3B;           /* Border color */
--text-primary: #E6E8EB;     /* Primary text */
--text-secondary: #9CA3AF;   /* Secondary text */
--text-muted: #6B7280;       /* Muted text */
--accent-blue: #3B82F6;      /* Primary accent */
--accent-amber: #F59E0B;     /* In Progress status */
--accent-green: #22C55E;     /* Done status */
--accent-red: #EF4444;       /* Destructive */
--accent-purple: #8B5CF6;    /* High priority */
```

### Typography
- Font: Inter (400, 500, 600, 700)
- Code: JetBrains Mono
- Base size: 16px
- Secondary: 14px
- Small: 12px

### Spacing
- Page padding: 32px (p-8)
- Card padding: 24px (p-6)
- Section gap: 24px (gap-6)
- Item gap: 12px (gap-3)

### Animations
- Fade in: `animate-fade-in`
- Scale in: `animate-scale-in`
- Slide in: `animate-slide-in`

## Database Schema

The app uses SQLite with the following main tables:
- `daily_logs` - Daily journal entries
- `tasks` - Task items with status and priority
- `subtasks` - Nested subtasks under tasks
- `notes` - Rich text notes with soft delete
- `sections` - Hierarchical note folders
- `snippets` - Code snippets with language metadata
- `bookmarks` - Web and file bookmarks
- `bookmark_categories` - Bookmark organization

## Recent Updates

### Latest Features (January 2026)
- ✅ Dashboard with real-time stats and recent activity
- ✅ Hierarchical note folders with drag-and-drop
- ✅ Recycle Bin with bulk operations
- ✅ Full-screen task popout view
- ✅ Task table view with multiple display modes
- ✅ System stats API for entity counts
- ✅ Query invalidation for real-time UI updates
- ✅ Bookmark categories with custom colors
- ✅ Local file bookmark support

## Contributing

This is a personal productivity tool, but suggestions and bug reports are welcome via GitHub Issues.

## License

MIT

---

**Built with ❤️ for data engineers who love local-first apps**
