from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import AssessmentSubmit, AssessmentProfileResponse, OnboardingStatusResponse
from app.services.assessment_service import (
    submit_assessment,
    get_assessment_profile,
    check_onboarding_status,
    retake_assessment,
)

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


@router.post("/submit", response_model=AssessmentProfileResponse, status_code=status.HTTP_201_CREATED)
def api_submit_assessment(
    data: AssessmentSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit the onboarding assessment (TIPI + BRS).
    Computes personality traits and resilience score, marks onboarding as completed.
    """
    # Prevent double submission if already completed
    if current_user.onboarding_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding assessment has already been completed. Use the retake endpoint to update your baseline."
        )
    return submit_assessment(db=db, user_id=current_user.id, data=data)


@router.get("/profile", response_model=AssessmentProfileResponse)
def api_get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the user's active psychological baseline profile.
    """
    profile = get_assessment_profile(db=db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment profile found. Please complete the onboarding assessment first."
        )
    return profile


@router.get("/status", response_model=OnboardingStatusResponse)
def api_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if the current user has completed the onboarding assessment.
    """
    completed = check_onboarding_status(db=db, user_id=current_user.id)
    return OnboardingStatusResponse(onboarding_completed=completed)


@router.post("/retake", response_model=AssessmentProfileResponse)
def api_retake_assessment(
    data: AssessmentSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retake the baseline assessment. Archives the previous profile and creates a new one.
    """
    return retake_assessment(db=db, user_id=current_user.id, data=data)
