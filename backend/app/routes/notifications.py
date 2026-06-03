from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User, Notification
from app.middleware.auth import get_current_user
from app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
def api_get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all wellness notifications/alerts for the student.
    """
    return db.query(Notification)\
             .filter(Notification.user_id == current_user.id)\
             .order_by(Notification.created_at.desc())\
             .all()

@router.put("/{notif_id}/read", response_model=NotificationResponse)
def api_mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    """
    notif = db.query(Notification)\
              .filter(Notification.id == notif_id, Notification.user_id == current_user.id)\
              .first()
              
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
        
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif
