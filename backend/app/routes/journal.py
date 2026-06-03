from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import JournalEntryCreate, JournalEntryResponse
from app.services.journal_service import create_journal_entry, get_journal_history

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.post("", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def api_create_journal(
    journal_in: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a student journal entry. Automatically performs NLP sentiment analysis and emotion classification.
    """
    return create_journal_entry(db=db, journal_in=journal_in, user_id=current_user.id)

@router.get("/history", response_model=List[JournalEntryResponse])
def api_get_journal_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve past journal entries.
    """
    return get_journal_history(db=db, user_id=current_user.id, limit=limit)
