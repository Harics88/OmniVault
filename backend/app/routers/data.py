from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import zipfile
from datetime import datetime
from pathlib import Path
from app.database import DB_PATH

router = APIRouter()

BACKUP_DIR = Path("/tmp/backups")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/export")
async def export_data():
    """Export database and other data as a ZIP file"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"omnivault_backup_{timestamp}.zip"
        backup_path = BACKUP_DIR / backup_filename

        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if os.path.exists(DB_PATH):
                zipf.write(DB_PATH, arcname="mytasker.db")

        return FileResponse(
            path=backup_path,
            filename=backup_filename,
            media_type='application/zip'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_data(file: UploadFile = File(...)):
    """Import data from ZIP backup"""
    try:
        if not file.filename.endswith('.zip'):
            raise HTTPException(status_code=400, detail="Invalid file format")

        temp_path = BACKUP_DIR / f"temp_restore_{datetime.now().timestamp()}.zip"

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Verify zip
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            if "mytasker.db" not in zip_ref.namelist():
                 raise HTTPException(status_code=400, detail="Invalid backup file: Missing database")

            # Extract to temp location first or direct overwrite?
            # Direct overwrite requires closing connections usually.
            # SQLite handles hot swaps mostly okay if we are careful, but ideally we should lock.
            # For this simple app, we will just extract.

            # Create a backup of current DB just in case
            if os.path.exists(DB_PATH):
                shutil.copy2(DB_PATH, str(DB_PATH) + ".bak")

            zip_ref.extract("mytasker.db", path=str(Path(DB_PATH).parent))

        return {"message": "Data restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
