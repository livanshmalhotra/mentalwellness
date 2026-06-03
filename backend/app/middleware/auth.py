from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os
import urllib.request
import json
import time

from app.database.session import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Firebase configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "emotionsystem-17292")
GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

# Simple in-memory cache for Google public certificates
cached_certs = {}
certs_expiry = 0

def get_google_public_certs():
    global cached_certs, certs_expiry
    now = time.time()
    if not cached_certs or now > certs_expiry:
        try:
            req = urllib.request.Request(
                GOOGLE_CERTS_URL,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                headers = response.headers
                # Parse Cache-Control header to determine expiry
                cache_control = headers.get("Cache-Control", "")
                max_age = 3600  # Default fallback cache duration is 1 hour
                for part in cache_control.split(","):
                    if "max-age" in part:
                        try:
                            max_age = int(part.split("=")[1].strip())
                        except ValueError:
                            pass
                
                cached_certs = json.loads(response.read().decode('utf-8'))
                certs_expiry = now + max_age
        except Exception as e:
            # If fetch fails and we have cached certs, use them. Otherwise raise.
            if not cached_certs:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to fetch Firebase public keys: {e}"
                )
    return cached_certs

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. Decode header to extract kid (key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise credentials_exception
            
        # 2. Retrieve public certificates and find matching key
        certs = get_google_public_certs()
        cert_pem = certs.get(kid)
        if not cert_pem:
            raise credentials_exception
            
        # 3. Decode and verify signature & claims using Google public key
        payload = jwt.decode(
            token,
            cert_pem,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
        )
        
        email: str = payload.get("email")
        full_name: str = payload.get("name")  # Firebase displayName is mapped to 'name' in ID token claims
        if email is None:
            raise credentials_exception
            
    except (JWTError, Exception) as e:
        raise credentials_exception
        
    # 4. Find user by email in local database
    user = db.query(User).filter(User.email == email).first()
    
    # 5. If user is not found, automatically register them locally
    if user is None:
        user = User(
            email=email,
            full_name=full_name or email.split("@")[0],
            hashed_password=""  # Empty password indicates Firebase SSO login
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

