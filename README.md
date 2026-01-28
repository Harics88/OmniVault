<div align="center">

# 🎯 Omni Vault (formerly MyTasker)

### A dark-mode, local-first productivity app for data engineers
**Built with React, TypeScript, FastAPI, and SQLite**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)](https://github.com/Harics88/MyTasker/releases)

[Download](#-portable-build) • [Features](#-features) • [Screenshots](#-screenshots) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started)

</div>

---

## 📦 Portable Build

Omni Vault is now available in **two flavors** - choose the one that fits your workflow!

### 💻 **Desktop App** (Recommended)
**Best for**: Single-user desktop use, instant startup

**📥 [Download Latest Desktop Release](https://github.com/Harics88/MyTasker/releases/latest)**

1. Download `OmniVault_Desktop_vX.X.X_Portable.zip`
2. Extract anywhere (Desktop, USB Drive, etc.)
3. Double-click `OmniVault.exe` → Opens in native window
4. Data stored in `data/` folder

### 🌐 **Server App**
**Best for**: Browser access, remote/multi-device use

**📥 [Download Latest Server Release](https://github.com/Harics88/MyTasker/releases/latest)**

1. Download `OmniVault_Server_vX.X.X_Portable.zip`
2. Extract anywhere
3. Double-click `OmniVault-Server.exe` → Starts web server
4. Open browser to `http://localhost:8000`
5. Data stored in `data/` folder

**📖 [Full Deployment Guide](DEPLOYMENT.md)** - Detailed comparison and troubleshooting

---

## ✨ Features

### 🏠 **Dashboard**
- Quick stats overview (Active Tasks, Notes, Snippets, Bookmarks)
- Recent activity feed across all sections
- Direct navigation to any entity
- Real-time updates

### 📝 **Daily Log**
- Notebook-style editor with rich text support
- Auto-save enabled
- Inline linking via `@` mention (tasks, notes, snippets, bookmarks)
- Code snippet formatting with syntax highlighting
- Date navigation (previous/next days)

### ✅ **Tasks**
- **Multiple view modes:** List, Board (Kanban), and Table
- **Status tracking:** Not Started / In Progress / Done
- **Priority levels:** Low, Medium, High
- **Subtasks** with drag-and-drop reordering
- Full-screen task detail popout
- Date tracking: Due Date, Started At, Completed At

### 📄 **Notes**
- Hierarchical folder structure with drag-and-drop
- Rich text editor with full formatting support
- **Contextual Bubble Menu** for quick formatting on selection
- **Soft delete** with Recycle Bin
- Bulk operations (restore, delete, empty bin)
- Full-text search
- Breadcrumb navigation

### 🍅 **Focus Mode**
- Integrated Pomodoro Timer
- Auto-switching between work and break modes
- Browser notifications and sound alerts
- Session history and focus statistics

### 💻 **Code Snippets**
- Syntax highlighting for 20+ languages
- One-click copy functionality
- Language filtering
- Description and metadata support
- Search across all snippets

### 🔖 **Bookmarks**
- Categorized organization with custom colors
- Support for both web URLs and local file paths
- Quick search across all bookmarks
- Category-based grouping
- External link support with automatic URL validation

### 🔐 **Secure Vault**
- Encrypted storage for sensitive credentials
- Dedicated templates for **Websites, Databases, and SFTP**
- **4-digit PIN protection** with configurable auto-lock
- PIN Hint/Tip system for secure recovery
- Local-only storage ensuring data privacy

---

## 📸 Screenshots

### Dashboard - Your Command Center
![Dashboard](screenshots/dashboard.png)

### Tasks - Organized and Prioritized
![Tasks](screenshots/tasks.png)

### Notes - Hierarchical Knowledge Base
![Notes](screenshots/notes.png)

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Query**

### **Backend**
- **FastAPI**
- **SQLAlchemy 2.0**
- **SQLite**
- **Uvicorn**

### **Desktop Wrapper**
- **PyWebView** - Native window container

---

## 🚀 Development & Building

### **Docker Quick Start**
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3001`
- API Docs: `http://localhost:8000/docs`

### **Building the Portable App**
If you want to build the standalone executable yourself:

1. **Prerequisites:**
   - Python 3.12+
   - Node.js (or Docker)

2. **Run Build Script:**
   ```powershell
   cd backend
   .\build_portable.ps1
   ```
   This script will build the frontend, install dependencies, and create the portable EXE.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Alternate |
|----------|--------|-----------|
| `Cmd/Ctrl + D` | Go to today's daily log | `g` `d` |
| `Cmd/Ctrl + K` | Open Command Palette | |
| `/` | Quick Search | |
| `?` | Show Shortcuts | |
| `g` `h` | Go Home | |
| `g` `t` | Go to Tasks | |
| `g` `n` | Go to Notes | |
| `g` `s` | Go to Snippets | |
| `g` `b` | Go to Bookmarks | |
| `g` `,` | Go to Settings | |
| `Escape` | Close modals/panels | |

---

## 📜 License
MIT License.

---

<div align="center">

**Star ⭐ this repo if you find it useful!**

Made with ❤️ by [Harics88](https://github.com/Harics88)

</div>
