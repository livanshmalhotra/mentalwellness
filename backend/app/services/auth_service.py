from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, Token
from app.middleware.auth import supabase

def register_user(db: Session, user_in: UserCreate) -> User:
    try:
        # Register user with Supabase Auth
        res = supabase.auth.sign_up({
            "email": user_in.email,
            "password": user_in.password,
            "options": {
                "data": {
                    "full_name": user_in.full_name
                }
            }
        })
        supabase_user = res.user
        if not supabase_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed. Please verify email is not already registered."
            )
            
        # Check if local user already exists
        existing_user = db.query(User).filter(User.id == supabase_user.id).first()
        if not existing_user:
            db_user = User(
                id=supabase_user.id,
                email=user_in.email,
                full_name=user_in.full_name,
                hashed_password=""  # Empty password indicates Supabase SSO/Auth login
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
            
        return existing_user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

def authenticate_user(db: Session, credentials: UserLogin) -> Token:
    try:
        # Authenticate user with Supabase Auth
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        if not res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed. Invalid credentials."
            )
            
        return Token(
            access_token=res.session.access_token,
            token_type="bearer"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
