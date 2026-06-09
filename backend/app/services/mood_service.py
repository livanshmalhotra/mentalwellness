from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException, status

from app.models.models import MoodLog, Recommendation, Notification, AssessmentProfile, User
from app.schemas.schemas import MoodLogCreate

# Default duplicate submission window in hours
DUPLICATE_WINDOW_HOURS = 4


def _check_duplicate_submission(db: Session, user_id: str):
    """Prevent duplicate submissions within the configurable time window."""
    cutoff = datetime.utcnow() - timedelta(hours=DUPLICATE_WINDOW_HOURS)
    recent = db.query(MoodLog).filter(
        MoodLog.user_id == user_id,
        MoodLog.created_at >= cutoff
    ).first()
    if recent:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You've already logged your mood within the last {DUPLICATE_WINDOW_HOURS} hours. Please try again later."
        )


def _get_user_assessment(db: Session, user_id: str):
    """Fetch user's active assessment profile for personality-aware recommendations."""
    return db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == user_id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()


def create_mood_log(db: Session, mood_in: MoodLogCreate, user_id: str) -> MoodLog:
    # Check for duplicate submission
    _check_duplicate_submission(db, user_id)

    db_mood = MoodLog(
        user_id=user_id,
        mood_score=mood_in.mood_score,
        stress_level=mood_in.stress_level,
        energy_level=mood_in.energy_level,
        sleep_hours=mood_in.sleep_hours,
        sleep_quality=mood_in.sleep_quality if mood_in.sleep_quality is not None else 5,
        productivity_level=mood_in.productivity_level,
        motivation_level=mood_in.motivation_level if mood_in.motivation_level is not None else 5
    )
    db.add(db_mood)
    db.commit()
    db.refresh(db_mood)
    
    # Process alerts and recommendations based on the log
    process_mood_events(db, db_mood)
    
    return db_mood

def get_mood_history(db: Session, user_id: str, limit: int = 30) -> List[MoodLog]:
    return db.query(MoodLog)\
             .filter(MoodLog.user_id == user_id)\
             .order_by(MoodLog.created_at.desc())\
             .limit(limit)\
             .all()

def process_mood_events(db: Session, mood: MoodLog):
    # Fetch assessment profile for personality-aware recommendations
    assessment = _get_user_assessment(db, mood.user_id)

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

        # If user also has low emotional stability, add mindfulness
        if assessment and assessment.emotional_stability < 35:
            rec_mindfulness = Recommendation(
                user_id=mood.user_id,
                category="activity",
                title="Guided Mindfulness Meditation",
                content="Your personality profile indicates sensitivity to emotional fluctuations. Try a 10-minute body scan meditation: lie down comfortably, close your eyes, and slowly bring attention to each part of your body from toes to head, releasing tension as you go."
            )
            db.add(rec_mindfulness)
        
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

    # 3. Low sleep quality
    if mood.sleep_quality and mood.sleep_quality <= 3:
        rec = Recommendation(
            user_id=mood.user_id,
            category="break",
            title="Sleep Environment Optimization",
            content="Your sleep quality is low. Try: keep room temperature at 65-68°F (18-20°C), use blackout curtains, avoid caffeine after 2 PM, and establish a consistent bedtime routine."
        )
        db.add(rec)

    # 4. Motivation or Productivity booster recommendation
    if mood.productivity_level < 4 or mood.motivation_level < 4:
        rec = Recommendation(
            user_id=mood.user_id,
            category="focus",
            title="Pomodoro Focus Strategy",
            content="To bypass low motivation, set a timer for just 20 minutes of study. Promise yourself you can stop after 20 minutes if you want. Often, initiating is the hardest part."
        )
        db.add(rec)

    # 5. Low energy recommendations
    if mood.energy_level and mood.energy_level <= 3:
        rec = Recommendation(
            user_id=mood.user_id,
            category="exercise",
            title="Energizing Movement Break",
            content="Low energy detected. Take a 10-minute walk outside or do 5 minutes of stretching. Physical movement increases blood flow and releases endorphins that naturally boost energy levels."
        )
        db.add(rec)

    # 6. Resilience-based recommendations
    if assessment and assessment.resilience_level == "Low":
        if mood.stress_level >= 6:
            rec = Recommendation(
                user_id=mood.user_id,
                category="activity",
                title="Resilience Building: Cognitive Reframing",
                content="Your resilience baseline is low, so stress may feel amplified. Try cognitive reframing: write down the stressful situation, your automatic negative thought about it, then challenge that thought with evidence-based alternatives. This CBT technique builds mental resilience over time."
            )
            db.add(rec)

    # 7. Low emotional stability + negative mood combo
    if assessment and assessment.emotional_stability < 40 and mood.mood_score <= 4:
        rec = Recommendation(
            user_id=mood.user_id,
            category="activity",
            title="Reflective Journaling Exercise",
            content="Given your emotional profile, reflective journaling can help process feelings. Write about: 1) What happened today, 2) How it made you feel, 3) What you learned, 4) What you're grateful for. This builds emotional awareness and stability."
        )
        db.add(rec)
        
    db.commit()
