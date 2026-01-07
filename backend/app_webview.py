"""
Omni Vault - Desktop Application
Runs FastAPI backend and displays React frontend in native window using PyWebView
"""
import os
import sys
import threading
import time
import uvicorn
import webview
from pathlib import Path

# Get the base directory
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    BASE_DIR = Path(sys._MEIPASS)
    DATA_DIR = Path(os.path.dirname(sys.executable)) / 'data'
else:
    # Running as script
    BASE_DIR = Path(__file__).parent
    DATA_DIR = BASE_DIR.parent / 'data'

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# Set database path
os.environ['DATABASE_URL'] = f'sqlite:///{DATA_DIR}/mytasker.db'

# Import FastAPI app
from app.main import app as fastapi_app

# Backend configuration
BACKEND_HOST = '127.0.0.1'
BACKEND_PORT = 8766  # Unique port for webview mode
FRONTEND_URL = f'http://{BACKEND_HOST}:{BACKEND_PORT}'

# Window configuration
WINDOW_TITLE = 'Omni Vault'
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 800
WINDOW_MIN_WIDTH = 1200
WINDOW_MIN_HEIGHT = 600


def wait_for_backend(url, timeout=20):
    """Wait for backend to be ready by polling the health endpoint"""
    import requests
    start_time = time.time()
    health_url = f"{url}/api/health"
    print(f"Waiting for backend at {health_url}...")
    
    while time.time() - start_time < timeout:
        try:
            # We use a short timeout for the request itself
            response = requests.get(health_url, timeout=2)
            if response.status_code == 200:
                print("Backend is ready!")
                return True
        except Exception:
            pass
        time.sleep(0.5)
    
    print("Backend wait timed out!")
    return False


def start_backend():
    """Start FastAPI backend server in background thread"""
    print(f"Starting backend server on {BACKEND_HOST}:{BACKEND_PORT}")
    
    uvicorn.run(
        fastapi_app,
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        log_level='info',
        access_log=False
    )


def create_window():
    """Create and configure the webview window"""
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
    print("=" * 60)
    print("Omni Vault - Local-First Productivity App")
    print("=" * 60)
    print(f"Data Directory: {DATA_DIR}")
    print(f"Database: {os.environ.get('DATABASE_URL')}")
    print()
    
    # Start backend in separate thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Create and start webview window (blocking call)
    try:
        # On Windows, webview.start() should be called from the main thread
        create_window()
        webview.start(debug=False)
    except Exception as e:
        print(f"Error starting webview: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    print("\nApplication closed. Goodbye!")


if __name__ == '__main__':
    main()
