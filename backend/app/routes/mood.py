from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import MoodLogCreate, MoodLogResponse
from app.services.mood_service import create_mood_log, get_mood_history

router = APIRouter(prefix="/api/mood", tags=["mood"])

@router.post("", response_model=MoodLogResponse, status_code=status.HTTP_201_CREATED)
def api_create_mood(
    mood_in: MoodLogCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Submit daily mood tracking metrics.
    """
    return create_mood_log(db=db, mood_in=mood_in, user_id=current_user.id)

@router.get("/history", response_model=List[MoodLogResponse])
def api_get_mood_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve user's mood tracking history.
    """
    return get_mood_history(db=db, user_id=current_user.id, limit=limit)
