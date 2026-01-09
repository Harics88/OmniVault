# Omni Vault Analysis & Roadmap

## 1. Feature Ideas (Tailored for Data Engineers)

1.  **SQL Playground / Query Runner**
    *   **Description**: A built-in tool to execute SQL queries against the local SQLite database or external database connections (Postgres, MySQL, Snowflake).
    *   **Why**: Data Engineers live in SQL. Having a quick way to test queries or inspect local data without switching tools would be highly valuable.
    *   **Implementation**: A new page with a code editor (monaco-editor), a results table, and connection management.

2.  **Data Lineage Visualization**
    *   **Description**: Visual graph showing relationships between Tasks, Notes, Snippets, and even externally defined data assets.
    *   **Why**: Visualizing dependencies is crucial for DEs. This could also visualize how tasks relate to specific notes or code snippets.
    *   **Implementation**: Use `react-force-graph` or `reactflow` to render nodes (entities) and edges (links/references).

3.  **Cron Expression Generator & Validator**
    *   **Description**: A utility tool (standalone or within Snippets) to generate, explain, and validate cron schedules.
    *   **Why**: Scheduling ETL jobs is a daily task.
    *   **Implementation**: A UI with dropdowns for frequency that generates the cron string, or takes a string and explains it in plain English (using `cronstrue`).

4.  **JSON/YAML Formatter & Validator**
    *   **Description**: specific tools to format, validate, and convert between JSON and YAML.
    *   **Why**: Configuration files (Airflow DAGs, dbt `dbt_project.yml`, Kubernetes manifests) are ubiquitous.
    *   **Implementation**: A split-pane view in "Snippets" or a new "Tools" section.

5.  **Tag Manager & Unified Tagging System**
    *   **Description**: A centralized system to manage tags across Notes, Tasks, and Snippets. Currently, `Note` has a `tags` string column, but a proper many-to-many relationship or a unified UI to manage them would be better.
    *   **Why**: Better organization and cross-referencing of knowledge and tasks.
    *   **Implementation**: New DB table `Tags`, association tables for entities, and a "Tags" management page.

6.  **Git Integration / Version Control for Notes**
    *   **Description**: Ability to sync Notes and Snippets to a private Git repository.
    *   **Why**: DEs trust Git. Backing up knowledge as Markdown/Code files provides peace of mind and version history.
    *   **Implementation**: Backend integration with `gitpython` to commit and push changes in the `data/` directory or a specific export folder.

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

10. **Regex Tester**
    *   **Description**: A tool to test regular expressions against sample text.
    *   **Why**: Parsing logs and data often requires Regex.
    *   **Implementation**: A simple UI with "Pattern", "Flags", and "Test String" inputs.

## 2. Scope for UI Improvements

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

## 3. Suggested Easy Keyboard Shortcut Keys

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
