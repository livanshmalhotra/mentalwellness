from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from supabase import create_client, Client

from app.database.session import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hllxouxygpzdcundqjkl.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Create the Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Get the authenticated user from Supabase using the access token (JWT)
        res = supabase.auth.get_user(token)
        supabase_user = res.user
        if not supabase_user:
            raise credentials_exception
            
        email = supabase_user.email
        uid = supabase_user.id
        
        # Extract name from user metadata if present, or split email
        user_metadata = supabase_user.user_metadata or {}
        full_name = user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0]
        
    except Exception as e:
        print(f"Error validating Supabase token: {e}")
        raise credentials_exception
        
    # Find user by UUID in PostgreSQL database
    user = db.query(User).filter(User.id == uid).first()
    
    # Auto-provision profile record in database if it doesn't exist yet
    if user is None:
        user = User(
            id=uid,
            email=email,
            full_name=full_name,
            hashed_password=""  # Empty password indicates SSO/Supabase managed login
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user
