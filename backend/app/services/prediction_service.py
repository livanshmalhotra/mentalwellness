from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.models.models import MoodLog, BurnoutPrediction, Notification, AssessmentProfile, JournalEntry
from app.utils.ml_helpers import predict_burnout

def run_burnout_prediction(db: Session, user_id: int) -> BurnoutPrediction:
    # Get the latest mood log of the user, prioritizing user-reported logs
    latest_mood = db.query(MoodLog)\
                    .filter(MoodLog.user_id == user_id, MoodLog.mood_source != "onboarding_assessment")\
                    .order_by(MoodLog.created_at.desc())\
                    .first()
                    
    if not latest_mood:
        latest_mood = db.query(MoodLog)\
                        .filter(MoodLog.user_id == user_id)\
                        .order_by(MoodLog.created_at.desc())\
                        .first()
                    
    if not latest_mood:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No mood logs found. Please log your mood at least once before requesting burnout prediction."
        )
        
    # 1. Fetch active assessment profile
    profile = db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == user_id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()
    
    # 2. Fetch latest public journal entry in the last 48 hours
    cutoff_time = datetime.utcnow() - timedelta(hours=48)
    latest_journal = db.query(JournalEntry).filter(
        JournalEntry.user_id == user_id,
        JournalEntry.is_private == False,
        JournalEntry.created_at >= cutoff_time
    ).order_by(JournalEntry.created_at.desc()).first()
    
    # Integrate journal stress if present
    input_stress_level = latest_mood.stress_level
    if latest_journal and latest_journal.stress_level is not None:
        # Weighted average: 60% mood log stress, 40% journal stress
        input_stress_level = round(0.6 * latest_mood.stress_level + 0.4 * latest_journal.stress_level)
        input_stress_level = max(1, min(10, input_stress_level))
        
    # Make prediction using the ML model
    pred_res = predict_burnout(
        stress_level=input_stress_level,
        sleep_hours=latest_mood.sleep_hours,
        productivity_level=latest_mood.productivity_level,
        motivation_level=latest_mood.motivation_level,
        study_hours=5.0, # default average study hours
        extracurricular_hours=2.0 # default average extracurricular hours
    )
    
    risk = pred_res["risk"]
    score = pred_res["score"]
    explainability = pred_res["explainability"]
    
    extra_explanations = []
    
    # Adjust based on resilience baseline
    if profile:
        if profile.resilience_level == "Low":
            score += 0.15
            extra_explanations.append("Low resilience baseline increases vulnerability to stressors.")
            if risk == "Low":
                risk = "Medium"
            elif risk == "Medium":
                risk = "High"
        elif profile.resilience_level == "High":
            score -= 0.10
            extra_explanations.append("High resilience baseline provides protection against exhaustion.")
            if risk == "High":
                risk = "Medium"
            elif risk == "Medium":
                risk = "Low"
                
        # Adjust based on Emotional Stability
        if profile.emotional_stability < 35:
            score += 0.10
            extra_explanations.append("Sensitivity to emotional shifts increases academic fatigue risk.")
            if risk == "Low" and score > 0.5:
                risk = "Medium"
                
        # Adjust based on Conscientiousness (extremely high = high pressure)
        if profile.conscientiousness > 80 and input_stress_level >= 7:
            score += 0.05
            extra_explanations.append("High conscientiousness can lead to self-imposed pressure.")
            
    # Adjust based on journal sentiment
    if latest_journal:
        if latest_journal.sentiment == "negative":
            score += 0.10
            extra_explanations.append(f"Recent writing indicates negative sentiment and feelings of {latest_journal.emotion}.")
            if risk == "Low" and score > 0.5:
                risk = "Medium"
            elif risk == "Medium" and score > 0.75:
                risk = "High"
        elif latest_journal.sentiment == "positive":
            score -= 0.08
            extra_explanations.append("Recent writing reflects positive sentiment, reducing stress load.")
            if risk == "High":
                risk = "Medium"
            elif risk == "Medium" and score < 0.4:
                risk = "Low"
                
    score = max(0.01, min(0.99, round(score, 2)))
    
    if extra_explanations:
        explainability = explainability + " | " + " ".join(extra_explanations)
    
    db_pred = BurnoutPrediction(
        user_id=user_id,
        stress_level=latest_mood.stress_level,
        sleep_hours=latest_mood.sleep_hours,
        productivity_level=latest_mood.productivity_level,
        motivation_level=latest_mood.motivation_level,
        burnout_risk=risk,
        burnout_score=score,
        explainability=explainability
    )
    
    db.add(db_pred)
    
    # Trigger urgent notification if burnout risk is High
    if risk == "High":
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
