# 🚀 Omni Vault v2.6.4 - Final Polish & Subtask Reliability

This patch release provides critical fixes for subtask persistence and cleans up experimental core logic to ensure maximum stability and data integrity.

## ✨ Highlights

### ✅ **Transactional Subtask Persistence**
- **Robust Save/Cancel Cycle**: Subtask toggles, title edits, additions, and deletions are now purely transactional. 
  - Changes are cached locally in "Edit Mode".
  - **Save** commits all changes atomically to the database.
  - **Cancel** or refreshing reverts all changes instantly.
- **Read-Only Protection**: Subtask controls are now automatically disabled in read-only mode to prevent accidental data modification.
- **Backend Reconciliation**: The Task API now handles a full subtask sync on every save, ensuring the backend state perfectly matches your intent.

### 🧹 **Codebase Cleanup**
- **Task Dependencies Reverted**: Removed all residual code, database schemas, and UI elements related to the "Task Dependencies" feature. This ensures the application remains lean and focused on core productivity.
- **Fixed TaskCard Syntax**: Resolved a critical rendering bug in the Tasks board view that could lead to application crashes.

## 🛠️ Maintenance
- Standardized subtask reconciliation logic across `TaskPopout` and `TaskPanel`.
- Optimized the shared `useTaskEditor` hook for better state management during complex task edits.

---
**Omni Vault v2.6.4 is recommended for all users prioritizing task management reliability.**
