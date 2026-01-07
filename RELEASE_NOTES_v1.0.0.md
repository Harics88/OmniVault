# 🎉 Omni Vault v1.0.0 - First Desktop Release!

We're excited to announce the first official desktop release of **Omni Vault** (MyTasker)! 

## 🎯 What is Omni Vault?

Omni Vault is a **dark-mode, local-first productivity app** designed for data engineers and power users who want complete control over their data. No cloud, no tracking, no subscriptions - just pure productivity on your machine.

---

## ✨ What's Included

### 📦 **Standalone Desktop Application**
- **Windows MSI Installer** - Professional Windows installation
- **Windows NSIS Installer** - Lightweight portable installer
- **100% Native** - Built with Tauri v2 for maximum performance
- **No Dependencies** - Runs without Docker, Python, or Node.js
- **Local Storage** - All your data stays on your machine

### 🚀 **Core Features**

#### 📊 **Dashboard**
- Real-time stats for tasks, notes, snippets, and bookmarks
- Recent activity feed across all sections
- Quick navigation to any entity

#### 📝 **Daily Log**
- Rich text editor with formatting toolbar
- Auto-save functionality
- Inline linking with `@` mentions
- Code snippet formatting with syntax highlighting
- Date navigation

#### ✅ **Tasks**
- Multiple view modes: List, Board (Kanban), Table
- Priority levels: Low, Medium, High
- Status tracking: Not Started / In Progress / Done
- Subtasks with drag-and-drop
- Full-screen task detail view
- Date tracking (Due, Started, Completed)

#### 📄 **Notes**
- Hierarchical folder structure
- Rich text editor with full formatting
- Soft delete with Recycle Bin
- Bulk operations
- Full-text search
- Breadcrumb navigation

#### 💻 **Code Snippets**
- Syntax highlighting for 20+ languages
- One-click copy
- Language filtering
- Metadata support

#### 🔖 **Bookmarks**
- Categorized organization with custom colors
- Support for web URLs and local files
- Quick search
- Category management

#### 🔍 **Global Search** (`Ctrl+K`)
- Search across all entities
- Keyboard navigation
- Quick preview

---

## 📥 Installation

### **Windows**

1. **Download** either:
   - `Omni-Vault_1.0.0_x64_en-US.msi` (Recommended)
   - `Omni-Vault_1.0.0_x64-setup.exe` (Portable)

2. **Run the installer** and follow the setup wizard

3. **Launch Omni Vault** from your Start Menu

4. **Start organizing!** Your data is stored locally in:
   - `%APPDATA%\com.omnivault.app\` (Windows)

---

## 🛠️ Technical Details

### **Built With:**
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Desktop:** Tauri v2 + Rust
- **Editor:** TipTap (Rich Text)
- **Icons:** Lucide Icons

### **System Requirements:**
- **Windows:** Windows 10 or later (64-bit)
- **macOS:** Coming soon
- **Linux:** Coming soon
- **RAM:** 256 MB minimum
- **Disk Space:** ~100 MB

### **Performance:**
- ⚡ **Fast Startup** - Launches in under 2 seconds
- 💾 **Small Footprint** - ~56 MB installed size
- 🔒 **Private** - No network calls, all data local
- 🪶 **Lightweight** - Uses Tauri for native performance

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + D` | Go to today's daily log |
| `Ctrl + K` | Open global search |
| `Ctrl + Shift + C` | Create new snippet |
| `Ctrl + Shift + H` | Go to Home |
| `Ctrl + Shift + T` | Go to Tasks |
| `Ctrl + Shift + N` | Go to Notes |
| `Ctrl + Shift + S` | Go to Snippets |
| `Ctrl + Shift + B` | Go to Bookmarks |
| `Escape` | Close modals/panels |

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://github.com/Harics88/MyTasker/raw/main/screenshots/dashboard.png)

### Tasks
![Tasks](https://github.com/Harics88/MyTasker/raw/main/screenshots/tasks.png)

### Notes
![Notes](https://github.com/Harics88/MyTasker/raw/main/screenshots/notes.png)

### Daily Log
![Daily Log](https://github.com/Harics88/MyTasker/raw/main/screenshots/daily-log.png)

---

## 🐛 Known Issues

- None reported yet! Please [open an issue](https://github.com/Harics88/MyTasker/issues) if you find any bugs.

---

## 📝 Changelog

### v1.0.0 (2026-01-07)

**Initial Release:**
- ✅ Desktop application built with Tauri v2
- ✅ Dashboard with real-time statistics
- ✅ Task management with multiple views
- ✅ Hierarchical note organization
- ✅ Daily log with rich text editing
- ✅ Code snippet library
- ✅ Bookmark manager with categories
- ✅ Global search functionality
- ✅ Recycle bin for deleted notes
- ✅ Keyboard shortcuts
- ✅ Dark mode UI with modern design
- ✅ Local-first architecture (no cloud)
- ✅ Automated builds via GitHub Actions

---

## 🔄 Updating

Future updates will be released through GitHub Releases. To update:

1. Download the new installer
2. Run it (it will upgrade your existing installation)
3. Your data will be preserved

---

## 🤝 Contributing

Found a bug or have a feature request? 

- **Report Issues:** [GitHub Issues](https://github.com/Harics88/MyTasker/issues)
- **Source Code:** [GitHub Repository](https://github.com/Harics88/MyTasker)

---

## 📜 License

MIT License - See [LICENSE](https://github.com/Harics88/MyTasker/blob/main/LICENSE) for details

---

## 🙏 Acknowledgments

- Built with ❤️ using open-source tools
- Special thanks to the Tauri, React, and FastAPI communities
- Inspired by Notion, Obsidian, and other modern productivity tools

---

<div align="center">

**Enjoy Omni Vault! 🚀**

[Documentation](https://github.com/Harics88/MyTasker#readme) • [Report Bug](https://github.com/Harics88/MyTasker/issues) • [Request Feature](https://github.com/Harics88/MyTasker/issues)

Made with ❤️ for data engineers who value privacy and productivity

</div>
