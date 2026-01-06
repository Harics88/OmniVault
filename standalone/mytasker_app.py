"""
MyTasker Standalone Application
Single executable that runs backend and opens browser
No Docker, Python, or Node.js installation required
"""

import os
import sys
import time
import socket
import webbrowser
import subprocess
import threading
from pathlib import Path
import uvicorn
import asyncio
import encodings
import email
import json
import logging
import multiprocessing
import signal
import typing
# Force uvicorn submodules
from uvicorn.logging import DefaultFormatter
from uvicorn.loops import auto as loop_auto
from uvicorn.protocols import http
from uvicorn.lifespan import on as lifespan_on

# Determine if running as compiled executable or script
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    BASE_DIR = Path(sys._MEIPASS)
    APP_DIR = Path(sys.executable).parent
else:
    # Running as script
    BASE_DIR = Path(__file__).parent
    APP_DIR = BASE_DIR

# Configuration
HOST = "127.0.0.1"
PORT = 8000
DATABASE_PATH = APP_DIR / "data" / "mytasker.db"
FRONTEND_PATH = BASE_DIR / "frontend" / "dist"

def is_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def find_available_port(start_port=8000, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return None

def wait_for_server(host, port, timeout=30):
    """Wait for server to be ready"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                if s.connect_ex((host, port)) == 0:
                    return True
        except:
            pass
        time.sleep(0.5)
    return False

def open_browser(url):
    """Open browser after a short delay"""
    time.sleep(2)  # Wait for server to fully start
    try:
        webbrowser.open(url)
        print(f"✅ Opened browser: {url}")
    except Exception as e:
        print(f"⚠️  Could not open browser automatically: {e}")
        print(f"Please open manually: {url}")

def run_server(port):
    """Run the FastAPI server"""
    # Set environment variables
    os.environ['DATABASE_URL'] = f'sqlite:///{DATABASE_PATH}'
    os.environ['PYTHONUNBUFFERED'] = '1'
    
    # Ensure data directory exists
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Import and run the FastAPI app
    try:
        from app.main import app
        from fastapi.staticfiles import StaticFiles
        from fastapi.responses import FileResponse
        
        print(f"🚀 Starting MyTasker backend on http://{HOST}:{port}")
        print(f"📁 Database: {DATABASE_PATH}")
        print(f"📂 Frontend: {FRONTEND_PATH}")
        print()
        
        # Verify frontend path exists
        if not FRONTEND_PATH.exists():
            print(f"⚠️ Warning: Frontend files not found at {FRONTEND_PATH}")
        else:
            # Mount assets
            assets_path = FRONTEND_PATH / "assets"
            if assets_path.exists():
                app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
            
            # FORCE REMOVE existing root route (nested in app.router.routes)
            # This deletes the JSON API welcome message route
            app.router.routes = [r for r in app.router.routes if getattr(r, "path", "") != "/"]

            # Serve index.html for root (now this will be the only listener for /)
            @app.get("/")
            async def serve_spa_root():
                return FileResponse(str(FRONTEND_PATH / "index.html"))
            
            # Serve index.html for unknown paths (SPA routing) - excluding API
            @app.exception_handler(404)
            async def custom_404_handler(request, exc):
                if request.url.path.startswith("/api"):
                    return {"error": "Not Found"}
                return FileResponse(str(FRONTEND_PATH / "index.html"))

        # Configure uvicorn
        config = uvicorn.Config(
            app,
            host=HOST,
            port=port,
            log_level="info",
            access_log=True
        )
        server = uvicorn.Server(config)
        server.run()
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
        sys.exit(1)

def main():
    """Main application entry point"""
    print("=" * 60)
    print("  MyTasker - Local-First Productivity App")
    print("  Standalone Edition (No Docker Required)")
    print("=" * 60)
    print()
    
    # Check if port is available
    port = PORT
    if is_port_in_use(port):
        print(f"⚠️  Port {port} is already in use")
        new_port = find_available_port(port + 1)
        if new_port:
            port = new_port
            print(f"✅ Using alternative port: {port}")
        else:
            print("❌ Could not find available port")
            print("Please close other applications using ports 8000-8010")
            input("Press Enter to exit...")
            sys.exit(1)
    
    # Start browser opener in background thread
    url = f"http://{HOST}:{port}"
    browser_thread = threading.Thread(target=open_browser, args=(url,), daemon=True)
    browser_thread.start()
    
    # Run the server (blocking)
    try:
        run_server(port)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down MyTasker...")
        print("Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()
