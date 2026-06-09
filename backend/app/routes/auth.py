from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import register_user, authenticate_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def api_register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new student user.
    """
    return register_user(db=db, user_in=user_in)

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def api_login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a student and issues a JWT token.
    """
    return authenticate_user(db=db, credentials=credentials)
