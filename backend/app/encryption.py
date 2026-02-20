"""
Encryption utilities for secure password storage in the Vault.

Uses Fernet symmetric encryption with PBKDF2 key derivation.
Each secret has its own random salt for additional security.
"""

import os
import base64
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
from typing import Dict


def derive_key(master_password: str, salt: bytes) -> bytes:
    """
    Derive an encryption key from the master password using PBKDF2.
    
    Args:
        master_password: The user's master password
        salt: Random salt bytes (16 bytes recommended)
    
    Returns:
        32-byte encryption key suitable for Fernet
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,  # OWASP recommended minimum
    )
    return base64.urlsafe_b64encode(kdf.derive(master_password.encode()))


def encrypt_password(password: str, master_password: str) -> str:
    """
    Encrypt a password using the master password.
    
    Args:
        password: The plaintext password to encrypt
        master_password: The user's master password
    
    Returns:
        JSON string containing encrypted data and salt: {"encrypted": "...", "salt": "..."}
    """
    # Generate a random salt for this secret
    salt = os.urandom(16)
    
    # Derive encryption key from master password
    key = derive_key(master_password, salt)
    
    # Encrypt the password
    fernet = Fernet(key)
    encrypted_bytes = fernet.encrypt(password.encode())
    
    # Return as JSON with base64-encoded values
    result = {
        "encrypted": base64.b64encode(encrypted_bytes).decode('utf-8'),
        "salt": base64.b64encode(salt).decode('utf-8')
    }
    
    return json.dumps(result)


def decrypt_password(encrypted_data: str, master_password: str) -> str:
    """
    Decrypt a password using the master password.
    
    Args:
        encrypted_data: JSON string from encrypt_password
        master_password: The user's master password
    
    Returns:
        The decrypted plaintext password
    
    Raises:
        ValueError: If decryption fails (wrong password or corrupted data)
    """
    try:
        # Parse the JSON data
        data = json.loads(encrypted_data)
        encrypted_bytes = base64.b64decode(data["encrypted"])
        salt = base64.b64decode(data["salt"])
        
        # Derive the same key using the salt
        key = derive_key(master_password, salt)
        
        # Decrypt the password
        fernet = Fernet(key)
        decrypted_bytes = fernet.decrypt(encrypted_bytes)
        
        return decrypted_bytes.decode('utf-8')
    
    except Exception as e:
        raise ValueError(f"Failed to decrypt password. Wrong master password or corrupted data: {str(e)}")


def verify_master_password(encrypted_data: str, master_password: str) -> bool:
    """
    Verify if a master password is correct by attempting decryption.
    
    Args:
        encrypted_data: JSON string from encrypt_password
        master_password: The master password to verify
    
    Returns:
        True if password is correct, False otherwise
    """
    try:
        decrypt_password(encrypted_data, master_password)
        return True
    except ValueError:
        return False
