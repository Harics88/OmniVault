# MyTasker - Design System & Implementation Guide

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0F1117` | Main page background |
| `--background-card` | `#151922` | Cards, sidebar |
| `--background-hover` | `#1C2230` | Hover states |
| `--background-elevated` | `#1A1F2B` | Modals, elevated cards |
| `--text-primary` | `#E6E8EB` | Primary text |
| `--text-secondary` | `#9CA3AF` | Secondary text |
| `--text-muted` | `#6B7280` | Muted/placeholder text |
| `--accent-blue` | `#3B82F6` | Primary actions, links |
| `--accent-blue-hover` | `#2563EB` | Button hover |
| `--accent-amber` | `#F59E0B` | In Progress status |
| `--accent-green` | `#22C55E` | Done status |
| `--accent-red` | `#EF4444` | Destructive actions |
| `--border` | `#2D3748` | Default borders |
| `--border-subtle` | `#1F2937` | Subtle borders |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 30px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 |
| Secondary | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |
| Code | JetBrains Mono | 14px | 400 |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | 32px (p-8) | Main content area |
| Card padding | 24px (p-6) | Interior card spacing |
| Section gap | 24px (gap-6) | Between major sections |
| Item gap | 12px (gap-3) | Between list items |
| Sidebar width | 240px (w-60) | Fixed sidebar |

### Shadows

```css
/* Card shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 
            0 2px 4px -1px rgba(0, 0, 0, 0.2);

/* Elevated shadow (modals) */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 
            0 10px 10px -5px rgba(0, 0, 0, 0.3);

/* Blue glow (focus) */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
```

---

## 📐 Component Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main layout with sidebar
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── SearchModal.tsx     # Cmd+K search
│   ├── TaskCard.tsx        # Task list item
│   ├── TaskPanel.tsx       # Task detail side panel
│   └── CodeBlock.tsx       # Syntax highlighted code
├── pages/
│   ├── Home.tsx            # Dashboard overview
│   ├── DailyLog.tsx        # Daily log editor
│   ├── Tasks.tsx           # Task management
│   ├── Notes.tsx           # Notes with editor
│   ├── Snippets.tsx        # Code snippets
│   └── Bookmarks.tsx       # URL bookmarks
├── hooks/
│   └── useKeyboardShortcuts.ts
├── lib/
│   └── api.ts              # API client
└── types/
    └── index.ts            # TypeScript types
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + D` | Go to today's daily log | Global |
| `Cmd/Ctrl + K` | Open global search | Global |
| `Cmd/Ctrl + Shift + C` | Create new snippet | Global |
| `Cmd/Ctrl + Shift + H` | Go to Home | Global |
| `Cmd/Ctrl + Shift + T` | Go to Tasks | Global |
| `Cmd/Ctrl + Shift + N` | Go to Notes | Global |
| `Cmd/Ctrl + Shift + S` | Go to Snippets | Global |
| `Cmd/Ctrl + Shift + B` | Go to Bookmarks | Global |
| `Escape` | Close modals/panels | Modal/Panel open |
| `@` | Link items | Daily Log editor |
| ` ``` ` | Insert code block | Daily Log editor |
| `↑ / ↓` | Navigate search results | Search modal |
| `Enter` | Select result / submit | Search / Forms |

---

## 🗄️ Database Schema

### Tables

```sql
-- Daily logs (one per day)
CREATE TABLE daily_logs (
    id INTEGER PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'not_started',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snippets
CREATE TABLE snippets (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'text',
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(2000) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Linking Tables

```sql
-- Log to Task links
CREATE TABLE log_task_links (
    log_id INTEGER REFERENCES daily_logs(id),
    task_id INTEGER REFERENCES tasks(id),
    PRIMARY KEY (log_id, task_id)
);

-- Log to Note links
CREATE TABLE log_note_links (
    log_id INTEGER REFERENCES daily_logs(id),
    note_id INTEGER REFERENCES notes(id),
    PRIMARY KEY (log_id, note_id)
);

-- Log to Snippet links
CREATE TABLE log_snippet_links (
    log_id INTEGER REFERENCES daily_logs(id),
    snippet_id INTEGER REFERENCES snippets(id),
    PRIMARY KEY (log_id, snippet_id)
);

-- Log to Bookmark links
CREATE TABLE log_bookmark_links (
    log_id INTEGER REFERENCES daily_logs(id),
    bookmark_id INTEGER REFERENCES bookmarks(id),
    PRIMARY KEY (log_id, bookmark_id)
);

-- Task to Note links
CREATE TABLE task_note_links (
    task_id INTEGER REFERENCES tasks(id),
    note_id INTEGER REFERENCES notes(id),
    PRIMARY KEY (task_id, note_id)
);
```

---

## 🔌 API Endpoints

### Daily Logs
- `GET /api/daily-logs` - List all logs
- `GET /api/daily-logs/today` - Get/create today's log
- `GET /api/daily-logs/date/{date}` - Get log by date
- `PUT /api/daily-logs/date/{date}` - Update log (auto-save)

### Tasks
- `GET /api/tasks` - List tasks (optional `?status=` filter)
- `GET /api/tasks/stats` - Task statistics
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/reorder` - Reorder tasks
- `DELETE /api/tasks/{id}` - Delete task

### Notes
- `GET /api/notes` - List notes
- `GET /api/notes/recent` - Recent notes
- `POST /api/notes` - Create note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note

### Snippets
- `GET /api/snippets` - List snippets
- `GET /api/snippets/languages` - Supported languages
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

---

## 🚀 Future Roadmap

### Phase 2: Enhanced Features
- [ ] Markdown preview in daily logs
- [ ] Rich text editor with formatting toolbar
- [ ] Tags/categories for all entities
- [ ] Favorites/pinned items
- [ ] Archive completed tasks

### Phase 3: Advanced
- [ ] Full-text search with fuzzy matching
- [ ] Calendar view for daily logs
- [ ] Weekly/monthly log summaries
- [ ] Export to Markdown/PDF
- [ ] Custom keyboard shortcut mapping

### Phase 4: Sync & Backup
- [ ] Local backup/restore
- [ ] Optional cloud sync
- [ ] Data export/import
- [ ] Multiple device support

---

## 🏃 Quick Start

```bash
# Start the application
docker-compose up --build -d

# Access the app
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs

# Stop the application
docker-compose down

# View logs
docker-compose logs -f
```
