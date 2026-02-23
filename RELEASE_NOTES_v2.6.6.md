# 🚀 Omni Vault v2.6.6 - Critical Fix for .NET Initialization

This hotfix addresses a deeper issue with `pythonnet` 3.x initialization in the portable environment that caused a "Failed to resolve Python.Runtime.Loader.Initialize" error.

## ✨ Highlights

### 🛠️ **Deep Startup Fix ( .NET Runtime)**
- **Removed Multi-Runtime Ambiguity**: Removed the `.deps.json` file from the bundled package. This file was incorrectly triggering `pythonnet` to attempt a .NET Core (coreclr) load instead of sticking to the reliable Windows .NET Framework (netfx).
- **Early Initialization**: Re-ordered the startup sequence in `app_webview.py` to ensure .NET environment variables are locked in before the UI engine starts.
- **Improved Diagnostics**: Added detailed environment and traceback logging to `desktop.log` to help troubleshoot any future machine-specifc startup issues.

### ✅ **Subtask Persistence (Included from v2.6.4)**
- **Transactional Save/Cancel**: Subtask changes are only committed when you click "Save".
- **Read-Only Mode**: Controls are disabled in read-only mode for safety.

---
**Omni Vault v2.6.6 IS A REQUIRED update if you experienced the "Failed to resolve Python.Runtime.Loader.Initialize" error.**
