from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, Any, List

from app.models.models import MoodLog, JournalEntry, BurnoutPrediction, Notification

def get_dashboard_analytics(db: Session, user_id: int) -> Dict[str, Any]:
    # 1. Fetch data
    moods = db.query(MoodLog).filter(MoodLog.user_id == user_id).order_by(MoodLog.created_at.desc()).limit(10).all()
    journals = db.query(JournalEntry).filter(JournalEntry.user_id == user_id).order_by(JournalEntry.created_at.desc()).limit(10).all()
    latest_pred = db.query(BurnoutPrediction).filter(BurnoutPrediction.user_id == user_id).order_by(BurnoutPrediction.created_at.desc()).first()
    
    # Reverse mood list for chronological chart display
    mood_list = list(reversed(moods))
    journal_list = list(reversed(journals))
    
    # 2. Compute Wellness Score (0 to 100)
    # Built from mood_score (30%), sleep_hours (30%), stress_level (20%), and productivity (20%)
    wellness_score = 75.0 # Default benchmark
    if moods:
        avg_mood = sum(m.mood_score for m in moods) / len(moods) # range 1-5
        avg_sleep = sum(m.sleep_hours for m in moods) / len(moods) # range 0-24, target 8.0
        avg_stress = sum(m.stress_level for m in moods) / len(moods) # range 1-10 (lower is better)
        avg_prod = sum(m.productivity_level for m in moods) / len(moods) # range 1-10
        
        # Scale scores
        mood_component = (avg_mood / 5.0) * 30.0
        sleep_component = min(1.0, (avg_sleep / 8.0)) * 30.0
        stress_component = ((10.0 - avg_stress) / 9.0) * 20.0 # invert stress
        prod_component = (avg_prod / 10.0) * 20.0
        
        wellness_score = round(mood_component + sleep_component + stress_component + prod_component, 1)
        
    # 3. Burnout Risk
    burnout_risk = "Low"
    burnout_score = 0.15
    explainability = "Insufficient data to calculate risks."
    if latest_pred:
        burnout_risk = latest_pred.burnout_risk
        burnout_score = latest_pred.burnout_score
        explainability = latest_pred.explainability
    elif moods:
        # Generate inline assessment if no saved prediction exists yet
        from app.utils.ml_helpers import predict_burnout
        m = moods[0]
        pred_res = predict_burnout(m.stress_level, m.sleep_hours, m.productivity_level, m.motivation_level)
        burnout_risk = pred_res["risk"]
        burnout_score = pred_res["score"]
        explainability = pred_res["explainability"]

    # 4. Behavioral Drift Detection
    drifts = []
    
    # Drift 1: Productivity decline
    if len(moods) >= 5:
        recent_prod = sum(m.productivity_level for m in moods[:2]) / 2
        older_prod = sum(m.productivity_level for m in moods[2:5]) / 3
        if older_prod - recent_prod >= 2.0:
            drifts.append({
                "type": "productivity_decline",
                "severity": "Medium",
                "title": "Productivity Slide Detected",
                "detail": f"Your average productivity level has dropped from {older_prod:.1f} to {recent_prod:.1f} in the past few logs."
            })
            
    # Drift 2: Emotional drift (Journals consistently negative)
    if len(journals) >= 3:
        recent_sentiments = [j.sentiment for j in journals[:3]]
        if all(s == "negative" for s in recent_sentiments):
            drifts.append({
                "type": "emotional_drift",
                "severity": "High",
                "title": "Persistent Negative Mood Pattern",
                "detail": "Your last three journal entries indicate a negative emotional state. Consider taking a restorative break."
            })
            
    # Drift 3: Sleep decline
    if len(moods) >= 4:
        recent_sleep = sum(m.sleep_hours for m in moods[:2]) / 2
        older_sleep = sum(m.sleep_hours for m in moods[2:4]) / 2
        if older_sleep - recent_sleep >= 1.5:
            drifts.append({
                "type": "sleep_decline",
                "severity": "High",
                "title": "Sleep Hours Dropping",
                "detail": f"Your nightly sleep average dropped from {older_sleep:.1f} to {recent_sleep:.1f} hours."
            })
            
    # Drift 4: Inactivity pattern
    if moods:
        last_log_date = moods[0].created_at
        days_passed = (datetime.utcnow() - last_log_date).days
        if days_passed >= 3:
            drifts.append({
                "type": "inactivity",
                "severity": "Low",
                "title": "Inactivity Detected",
                "detail": f"You haven't logged your wellness metrics in the last {days_passed} days. Consistent tracking helps build healthy habits."
            })
    else:
        drifts.append({
            "type": "inactivity",
            "severity": "Medium",
            "title": "No Mood Entries Found",
            "detail": "Start tracking your wellness metrics daily to activate burnout predictions and detailed charts."
        })

    # 5. Weekly summary string
    weekly_summary = "Your wellness status is stable. Keep logging your mood and thoughts to gather more insights."
    if drifts:
        high_alerts = [d["title"] for d in drifts if d["severity"] == "High"]
        if high_alerts:
            weekly_summary = f"Attention needed: We have flagged potential concerns ({', '.join(high_alerts)}). Focus on resting and prioritizing self-care."
        else:
            weekly_summary = "Wellness metrics are slightly drifting, but overall manageable. Maintain your scheduled breaks."

    # 6. Assemble Chart Data
    trend_data = []
    for m in mood_list:
        trend_data.append({
            "date": m.created_at.strftime("%b %d"),
            "mood": m.mood_score,
            "stress": m.stress_level,
            "sleep": m.sleep_hours,
            "productivity": m.productivity_level,
            "motivation": m.motivation_level
        })
        
    timeline_data = []
    for j in journal_list:
        timeline_data.append({
            "date": j.created_at.strftime("%b %d %H:%M"),
            "sentiment": j.sentiment,
            "emotion": j.emotion,
            "stress": j.stress_level,
            "snippet": j.text[:60] + "..." if len(j.text) > 60 else j.text
        })

    return {
        "wellness_score": wellness_score,
        "burnout_risk": burnout_risk,
        "burnout_score": round(float(burnout_score), 2) if burnout_score else 0.0,
        "explainability": explainability,
        "weekly_summary": weekly_summary,
        "drifts": drifts,
        "trends": trend_data,
        "timeline": timeline_data
    }
