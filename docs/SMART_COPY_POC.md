# Smart Copy & Deep Linking - Proof of Concept

This document outlines the implementation plan and code snippets required to implement the "Smart Copy" feature.

## 1. Frontend Implementation (React/TypeScript)

This function writes multiple MIME types to the clipboard.

```typescript
// src/lib/clipboard.ts

export async function smartCopyLink(noteId: number, title: string): Promise<void> {
    const appProtocol = 'omnivault://';
    const deepLink = `${appProtocol}note/${noteId}`;
    const htmlLink = `<a href="${deepLink}">${title}</a>`;

    if (!navigator.clipboard) {
        console.error('Clipboard API not available');
        return;
    }

    try {
        const textBlob = new Blob([deepLink], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlLink], { type: 'text/html' });

        await navigator.clipboard.write([
            new ClipboardItem({
                'text/plain': textBlob,
                'text/html': htmlBlob,
            })
        ]);
        console.log('Smart copy successful');
    } catch (err) {
        console.error('Failed to smart copy:', err);
        // Fallback to text only
        await navigator.clipboard.writeText(deepLink);
    }
}
```

## 2. Desktop Wrapper Implementation (Python/PyWebView)

### A. Registry Setup (Windows)
We need a helper script (or logic in `app_webview.py`) to register the protocol on startup.

```python
# backend/register_protocol.py
import winreg
import sys
import os

def register_url_protocol(scheme="omnivault"):
    exe_path = sys.executable
    # In dev, point to python script wrapper if needed, but for build it's the exe

    key_path = f"Software\\Classes\\{scheme}"

    try:
        # Create root key
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path)
        winreg.SetValue(key, "", winreg.REG_SZ, f"URL:{scheme} Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")

        # Create command key
        # "C:\Path\To\App.exe" "%1"
        cmd_key = winreg.CreateKey(key, r"shell\open\command")
        winreg.SetValue(cmd_key, "", winreg.REG_SZ, f'"{exe_path}" "%1"')

        print(f"Registered {scheme}:// protocol successfully.")
    except Exception as e:
        print(f"Failed to register protocol: {e}")

if __name__ == "__main__":
    register_url_protocol()
```

### B. Argument Handling in `app_webview.py`

Modify `main()` to check for arguments.

```python
# backend/app_webview.py

def main():
    # ... existing startup ...

    start_url = FRONTEND_URL

    # Check for protocol args
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg.startswith("omnivault://"):
            # omnivault://note/123 -> http://localhost:8766/notes/123
            # We need to map the protocol URI to the frontend route
            path = arg.replace("omnivault://", "")
            start_url = f"{FRONTEND_URL}/{path}"
            print(f"Deep link detected: {start_url}")

    # ... create_window(url=start_url) ...
```

## 3. Single Instance Handling (Advanced)

If the app is already running, clicking a link shouldn't open a second instance. We need a socket lock.

**Rough Logic:**
1.  On startup, try to bind to a specific local port (e.g., 8767).
2.  **Success**: We are the main instance. Start a listener thread on that port.
3.  **Failure**: Another instance is running. Connect to localhost:8767, send the deep link URL, then exit.
4.  **Listener**: When receiving a URL, use `webview.windows[0].load_url(new_url)` to navigate the existing window.
