from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, status

from app.models.models import MoodLog, BurnoutPrediction, Notification
from app.utils.ml_helpers import predict_burnout

def run_burnout_prediction(db: Session, user_id: int) -> BurnoutPrediction:
    # Get the latest mood log of the user
    latest_mood = db.query(MoodLog)\
                    .filter(MoodLog.user_id == user_id)\
                    .order_by(MoodLog.created_at.desc())\
                    .first()
                    
    if not latest_mood:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No mood logs found. Please log your mood at least once before requesting burnout prediction."
        )
        
    # Make prediction using the ML model
    pred_res = predict_burnout(
        stress_level=latest_mood.stress_level,
        sleep_hours=latest_mood.sleep_hours,
        productivity_level=latest_mood.productivity_level,
        motivation_level=latest_mood.motivation_level,
        study_hours=5.0, # default average study hours
        extracurricular_hours=2.0 # default average extracurricular hours
    )
    
    db_pred = BurnoutPrediction(
        user_id=user_id,
        stress_level=latest_mood.stress_level,
        sleep_hours=latest_mood.sleep_hours,
        productivity_level=latest_mood.productivity_level,
        motivation_level=latest_mood.motivation_level,
        burnout_risk=pred_res["risk"],
        burnout_score=pred_res["score"],
        explainability=pred_res["explainability"]
    )
    
    db.add(db_pred)
    
    # Trigger urgent notification if burnout risk is High
    if pred_res["risk"] == "High":
        notification = Notification(
            user_id=user_id,
            type="burnout_alert",
            title="Warning: High Burnout Risk",
            message="Our algorithms indicate a high probability of mental exhaustion. Please consider taking a rest day, reviewing your schedule, or talking to a counselor."
        )
        db.add(notification)
        
    db.commit()
    db.refresh(db_pred)
    return db_pred
