# 🚀 Omni Vault v1.1.0 - Security & Performance Update

This release focuses on "under-the-hood" improvements to security and performance, along with significant UI polish to make the application feel snappier and more reliable.

## ✨ Highlights

### 🔐 **Security Hardening (Vault)**
- **PBKDF2 PIN Hashing**: Your 4-digit PIN is now secured with a PBKDF2 derivative (100,000 iterations) using a unique salt, making it significantly more resistant to brute-force attacks.
- **Fernet Encryption**: All stored secrets (passwords, connection strings) are now encrypted at the database level using industry-standard Fernet (AES-128-CBC) symmetric encryption.

### ⚡ **Performance Engine**
- **Consolidated Dashboard**: A new backend API provides all dashboard metrics in a single, fast request, reducing initial load times.
- **Database Indexing**: Critical tables (Tasks, Subtasks, Notes) are now indexed for lightning-fast search and sorting, even with thousands of entries.
- **Optimistic Task Updates**: Toggle subtasks and mark tasks as complete instantly—the UI updates immediately while the server syncs in the background.

### 🎨 **UX & Experience Improvements**
- **Transactional Subtask Editing**: "Edit Mode" for tasks now buffers all subtask additions, deletions, and reorders. Changes are only committed when you hit **Save**, or reverted atomically if you hit **Cancel**.
- **App-wide Toast Notifications**: Consistent visual feedback for every action—from copying a password to deleting a note.
- **Fuzzy Switcher**: Press `Cmd+P` (or `Ctrl+P`) in the Notes view to instantly jump between folders and notebooks.
- **Dynamic Breadcrumbs**: Easily navigate deep folder hierarchies with clickable multi-level breadcrumbs.
- **Kanban "Inline Add"**: Quickly add tasks to any board column without leaving the view.

## 🛠️ Technical Health
- **Fixed Subtask Persistence**: Resolved race conditions that caused subtask changes to occasionally be lost during saves.
- **Storage Metrics Fix**: Corrected the API path for storage size display in the sidebar.
- **Unified Soft-Delete**: Standardized the Recycle Bin logic across all modules for improved data safety.

---
**Omni Vault v1.1.0 is a recommended update for all users.**
Your data will be automatically migrated to the new encryption format on first launch.
