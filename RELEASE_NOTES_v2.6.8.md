# 🏭 Omni Vault v2.6.8 - Industrial Build Hardening

This release transitions Omni Vault to an industry-standard PyInstaller build process, permanently resolving the .NET assembly loading issues encountered in previous portable builds.

## ✨ Highlights

### 🛡️ **Industrial-Grade Startup Fix**
- **Surgical Spec Configuration**: Completely refactored the PyInstaller `.spec` file to stop using broad "auto-collection" hooks. We now surgically include only the essential `Python.Runtime.dll` and placement-critical binaries.
- **Bundle Sanitization**: Forcefully stripped all `.deps.json` and `.runtimeconfig.json` files from the bundle. These "metadata" files were the root cause of the previous errors, as they would trick the .NET loader into picking the wrong runtime on some machines.
- **Industrial Runtime Hook**: Implemented a professional PyInstaller `runtime_hook.py`. This hook executes at the absolute first tick of the CPU before any user code, locking the environment into the native **.NET Framework (netfx)** and ensuring path resolution is stable.

### ✅ **Subtask Persistence (Finalized)**
- **Transactional Save/Cancel**: Subtask changes are only committed when you click "Save".
- **Read-Only Mode**: Controls are disabled in read-only mode for safety.

---
**Omni Vault v2.6.8 is the DEFINITIVE fix for the "Failed to resolve Python.Runtime.Loader.Initialize" error.**
