# MyTasker

A **dark-mode, local-first, single-user productivity app** for data engineers. Built with React, TypeScript, FastAPI, and SQLite.

## Features

### 📝 Daily Log
- Free-text notebook-style editor
- Auto-save enabled
- Inline linking via `@` symbol (tasks, notes, snippets, bookmarks)
- Code snippet formatting with ```
- Date navigation (previous/next days)

### ✅ Tasks
- Minimal task management
- Status: Not Started / In Progress / Done
- Drag-and-drop reordering
- Side panel for task details

### 📄 Notes
- Full-text notes with search
- Quick access from sidebar
- Inline editing

### 💻 Code Snippets
- Syntax highlighting for 20+ languages
- One-click copy
- Language filtering

### 🔖 Bookmarks
- Save URLs with descriptions
- Quick search
- External link support

### 🔍 Global Search
- Cmd/Ctrl+K to open
- Search across all entities
- Keyboard navigation

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- React Router
- Lucide Icons
- Prism React Renderer (syntax highlighting)

**Backend:**
- FastAPI
- SQLAlchemy (async)
- SQLite (local-first)
- Pydantic

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Quick Start

```bash
# Clone the repository
cd MyTasker

# Start with Docker
docker-compose up --build

# Access the app
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Development

**Frontend only:**
```bash
cd frontend
npm install
npm run dev
```

**Backend only:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Project Structure

```
MyTasker/
├── docker-compose.yml
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
│       │   └── CodeBlock.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── DailyLog.tsx
│       │   ├── Tasks.tsx
│       │   ├── Notes.tsx
│       │   ├── Snippets.tsx
│       │   └── Bookmarks.tsx
│       ├── hooks/
│       │   └── useKeyboardShortcuts.ts
│       ├── lib/
│       │   └── api.ts
│       └── types/
│           └── index.ts
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── database.py
        ├── models.py
        ├── schemas.py
        └── routers/
            ├── daily_logs.py
            ├── tasks.py
            ├── notes.py
            ├── snippets.py
            ├── bookmarks.py
            └── search.py
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

### Daily Logs
- `GET /api/daily-logs` - List all logs
- `GET /api/daily-logs/today` - Get today's log
- `GET /api/daily-logs/date/{date}` - Get log by date
- `PUT /api/daily-logs/date/{date}` - Update log by date

### Tasks
- `GET /api/tasks` - List tasks (optional status filter)
- `GET /api/tasks/stats` - Get task statistics
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/reorder` - Reorder tasks
- `DELETE /api/tasks/{id}` - Delete task

### Notes
- `GET /api/notes` - List notes
- `GET /api/notes/recent` - Get recent notes
- `POST /api/notes` - Create note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note

### Snippets
- `GET /api/snippets` - List snippets
- `GET /api/snippets/languages` - Get supported languages
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/{id}` - Update snippet
- `DELETE /api/snippets/{id}` - Delete snippet

### Bookmarks
- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks/{id}` - Update bookmark
- `DELETE /api/bookmarks/{id}` - Delete bookmark

### Search
- `GET /api/search?q={query}` - Global search
- `GET /api/search/linkable` - Get linkable items for @ autocomplete

## Design System

### Colors
```css
--background: #0F1117;       /* Main background */
--background-card: #151922;  /* Card background */
--background-hover: #1C2230; /* Hover state */
--text-primary: #E6E8EB;     /* Primary text */
--text-secondary: #9CA3AF;   /* Secondary text */
--text-muted: #6B7280;       /* Muted text */
--accent-blue: #3B82F6;      /* Primary accent */
--accent-amber: #F59E0B;     /* In Progress status */
--accent-green: #22C55E;     /* Done status */
--accent-red: #EF4444;       /* Destructive */
```

### Typography
- Font: Inter (400, 500, 600, 700)
- Code: JetBrains Mono
- Base size: 16px
- Secondary: 14px

### Spacing
- Page padding: 32px (p-8)
- Card padding: 24px (p-6)
- Section gap: 24px (gap-6)
- Item gap: 12px (gap-3)

## License

MIT
