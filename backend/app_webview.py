"""
Omni Vault - Desktop Application
Runs FastAPI backend and displays React frontend in native window using PyWebView
"""
import os
import sys

# ============================================================
# CRITICAL: Fix stdout/stderr FIRST before any imports
# In windowed mode (console=False), sys.stdout is None which breaks uvicorn
# ============================================================
class NullWriter:
    """Null writer that implements all stream methods uvicorn expects"""
    def write(self, s): pass
    def flush(self): pass
    def isatty(self): return False
    def fileno(self): raise OSError("No file descriptor")

if getattr(sys, 'frozen', False):
    # Provide dummy streams if they're None (windowed mode)
    if sys.stdout is None:
        sys.stdout = NullWriter()
    if sys.stderr is None:
        sys.stderr = NullWriter()
    
    # ============================================================
    # DLL Search Path & Runtime Configuration for pythonnet 3.x
    # ============================================================
    import glob
    
    # 1. Search for Python.Runtime.dll in root and _internal
    search_paths = [
        sys._MEIPASS,  # Root of the bundle
        os.path.join(sys._MEIPASS, 'pythonnet', 'runtime'), # Secondary location
        os.path.dirname(sys.executable), # Next to EXE
    ]
    
    python_runtime_dll = None
    for path in search_paths:
        target = os.path.join(path, 'Python.Runtime.dll')
        if os.path.exists(target):
            python_runtime_dll = target
            # Add this directory to PATH and DLL search
            os.environ['PATH'] = path + os.pathsep + os.environ.get('PATH', '')
            if hasattr(os, 'add_dll_directory'):
                try: os.add_dll_directory(path)
                except: pass
            break

    # 2. Force pythonnet to find the core python DLL
    python_dlls = glob.glob(os.path.join(sys._MEIPASS, 'python3*.dll'))
    if python_dlls:
        os.environ['PYTHONNET_PYDLL'] = python_dlls[0]
        
    # 3. Choose the correct runtime key (netfx for Framework, coreclr for Core)
    # If deps.json exists near the DLL, it's likely a CoreCLR runtime
    if python_runtime_dll:
        deps_json = python_runtime_dll.replace('.dll', '.deps.json')
        if os.path.exists(deps_json):
            os.environ['PYTHONNET_RUNTIME'] = 'coreclr'
        else:
            os.environ['PYTHONNET_RUNTIME'] = 'netfx'



# Now safe to import other modules
import threading
import time
import uvicorn
from pathlib import Path

# Get the base directory
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
    DATA_DIR = Path(os.path.dirname(sys.executable)) / 'data'
else:
    BASE_DIR = Path(__file__).parent
    DATA_DIR = BASE_DIR.parent / 'data'

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# Set up logging to file
import logging
LOG_FILE = DATA_DIR / 'desktop.log'

file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logging.getLogger().setLevel(logging.INFO)
logging.getLogger().addHandler(file_handler)
logger = logging.getLogger('desktop_app')

logger.info(f"Initializing Omni Vault Desktop (Log: {LOG_FILE})")

# Set database path
os.environ['DATABASE_URL'] = f'sqlite:///{DATA_DIR}/mytasker.db'

# Import FastAPI app
from app.main import app as fastapi_app

# Backend configuration
BACKEND_HOST = '0.0.0.0'  # Listen on all interfaces
BACKEND_PORT = 8766      # Unique port for webview mode
FRONTEND_URL = f'http://127.0.0.1:{BACKEND_PORT}' # Webview connects to loopback

# Window configuration
WINDOW_TITLE = 'Omni Vault'
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 800
WINDOW_MIN_WIDTH = 1200
WINDOW_MIN_HEIGHT = 600


def wait_for_backend(url, timeout=30):
    """Wait for backend to be ready by polling the health endpoint"""
    import requests
    start_time = time.time()
    health_url = f"{url}/api/health"
    logger.info(f"Waiting for backend at {health_url}...")
    
    last_error = ""
    while time.time() - start_time < timeout:
        try:
            # We use a short timeout for the request itself
            response = requests.get(health_url, timeout=2)
            if response.status_code == 200:
                logger.info(f"Backend is ready after {time.time() - start_time:.1f}s")
                return True
            else:
                last_error = f"Status: {response.status_code}"
        except Exception as e:
            last_error = str(e)
            pass
        time.sleep(0.5)
    
    logger.error(f"Backend wait timed out! Last error: {last_error}")
    return False


def start_backend():
    """Start FastAPI backend server in background thread"""
    logger.info(f"Starting backend server on {BACKEND_HOST}:{BACKEND_PORT}")
    try:
        uvicorn.run(
            fastapi_app,
            host=BACKEND_HOST,
            port=BACKEND_PORT,
            log_level='info',
            access_log=False
        )
    except Exception as e:
        logger.error(f"Backend server failed: {e}", exc_info=True)


def create_window():
    """Create and configure the webview window"""
    import webview
    
    # Wait for backend to be ready before opening the window
    if not wait_for_backend(FRONTEND_URL):
        print("Warning: Opening window despite backend timeout...")

    print(f"Opening window: {FRONTEND_URL}")
    
    # Create webview window
    window = webview.create_window(
        title=WINDOW_TITLE,
        url=FRONTEND_URL,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT),
        resizable=True,
        fullscreen=False,
        frameless=False,
        easy_drag=False,
        background_color='#0F1117'
    )
    
    return window


def main():
    """Main entry point"""
    logger.info("=" * 60)
    logger.info("Omni Vault - Local-First Productivity App")
    logger.info("=" * 60)
    logger.info(f"Data Directory: {DATA_DIR}")
    logger.info(f"Database: {os.environ.get('DATABASE_URL')}")
    
    # Start backend in separate thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Create and start webview window (blocking call)
    try:
        import webview
        
        # On Windows, webview.start() should be called from the main thread
        create_window()
        
        # Use EdgeChromium backend (built into Windows 10/11) - avoids pythonnet dependency
        logger.info("Starting webview with EdgeChromium backend...")
        webview.start(gui='edgechromium', debug=False)
                
    except Exception as e:
        logger.error(f"Error starting webview: {e}", exc_info=True)
        
        # Show a user-friendly message with log path using Windows API
        try:
            import ctypes
            error_msg = f"Omni Vault failed to start.\n\nPlease check the logs for details:\n{LOG_FILE}\n\nError: {str(e)}"
            ctypes.hwnd = 0
            ctypes.windll.user32.MessageBoxW(0, error_msg, "Startup Error", 0x10)
        except:
            # Fallback to console if ctypes fails
            print("\n" + "=" * 60)
            print("STARTUP ERROR:")
            print("=" * 60)
            print(f"Please check the log file at:\n{LOG_FILE}")
            print(f"Error: {e}")
            print("=" * 60)
        
        sys.exit(1)
    
    print("\nApplication closed. Goodbye!")


if __name__ == '__main__':
    main()


