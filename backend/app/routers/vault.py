"""
Vault API router for managing secrets (credentials)
Supports database, SFTP, and website credentials with PIN protection
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import json
import hashlib
from datetime import datetime

from app.database import get_db
from app.models import Secret, SecretType, AppConfig
from app.schemas import SecretCreate, SecretUpdate, SecretResponse, PINSetup, PINVerify, PINResponse

router = APIRouter()


def hash_pin(pin: str) -> str:
    """Hash a PIN using SHA-256"""
    return hashlib.sha256(pin.encode()).hexdigest()


# ============ PIN Management Endpoints ============

@router.post("/pin/setup", response_model=PINResponse)
async def setup_pin(pin_data: PINSetup, db: AsyncSession = Depends(get_db)):
    """
    Set up the vault PIN for the first time or reset it.
    PIN is hashed and stored persistently in the database.
    """
    # Validate PIN is 4 digits
    if not pin_data.pin.isdigit() or len(pin_data.pin) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be exactly 4 digits"
        )
    
    hashed = hash_pin(pin_data.pin)
    
    # Update or create config entry
    result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_hash"))
    config = result.scalar_one_or_none()
    
    if config:
        config.value = hashed
    else:
        config = AppConfig(key="vault_pin_hash", value=hashed)
        db.add(config)
    
    # Update or create tip entry
    tip_result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_tip"))
    tip_config = tip_result.scalar_one_or_none()
    
    tip_value = pin_data.tip or ""
    if tip_config:
        tip_config.value = tip_value
    else:
        tip_config = AppConfig(key="vault_pin_tip", value=tip_value)
        db.add(tip_config)
    
    await db.commit()
    
    return PINResponse(valid=True, message="PIN set successfully")


@router.post("/pin/verify", response_model=PINResponse)
async def verify_pin(pin_data: PINVerify, db: AsyncSession = Depends(get_db)):
    """
    Verify the provided PIN against the stored hash.
    Returns success/failure status.
    """
    # Check if PIN is set up
    result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_hash"))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PIN not set up. Please set up PIN first."
        )
    
    # Verify PIN
    if hash_pin(pin_data.pin) == config.value:
        return PINResponse(valid=True, message="PIN verified successfully")
    else:
        return PINResponse(valid=False, message="Invalid PIN")


@router.post("/pin/reset", response_model=PINResponse)
async def reset_pin(db: AsyncSession = Depends(get_db)):
    """
    Reset the PIN (clears it, requiring setup again).
    """
    result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_hash"))
    config = result.scalar_one_or_none()
    
    if config:
        await db.delete(config)
        await db.commit()
    
    return PINResponse(valid=True, message="PIN reset successfully. Please set up a new PIN.")


@router.get("/pin/status", response_model=dict)
async def pin_status(db: AsyncSession = Depends(get_db)):
    """Check if PIN is set up and if it's enabled"""
    # Check if PIN is set up
    result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_hash"))
    config = result.scalar_one_or_none()
    
    # Check if PIN is enabled (default to true if not set)
    enabled_result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_enabled"))
    enabled_config = enabled_result.scalar_one_or_none()
    is_enabled = enabled_config.value == "true" if enabled_config else True
    
    # Get PIN tip
    tip_result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_tip"))
    tip_config = tip_result.scalar_one_or_none()
    tip = tip_config.value if tip_config else None
    
    return {
        "is_setup": config is not None,
        "is_enabled": is_enabled,
        "tip": tip
    }


@router.post("/pin/toggle", response_model=dict)
async def toggle_pin_protection(enabled: bool, db: AsyncSession = Depends(get_db)):
    """Enable or disable PIN protection for the vault"""
    result = await db.execute(select(AppConfig).where(AppConfig.key == "vault_pin_enabled"))
    config = result.scalar_one_or_none()
    
    value = "true" if enabled else "false"
    
    if config:
        config.value = value
    else:
        config = AppConfig(key="vault_pin_enabled", value=value)
        db.add(config)
    
    await db.commit()
    return {"enabled": enabled}


# ============ Secret Management Endpoints ============

@router.post("/secrets", response_model=SecretResponse, status_code=status.HTTP_201_CREATED)
async def create_secret(secret: SecretCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new vault secret.
    Supports database, SFTP, and website credential types.
    """
    # Validate secret type
    try:
        secret_type = SecretType(secret.type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid secret type. Must be one of: {[t.value for t in SecretType]}"
        )
    
    # Validate metadata is valid JSON
    if secret.metadata:
        try:
            json.loads(secret.metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Metadata must be valid JSON"
            )
    
    # Create secret
    db_secret = Secret(
        type=secret_type,
        label=secret.label,
        meta_json=secret.metadata,
        tags=secret.tags,
        username=secret.username,
        password=secret.password,
        notes=secret.notes
    )
    
    db.add(db_secret)
    await db.commit()
    await db.refresh(db_secret)
    
    # Return response with meta_json mapped to metadata
    return SecretResponse(
        id=db_secret.id,
        type=db_secret.type.value,
        label=db_secret.label,
        metadata=db_secret.meta_json,
        tags=db_secret.tags,
        username=db_secret.username,
        password=db_secret.password,
        notes=db_secret.notes,
        created_at=db_secret.created_at,
        updated_at=db_secret.updated_at
    )


@router.get("/secrets", response_model=List[SecretResponse])
async def list_secrets(
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all vault secrets, optionally filtered by type.
    """
    query = select(Secret).order_by(Secret.label)
    
    # Filter by type if provided
    if type:
        try:
            secret_type = SecretType(type)
            query = query.where(Secret.type == secret_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid secret type. Must be one of: {[t.value for t in SecretType]}"
            )
    
    result = await db.execute(query)
    secrets = result.scalars().all()
    return [
        SecretResponse(
            id=s.id,
            type=s.type.value,
            label=s.label,
            metadata=s.meta_json,
            tags=s.tags,
            username=s.username,
            password=s.password,
            notes=s.notes,
            created_at=s.created_at,
            updated_at=s.updated_at
        ) for s in secrets
    ]


@router.get("/secrets/{secret_id}", response_model=SecretResponse)
async def get_secret(secret_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a specific secret by ID.
    """
    result = await db.execute(select(Secret).where(Secret.id == secret_id))
    secret = result.scalar_one_or_none()
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret with id {secret_id} not found"
        )
    
    return SecretResponse(
        id=secret.id,
        type=secret.type.value,
        label=secret.label,
        metadata=secret.meta_json,
        username=secret.username,
        password=secret.password,
        notes=secret.notes,
        created_at=secret.created_at,
        updated_at=secret.updated_at
    )


@router.put("/secrets/{secret_id}", response_model=SecretResponse)
async def update_secret(
    secret_id: int,
    secret_update: SecretUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing secret.
    """
    result = await db.execute(select(Secret).where(Secret.id == secret_id))
    secret = result.scalar_one_or_none()
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret with id {secret_id} not found"
        )
    
    # Update fields if provided
    if secret_update.type is not None:
        try:
            secret.type = SecretType(secret_update.type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid secret type. Must be one of: {[t.value for t in SecretType]}"
            )
    
    if secret_update.label is not None:
        secret.label = secret_update.label
    
    if secret_update.metadata is not None:
        # Validate JSON
        try:
            json.loads(secret_update.metadata)
            secret.meta_json = secret_update.metadata
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Metadata must be valid JSON"
            )
    
    if secret_update.username is not None:
        secret.username = secret_update.username
    
    if secret_update.tags is not None:
        secret.tags = secret_update.tags
    
    if secret_update.password is not None:
        secret.password = secret_update.password
    
    if secret_update.notes is not None:
        secret.notes = secret_update.notes
    
    # Update the updated_at timestamp
    secret.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(secret)
    
    return SecretResponse(
        id=secret.id,
        type=secret.type.value,
        label=secret.label,
        metadata=secret.meta_json,
        tags=secret.tags,
        username=secret.username,
        password=secret.password,
        notes=secret.notes,
        created_at=secret.created_at,
        updated_at=secret.updated_at
    )


@router.delete("/secrets/{secret_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_secret(secret_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a secret.
    """
    result = await db.execute(select(Secret).where(Secret.id == secret_id))
    secret = result.scalar_one_or_none()
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret with id {secret_id} not found"
        )
    
    await db.delete(secret)
    await db.commit()
    
    return None


@router.get("/secrets/{secret_id}/connection-string")
async def get_connection_string(secret_id: int, db: AsyncSession = Depends(get_db)):
    """
    Generate a connection string for database secrets.
    Returns formatted connection string based on database type.
    """
    result = await db.execute(select(Secret).where(Secret.id == secret_id))
    secret = result.scalar_one_or_none()
    
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret with id {secret_id} not found"
        )
    
    if secret.type != SecretType.DATABASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection strings are only available for database secrets"
        )
    
    # Parse metadata
    try:
        metadata = json.loads(secret.meta_json)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid metadata JSON"
        )
    
    # Extract connection details
    host = metadata.get("host", "localhost")
    port = metadata.get("port", 5432)
    db_type = metadata.get("db_type", "postgresql").lower()
    database = metadata.get("database", metadata.get("sid", ""))
    
    username = secret.username or "user"
    password = secret.password
    
    # Generate connection string based on database type
    if db_type in ["postgresql", "postgres"]:
        conn_str = f"postgresql://{username}:{password}@{host}:{port}/{database}"
    elif db_type == "mysql":
        conn_str = f"mysql://{username}:{password}@{host}:{port}/{database}"
    elif db_type == "oracle":
        sid = metadata.get("sid", database)
        conn_str = f"oracle://{username}:{password}@{host}:{port}/{sid}"
    elif db_type in ["mssql", "sqlserver"]:
        conn_str = f"mssql+pyodbc://{username}:{password}@{host}:{port}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
    else:
        conn_str = f"{db_type}://{username}:{password}@{host}:{port}/{database}"
    
    return {
        "connection_string": conn_str,
        "host": host,
        "port": port,
        "database": database,
        "db_type": db_type
    }
