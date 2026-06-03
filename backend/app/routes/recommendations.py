from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.models import User, Recommendation
from app.middleware.auth import get_current_user
from app.schemas.schemas import RecommendationResponse

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def api_get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve active AI wellness recommendations for the student.
    """
    return db.query(Recommendation)\
             .filter(Recommendation.user_id == current_user.id)\
             .order_by(Recommendation.created_at.desc())\
             .all()

@router.put("/{rec_id}/complete", response_model=RecommendationResponse)
def api_complete_recommendation(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a wellness recommendation as completed.
    """
    rec = db.query(Recommendation)\
            .filter(Recommendation.id == rec_id, Recommendation.user_id == current_user.id)\
            .first()
            
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found."
        )
        
    rec.completed = True
    db.commit()
    db.refresh(rec)
    return rec
