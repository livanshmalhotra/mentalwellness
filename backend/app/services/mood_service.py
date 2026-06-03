from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.models.models import MoodLog, Recommendation, Notification
from app.schemas.schemas import MoodLogCreate

def create_mood_log(db: Session, mood_in: MoodLogCreate, user_id: int) -> MoodLog:
    db_mood = MoodLog(
        user_id=user_id,
        mood_score=mood_in.mood_score,
        stress_level=mood_in.stress_level,
        sleep_hours=mood_in.sleep_hours,
        productivity_level=mood_in.productivity_level,
        motivation_level=mood_in.motivation_level
    )
    db.add(db_mood)
    db.commit()
    db.refresh(db_mood)
    
    # Process alerts and recommendations based on the log
    process_mood_events(db, db_mood)
    
    return db_mood

def get_mood_history(db: Session, user_id: int, limit: int = 30) -> List[MoodLog]:
    return db.query(MoodLog)\
             .filter(MoodLog.user_id == user_id)\
             .order_by(MoodLog.created_at.desc())\
             .limit(limit)\
             .all()

def process_mood_events(db: Session, mood: MoodLog):
    # 1. Stress level alert
    if mood.stress_level >= 8:
        notification = Notification(
            user_id=mood.user_id,
            type="burnout_alert",
            title="High Stress Level Detected",
            message=f"Your logged stress level is {mood.stress_level}/10. Please take a break and check out our breathing recommendations."
        )
        db.add(notification)
        
        # Add Recommendation
        rec = Recommendation(
            user_id=mood.user_id,
            category="breathing",
            title="4-7-8 Deep Breathing Exercise",
            content="Inhale quietly through your nose for 4 seconds. Hold your breath for 7 seconds. Exhale completely through your mouth making a whoosh sound for 8 seconds. Repeat this cycle 4 times."
        )
        db.add(rec)
        
    # 2. Insufficient Sleep alert
    if mood.sleep_hours < 5.0:
        notification = Notification(
            user_id=mood.user_id,
            type="mood_reminder",
            title="Sleep Deprivation Alert",
            message=f"You slept only {mood.sleep_hours} hours last night. Chronic low sleep increases burnout risk by up to 3x."
        )
        db.add(notification)
        
        # Add Recommendation
        rec = Recommendation(
            user_id=mood.user_id,
            category="break",
            title="Digital Wind-Down Routine",
            content="Turn off all electronic screens (phone, laptop) at least 45 minutes before your targeted bedtime. Dim the lights and read a physical book to signal your brain that it is time to sleep."
        )
        db.add(rec)

    # 3. Motivation or Productivity booster recommendation
    if mood.productivity_level < 4 or mood.motivation_level < 4:
        rec = Recommendation(
            user_id=mood.user_id,
            category="focus",
            title="Pomodoro Focus Strategy",
            content="To bypass low motivation, set a timer for just 20 minutes of study. Promise yourself you can stop after 20 minutes if you want. Often, initiating is the hardest part."
        )
        db.add(rec)
        
    db.commit()
