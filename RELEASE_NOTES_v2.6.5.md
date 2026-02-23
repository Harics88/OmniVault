# 🚀 Omni Vault v2.6.5 - Hotfix for Startup Assembly Load Error

This hotfix addresses a critical startup failure where the application could not find the `System.Windows.Forms` assembly in the portable environment.

## ✨ Highlights

### 🛠️ **Startup Fix ( .NET Runtime)**
- **Forced .NET Framework (netfx)**: Reconfigured `pythonnet` initialization to force the use of the .NET Framework (netfx) runtime instead of failing to find assemblies in the default .NET Core (coreclr) context. This ensures the required `System.Windows.Forms` assembly is correctly loaded from the system GAC on Windows 10/11.
- **Improved DLL Resolution**: Enhanced the DLL search logic to be more resilient during the frozen application startup process.

### ✅ **Subtask Persistence (Included from v2.6.4)**
- **Transactional Save/Cancel**: Subtask changes are only committed when you click "Save".
- **Read-Only Mode**: Controls are disabled in read-only mode for safety.

---
**Omni Vault v2.6.5 is a MANDATORY update for users who experienced the "Startup Error" dialog in the previous release.**
