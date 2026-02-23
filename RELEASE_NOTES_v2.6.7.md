# 🚀 Omni Vault v2.6.7 - Deep Startup Hardening

This release implements a "Double-Lock" initialization strategy for the .NET environment to permanently resolve assembly load failures in the portable environment.

## ✨ Highlights

### 🛠️ **Deep Startup Hardening ( .NET Runtime)**
- **Explicit API Bootstrapping**: Switched to the explicit `pythonnet.load("netfx")` API. This manually initializes the .NET Framework (netfx) runtime at the very first line of execution, preventing standard "Lazy-Loading" which was occasionally picking the wrong runtime on machines with both .NET Core and .NET Framework installed.
- **Bundle Sanitization**: Stripped all `.json` configuration files (like `deps.json`) from the internal `pythonnet` and `clr_loader` directories. This removes any "breadcrumbs" that could lead the application to attempt a .NET Core load in a restricted environment.
- **Optimized Initialization**: Unified environment variable overrides and API calls to ensure a single, consistent path for the UI engine.

---
**Omni Vault v2.6.7 is the recommended update for anyone experiencing "Failed to resolve Python.Runtime.Loader.Initialize" errors.**
