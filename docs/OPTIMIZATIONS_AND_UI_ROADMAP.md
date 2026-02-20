# App Optimization and UI/UX Roadmap

This document outlines recommended performance optimizations, UI enhancements, and feature additions to improve the MyTasker application.

---

## ✅ COMPLETED IN V1.1.0
1. **Optimistic Updates**: Implemented for Task Status and Subtask toggling.
2. **Transactional Subtask Editing**: Buffer all subtask mutations while editing and discard on Cancel.
3. **Dynamic Breadcrumbs**: Clickable navigation in the Notes editor.
4. **Fuzzy Switcher**: `Cmd+P` quick-open utility for notes.
5. **Kanban Improvements**: Inline "Add Task" buttons in Board view.
6. **Bulk Selection**: Selection state and Bulk Action Toolbar in All Tasks.
7. **Theming System**: Implemented Light/Dark theme toggle.
8. **Toast Notifications**: Essential feedback consistency across the whole app.
9. **Performance Engine**: Database indexing and consolidated dashboard metrics API.
10. **Security Hardening**: PBKDF2 PIN hashing and secret encryption for the Vault.

---

## 🚀 FUTURE ROADMAP

### 1. **Virtual Scrolling**
For views that handle large datasets (Tasks Table, long Daily Log histories):
- Implement `react-virtual` to render only visible rows.
- **Impact**: Stabilizes frame rates and reduces memory usage on low-end devices.

### 2. **Universal Search Upgrade**
A specialized search index that queries Notes, Tasks, Snippets, and Bookmarks simultaneously, categorizing results in a single flyout menu.

### 3. **Error Boundaries & Offline Resilience**
- Wrap specific sections (e.g., the Sidebar, the Editor) so a single component failure doesn't crash the app.
- Cache critical data using LocalStorage or IndexDB for offline viewing.

### 4. **Export & Transparency**
- **Data Portability**: JSON/CSV export for all user data.
- **Undo Stack**: Global "Undo" snackbar for deleted items (30-second window).

---

## 🔧 Maintenance & Health
- Regular security audits of encryption patterns.
- Monitoring for performance regressions as database size increases.

