"""
MyTasker - FastAPI Backend
A local-first productivity app for data engineers
"""

import logging
import time
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Callable

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.database import engine, Base, get_db
from app.routers import daily_logs, tasks, notes, snippets, bookmarks, search, sections, system, data, vault, entities, log_entries

# Determine frontend static files location
if getattr(sys, 'frozen', False):
    # Running as PyInstaller bundle
    # sys._MEIPASS is where PyInstaller extracts data files
    FRONTEND_DIR = Path(sys._MEIPASS) / 'frontend_dist'
else:
    # Running as script (development)
    # The frontend/dist is usually two levels up from backend/app/main.py
    current_file = Path(__file__).resolve()
    FRONTEND_DIR = current_file.parent.parent.parent / 'frontend' / 'dist'

# Ensure path is absolute and log it
FRONTEND_DIR = FRONTEND_DIR.resolve()
# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

logger.info(f"Initialized FRONTEND_DIR: {FRONTEND_DIR}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    logger.info("Starting MyTasker application...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            # Migration check: Add missing columns to tasks table
            try:
                result = await conn.execute(text("PRAGMA table_info(tasks)"))
                task_columns = [row[1] for row in result.fetchall()]

                if "is_personal" not in task_columns:
                    logger.info("Adding missing 'is_personal' column to tasks table...")
                    await conn.execute(text("ALTER TABLE tasks ADD COLUMN is_personal BOOLEAN DEFAULT 0"))
                    logger.info("'is_personal' column added successfully")

                if "deleted_at" not in task_columns:
                    logger.info("Adding missing 'deleted_at' column to tasks table...")
                    await conn.execute(text("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME DEFAULT NULL"))
                    logger.info("'deleted_at' column added to tasks successfully")
            except Exception as migration_error:
                logger.error(f"Tasks migration failed: {migration_error}")

            # Migration check: Add deleted_at to notes, snippets, bookmarks, entities
            for table_name in ("notes", "snippets", "bookmarks", "entities"):
                try:
                    result = await conn.execute(text(f"PRAGMA table_info({table_name})"))
                    existing_cols = [row[1] for row in result.fetchall()]
                    if "deleted_at" not in existing_cols:
                        logger.info(f"Adding missing 'deleted_at' column to {table_name} table...")
                        await conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN deleted_at DATETIME DEFAULT NULL"))
                        logger.info(f"'deleted_at' column added to {table_name} successfully")
                except Exception as migration_error:
                    logger.error(f"{table_name} migration failed: {migration_error}")

        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    yield
    
    # Shutdown: Clean up resources
    logger.info("Shutting down MyTasker application...")
    await engine.dispose()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="MyTasker API",
    description="Local-first productivity API for data engineers",
    version="2.5.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable):
    """Log all requests and responses"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {process_time:.3f}s"
        )
        
        # Add custom headers
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"Error: {str(e)} "
            f"Duration: {process_time:.3f}s"
        )
        raise


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)} "
        f"Path: {request.url.path}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "type": type(exc).__name__,
            "path": request.url.path,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.warning(
        f"Validation error: {request.url.path} "
        f"Errors: {exc.errors()}"
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": exc.errors(),
            "path": request.url.path,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Include routers
app.include_router(daily_logs.router, prefix="/api/daily-logs", tags=["Daily Logs"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(sections.router, prefix="/api/sections", tags=["Note Sections"])
app.include_router(snippets.router, prefix="/api/snippets", tags=["Snippets"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Bookmarks"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(vault.router, prefix="/api/vault", tags=["Vault"])
app.include_router(entities.router, prefix="/api/entities", tags=["Entities"])
app.include_router(log_entries.router, prefix="/api/log-entries", tags=["Log Entries"])


@app.get("/api/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.5.0",
        "checks": {}
    }
    
    # Check database connectivity
    try:
        async for db in get_db():
            result = await db.execute(text("SELECT 1"))
            result.scalar()
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
            break
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Determine overall status
    if health_status["status"] == "unhealthy":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status
        )
    
    return health_status


@app.get("/api/ready")
async def readiness_check():
    """Readiness check for container orchestration"""
    try:
        # Quick database check
        async for db in get_db():
            await db.execute(text("SELECT 1"))
            return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "error": str(e)}
        )


# Mount static files (for assets like CSS, JS, images)
if FRONTEND_DIR.exists():
    logger.info(f"Serving frontend from: {FRONTEND_DIR}")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="static")
else:
    logger.warning(f"Frontend directory not found: {FRONTEND_DIR}")


# Serve frontend for all non-API routes (SPA fallback)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    """
    Serve the React frontend for all non-API routes.
    This enables client-side routing in the SPA.
    """
    # Skip API routes
    if full_path.startswith("api/"):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Not Found", "path": f"/{full_path}"}
        )
    
    # Handle root path or empty path - serve index.html
    if not full_path or full_path == "/":
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    
    # Check if it's a request for a specific file
    requested_file = FRONTEND_DIR / full_path
    if requested_file.is_file():
        return FileResponse(requested_file)
    
    # Default to index.html for client-side routing (SPA fallback)
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    # Fallback if index.html doesn't exist
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Frontend not found",
            "message": f"Please build the frontend first. Looking in: {FRONTEND_DIR}"
        }
    )
