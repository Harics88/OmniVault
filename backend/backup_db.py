#!/usr/bin/env python3
"""
Database Backup Script for MyTasker
Creates timestamped backups of the SQLite database
"""

import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

# Configuration
DB_PATH = Path("data/mytasker.db")
BACKUP_DIR = Path("data/backups")
MAX_BACKUPS = 30  # Keep last 30 backups

def create_backup():
    """Create a timestamped backup of the database"""
    
    # Ensure backup directory exists
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check if database exists
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        return False
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"mytasker_backup_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename
    
    try:
        # Method 1: Using SQLite backup API (recommended for consistency)
        print(f"📦 Creating backup: {backup_filename}")
        
        # Connect to source database
        source_conn = sqlite3.connect(str(DB_PATH))
        
        # Connect to backup database
        backup_conn = sqlite3.connect(str(backup_path))
        
        # Perform backup
        with backup_conn:
            source_conn.backup(backup_conn)
        
        # Close connections
        source_conn.close()
        backup_conn.close()
        
        # Get file size
        size_mb = backup_path.stat().st_size / (1024 * 1024)
        
        print(f"✅ Backup created successfully: {backup_filename} ({size_mb:.2f} MB)")
        
        # Clean up old backups
        cleanup_old_backups()
        
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        # Clean up failed backup
        if backup_path.exists():
            backup_path.unlink()
        return False


def cleanup_old_backups():
    """Remove old backups, keeping only the most recent MAX_BACKUPS"""
    
    if not BACKUP_DIR.exists():
        return
    
    # Get all backup files
    backups = sorted(
        BACKUP_DIR.glob("mytasker_backup_*.db"),
        key=lambda p: p.stat().st_mtime,
        reverse=True
    )
    
    # Remove old backups
    if len(backups) > MAX_BACKUPS:
        old_backups = backups[MAX_BACKUPS:]
        print(f"🧹 Cleaning up {len(old_backups)} old backup(s)")
        
        for backup in old_backups:
            try:
                backup.unlink()
                print(f"   Removed: {backup.name}")
            except Exception as e:
                print(f"   Failed to remove {backup.name}: {e}")


def list_backups():
    """List all available backups"""
    
    if not BACKUP_DIR.exists():
        print("No backups found")
        return
    
    backups = sorted(
        BACKUP_DIR.glob("mytasker_backup_*.db"),
        key=lambda p: p.stat().st_mtime,
        reverse=True
    )
    
    if not backups:
        print("No backups found")
        return
    
    print(f"\n📋 Available backups ({len(backups)}):")
    print("-" * 60)
    
    for i, backup in enumerate(backups, 1):
        size_mb = backup.stat().st_size / (1024 * 1024)
        mtime = datetime.fromtimestamp(backup.stat().st_mtime)
        print(f"{i}. {backup.name}")
        print(f"   Size: {size_mb:.2f} MB | Created: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("-" * 60)


def restore_backup(backup_name: str):
    """Restore database from a backup"""
    
    backup_path = BACKUP_DIR / backup_name
    
    if not backup_path.exists():
        print(f"❌ Backup not found: {backup_name}")
        return False
    
    # Create a backup of current database before restoring
    print("📦 Creating safety backup of current database...")
    safety_backup = DB_PATH.parent / f"mytasker_pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    
    try:
        if DB_PATH.exists():
            shutil.copy2(DB_PATH, safety_backup)
            print(f"✅ Safety backup created: {safety_backup.name}")
        
        # Restore from backup
        print(f"🔄 Restoring from: {backup_name}")
        shutil.copy2(backup_path, DB_PATH)
        
        print(f"✅ Database restored successfully from {backup_name}")
        print(f"💡 Previous database saved as: {safety_backup.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Restore failed: {e}")
        
        # Try to restore safety backup if it exists
        if safety_backup.exists():
            print("🔄 Attempting to restore safety backup...")
            try:
                shutil.copy2(safety_backup, DB_PATH)
                print("✅ Safety backup restored")
            except Exception as restore_error:
                print(f"❌ Failed to restore safety backup: {restore_error}")
        
        return False


def verify_backup(backup_name: str):
    """Verify backup integrity"""
    
    backup_path = BACKUP_DIR / backup_name
    
    if not backup_path.exists():
        print(f"❌ Backup not found: {backup_name}")
        return False
    
    try:
        print(f"🔍 Verifying backup: {backup_name}")
        
        # Try to connect and run integrity check
        conn = sqlite3.connect(str(backup_path))
        cursor = conn.cursor()
        
        # Run integrity check
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        
        conn.close()
        
        if result[0] == "ok":
            print(f"✅ Backup is valid and intact")
            return True
        else:
            print(f"❌ Backup integrity check failed: {result[0]}")
            return False
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("MyTasker Database Backup Tool")
        print("\nUsage:")
        print("  python backup_db.py backup          - Create a new backup")
        print("  python backup_db.py list            - List all backups")
        print("  python backup_db.py restore <name>  - Restore from backup")
        print("  python backup_db.py verify <name>   - Verify backup integrity")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "backup":
        create_backup()
    
    elif command == "list":
        list_backups()
    
    elif command == "restore":
        if len(sys.argv) < 3:
            print("❌ Please specify backup name")
            print("Usage: python backup_db.py restore <backup_name>")
            sys.exit(1)
        restore_backup(sys.argv[2])
    
    elif command == "verify":
        if len(sys.argv) < 3:
            print("❌ Please specify backup name")
            print("Usage: python backup_db.py verify <backup_name>")
            sys.exit(1)
        verify_backup(sys.argv[2])
    
    else:
        print(f"❌ Unknown command: {command}")
        print("Valid commands: backup, list, restore, verify")
        sys.exit(1)
