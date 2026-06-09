from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import (
    JournalEntryCreate, 
    JournalEntryResponse, 
    PasscodeRequest, 
    JournalUnlockRequest, 
    JournalUpdateRequest
)
from app.services.journal_service import (
    create_journal_entry, 
    get_journal_history, 
    unlock_journal_entry, 
    update_journal_entry
)
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.get("/has-passcode", response_model=dict)
def api_has_passcode(
    current_user: User = Depends(get_current_user)
):
    """
    Check if the user has set up a private journal passcode.
    """
    return {"has_passcode": current_user.private_journal_password_hash is not None}

@router.post("/set-passcode", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def api_set_passcode(
    request: Request,
    passcode_in: PasscodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set a private journal passcode for the user.
    """
    from app.utils.security import get_password_hash
    current_user.private_journal_password_hash = get_password_hash(passcode_in.passcode)
    db.add(current_user)
    db.commit()
    return {"message": "Passcode set successfully"}

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

@router.post("/{id}/unlock", response_model=JournalEntryResponse)
@limiter.limit("10/minute")
def api_unlock_journal(
    request: Request,
    id: int,
    unlock_in: JournalUnlockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlock a private journal entry by verifying the passcode and decrypting its contents.
    """
    return unlock_journal_entry(db=db, entry_id=id, user_id=current_user.id, password=unlock_in.password)

@router.put("/{id}", response_model=JournalEntryResponse)
def api_update_journal(
    id: int,
    update_in: JournalUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update/Edit an existing journal entry (public or private).
    """
    return update_journal_entry(
        db=db, 
        entry_id=id, 
        user_id=current_user.id, 
        text=update_in.text, 
        password=update_in.password
    )

