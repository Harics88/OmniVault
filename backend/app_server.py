"""
Omni Vault - Web Server Application
Runs FastAPI backend only - users access via browser at http://localhost:8000
"""
import os
import sys
import uvicorn
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

# Server configuration
BACKEND_HOST = '127.0.0.1'
BACKEND_PORT = 8000

def main():
    """Main entry point"""
    print("=" * 60)
    print("Omni Vault - Web Server")
    print("=" * 60)
    print(f"Data Directory: {DATA_DIR}")
    print(f"Database: {os.environ.get('DATABASE_URL')}")
    print()
    print(f"Starting server at http://{BACKEND_HOST}:{BACKEND_PORT}")
    print("Open your browser and navigate to the URL above")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        uvicorn.run(
            fastapi_app,
            host=BACKEND_HOST,
            port=BACKEND_PORT,
            log_level='info',
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped. Goodbye!")
    except Exception as e:
        print(f"\nError starting server: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)


if __name__ == '__main__':
    main()
