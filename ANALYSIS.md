# Omni Vault Analysis & Roadmap

## 1. Feature Ideas (Tailored for Data Engineers & Productivity)

1.  **Personal Todos (Private Vault)**
    *   **Description**: A dedicated space or category for personal tasks, distinct from work/project tasks. This feature would be optional, controlled by a toggle in the Settings.
    *   **Why**: Since this is a "Local-First" vault, users often want to manage their whole life (work + personal) in one place but keep them visually distinct.
    *   **Implementation**: Add an `is_personal` boolean flag to the `Task` model. Add a "Personal Mode" toggle in Settings. When enabled, a "Personal" view appears in the Tasks module, or a toggle filters the main list.

2.  **Data Lineage Visualization**
    *   **Description**: Visual graph showing relationships between Tasks, Notes, Snippets, and even externally defined data assets.
    *   **Why**: Visualizing dependencies is crucial for DEs. This could also visualize how tasks relate to specific notes or code snippets.
    *   **Implementation**: Use `react-force-graph` or `reactflow` to render nodes (entities) and edges (links/references).

3.  **Export/Import Data (Backup System)**
    *   **Description**: A robust system to export all vault data (Tasks, Notes, Settings) to a JSON/ZIP file and import it back.
    *   **Why**: Local-first means "user owns the data". Easy backups are essential for trust.
    *   **Implementation**: Backend endpoints to dump SQLite to JSON and zip `data/` folder. Frontend "Export" button in Settings.

4.  **Habit Tracker**
    *   **Description**: A simple daily checklist for recurring habits (e.g., "Check Airflow Logs", "Zero Inbox", "Drink Water") that resets daily.
    *   **Why**: Builds consistency. Complements the "Daily Log" feature perfectly.
    *   **Implementation**: A new widget on the Dashboard or Daily Log page. Stores history of completion.

5.  **Tag Manager & Unified Tagging System**
    *   **Description**: A centralized system to manage tags across Notes, Tasks, and Snippets. Currently, `Note` has a `tags` string column, but a proper many-to-many relationship or a unified UI to manage them would be better.
    *   **Why**: Better organization and cross-referencing of knowledge and tasks.
    *   **Implementation**: New DB table `Tags`, association tables for entities, and a "Tags" management page.

6.  **Activity Heatmap**
    *   **Description**: A GitHub-style contribution graph showing activity (Tasks completed, Logs written, Snippets created) over the last year.
    *   **Why**: meaningful visualization of productivity and consistency.
    *   **Implementation**: A new widget on the Dashboard or Profile page using `react-calendar-heatmap`.

7.  **Command Palette (Quick Open)**
    *   **Description**: Enhance the global search (`Ctrl+K`) to act as a command palette.
    *   **Why**: Power users prefer keyboard-driven workflows.
    *   **Implementation**: Allow typing `>` to access commands like "Create Task", "Toggle Theme", "Go to Settings", "Run Query".

8.  **Pomodoro Timer / Focus Mode**
    *   **Description**: A simple timer integrated into the sidebar or top bar to track focused work sessions.
    *   **Why**: Productivity technique often used by engineers to maintain focus during coding blocks.
    *   **Implementation**: A timer component in `Sidebar` or `Layout` with notifications.

9.  **Task Dependencies (Blocking/Blocked By)**
    *   **Description**: Explicitly link tasks that block others.
    *   **Why**: DE workflows are often sequential (e.g., "Design Schema" must happen before "Build Pipeline").
    *   **Implementation**: Add `parent_task_id` or a self-referential many-to-many table for dependencies. Visualize in Task view.

10. **Customizable Dashboard Widgets**
    *   **Description**: Allow users to toggle and reorder widgets on the Home Dashboard.
    *   **Why**: Different users care about different metrics (e.g., some want "Active Tasks" top, others want "Recent Notes").
    *   **Implementation**: Store a JSON layout config in Settings. Use a grid layout library or simple conditional rendering.

## 2. Scope for "Personal Todos" Implementation

This feature is feasible and fits well within the existing architecture.

### Database Changes (`backend/app/models.py`)
*   **Modify `Task` model**: Add `is_personal: Mapped[bool] = mapped_column(Boolean, default=False)`.
*   **Migration**: Since Alembic isn't explicitly set up in the file list (though SQLAlchemy is used), we would need to add the column to the SQLite DB on startup or create a migration script.

### Backend Logic (`backend/app/routers/tasks.py`)
*   **Filter**: Update `get_tasks` endpoint to accept a `type` or `is_personal` query parameter.
*   **Create/Update**: Update schemas (`TaskCreate`, `TaskUpdate`) to accept `is_personal`.

### Frontend Changes
*   **Settings Page**: Add a toggle switch: "Enable Personal Tasks". Store this in local storage or user settings.
*   **Tasks Page**:
    *   If enabled, show a segment control or tabs: `[Work] [Personal] [All]`.
    *   Update `TaskCard` or `TaskRow` to visually distinguish personal tasks (e.g., different color badge or icon).
    *   Update `TaskPopout` (Create/Edit modal) to include a "Personal Task" checkbox.

## 3. Scope for UI Improvements

### 1. Sidebar & Navigation
*   **Collapsible Sidebar**: The current sidebar is fixed width (`w-60`). Adding a collapse button to shrink it to icons-only would reclaim screen real estate for the editor or wide tables.
*   **Active State Styling**: Enhance the visual distinction of the active tab.

### 2. Theming System
*   **Dark/Light Mode Toggle**: The app seems to be hardcoded to a dark theme (`index.css` sets dark scrollbars and colors). Implementing a `ThemeContext` to toggle between light and dark modes would improve accessibility and user preference.
*   **Accent Color Picker**: Allow users to choose their primary accent color (currently blue) in Settings.

### 3. Task Table Responsiveness
*   **Dynamic Column Sizing**: The `TaskTableView` uses fixed widths (`min-w-[400px]`, `w-48`). This causes horizontal scrolling even on decent screens. Implementing resizable columns or percentage-based widths would handle different screen sizes better.
*   **Mobile View**: The table view is unusable on mobile. A card-based view or simplified list for smaller breakpoints is needed.

### 4. Rich Text Editor Toolbar
*   **Floating vs Fixed**: The `RichTextEditor` likely uses a fixed or bubble menu. Ensuring the toolbar is always accessible (sticky top) when scrolling long notes is important.
*   **Markdown Support**: Full Markdown shortcut support (typing `#` for H1, etc.) if not already fully present (Tiptap usually handles this, but it can be enhanced).

### 5. Status Bar
*   **Global Status**: Move the "Storage" indicator from the sidebar to a bottom app-wide status bar. This bar could also show "Sync Status", "Last Saved", or "Git Branch" info.

## 4. Suggested Easy Keyboard Shortcut Keys

Current shortcuts use `Cmd+Shift+Letter` which requires two modifier keys. Simpler "Chord" or "Single Key" shortcuts (Gmail/Jira style) are faster.

| Action | Current Shortcut | **Suggested Shortcut** | Why |
| :--- | :--- | :--- | :--- |
| **Go Home** | `Cmd+Shift+H` | `g` then `h` | "Go Home" - Easy mnemonic, one hand. |
| **Go Tasks** | `Cmd+Shift+T` | `g` then `t` | "Go Tasks" |
| **Go Notes** | `Cmd+Shift+N` | `g` then `n` | "Go Notes" |
| **Go Snippets** | `Cmd+Shift+S` | `g` then `s` | "Go Snippets" |
| **Global Search** | `Cmd+K` | `/` | Standard "Search" key in many web apps. |
| **Create New** | N/A | `c` | Context-aware create (Task, Note, etc.). |
| **Toggle Sidebar**| N/A | `[` or `Cmd+B` | VS Code style sidebar toggle. |
| **Command Palette**| N/A | `Cmd+P` | VS Code style "Go to File/Command". |
| **Quick Save** | `Cmd+S` (Browser default) | `Cmd+S` | Ensure this explicitly saves the current editor. |
| **Help** | N/A | `?` | Show keyboard shortcuts modal. |

*Note: Single key shortcuts like `g` or `c` should only be active when focus is NOT in an input field or editor.*
