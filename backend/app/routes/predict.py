from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import BurnoutPredictionResponse, EmotionPredictionResponse
from app.services.prediction_service import run_burnout_prediction
from app.utils.ml_helpers import predict_emotion

router = APIRouter(prefix="/api/predict", tags=["prediction"])

@router.get("/burnout", response_model=BurnoutPredictionResponse)
def api_predict_burnout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers an AI-powered burnout risk assessment using the student's latest mood/productivity logs.
    """
    return run_burnout_prediction(db=db, user_id=current_user.id)

@router.get("/emotion", response_model=EmotionPredictionResponse)
def api_predict_emotion(
    text: str = Query(..., min_length=2, description="The text to analyze for emotions"),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze raw text using the NLP model to detect underlying emotions (sadness, joy, love, anger, fear, surprise).
    """
    try:
        res = predict_emotion(text)
        return EmotionPredictionResponse(
            text=text,
            emotion=res["emotion"],
            confidence=res["confidence"],
            all_scores=res["all_scores"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP Emotion Prediction failed: {str(e)}")
