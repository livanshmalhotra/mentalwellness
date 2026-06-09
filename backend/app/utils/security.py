import os
import base64
import bcrypt
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# Configuration
env_mode = os.getenv("ENV", "development")
JWT_SECRET = os.getenv("JWT_SECRET")

# Fallback block with strict security checks for production environments
DEFAULT_JWT_SECRET = "8f4679720df545b79e2a6d7bb957b42f2b963cfb2a6ad3b0f5ef5b84c8a2cd76"
if env_mode == "production":
    if not JWT_SECRET or JWT_SECRET == DEFAULT_JWT_SECRET:
        raise ValueError("CRITICAL SECURITY ERROR: You must set a unique, secure JWT_SECRET in production mode.")
else:
    if not JWT_SECRET:
        JWT_SECRET = DEFAULT_JWT_SECRET

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def encrypt_text(plain_text: str, password: str) -> str:
    """
    Encrypts text using AES-256-GCM.
    Key is derived from password using PBKDF2HMAC.
    Returns base64 encoded salt + iv + tag + ciphertext.
    """
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode('utf-8'))
    iv = os.urandom(12)
    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
    ).encryptor()
    
    ciphertext = encryptor.update(plain_text.encode('utf-8')) + encryptor.finalize()
    tag = encryptor.tag
    
    combined = salt + iv + tag + ciphertext
    return base64.b64encode(combined).decode('utf-8')

def decrypt_text(encrypted_base64: str, password: str) -> str:
    """
    Decrypts AES-256-GCM encrypted base64 payload.
    """
    combined = base64.b64decode(encrypted_base64.encode('utf-8'))
    
    salt = combined[:16]
    iv = combined[16:28]
    tag = combined[28:44]
    ciphertext = combined[44:]
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode('utf-8'))
    
    decryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv, tag),
    ).decryptor()
    
    decrypted_bytes = decryptor.update(ciphertext) + decryptor.finalize()
    return decrypted_bytes.decode('utf-8')

