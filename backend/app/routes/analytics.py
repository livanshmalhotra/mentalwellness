from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def api_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated dashboard analytics, including wellness score, burnout risk, behavioral drift alerts, and weekly summary.
    """
    return get_dashboard_analytics(db=db, user_id=current_user.id)

@router.get("/trends")
def api_trends_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trends chart data for advanced analytics view.
    """
    data = get_dashboard_analytics(db=db, user_id=current_user.id)
    return {
        "trends": data["trends"],
        "timeline": data["timeline"]
    }
