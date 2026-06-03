from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.models.models import JournalEntry, Recommendation, Notification
from app.schemas.schemas import JournalEntryCreate
from app.utils.ml_helpers import predict_emotion, predict_sentiment

def create_journal_entry(db: Session, journal_in: JournalEntryCreate, user_id: int) -> JournalEntry:
    # Run NLP Inference
    sentiment_result = predict_sentiment(journal_in.text)
    emotion_result = predict_emotion(journal_in.text)
    
    db_entry = JournalEntry(
        user_id=user_id,
        text=journal_in.text,
        sentiment=sentiment_result["sentiment"],
        sentiment_score=sentiment_result["confidence"],
        emotion=emotion_result["emotion"],
        stress_level=sentiment_result["stress_level"]
    )
    
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Process notifications or recommendations based on NLP results
    process_journal_nlp_events(db, db_entry)
    
    return db_entry

def get_journal_history(db: Session, user_id: int, limit: int = 30) -> List[JournalEntry]:
    return db.query(JournalEntry)\
             .filter(JournalEntry.user_id == user_id)\
             .order_by(JournalEntry.created_at.desc())\
             .limit(limit)\
             .all()

def process_journal_nlp_events(db: Session, entry: JournalEntry):
    # If negative sentiment combined with fear/sadness/anger
    if entry.sentiment == "negative" and entry.emotion in ["sadness", "anger", "fear"]:
        notification = Notification(
            user_id=entry.user_id,
            type="journal_reminder",
            title=f"Emotional Drift Detected: {entry.emotion.capitalize()}",
            message=f"Your journal analysis indicates elevated feelings of {entry.emotion}. Remember that you are not alone and can access university support resources."
        )
        db.add(notification)
        
        # Recommendations tailored to emotion
        if entry.emotion == "sadness":
            rec = Recommendation(
                user_id=entry.user_id,
                category="activity",
                title="Social Connection Walk",
                content="Reach out to a classmate or friend for a 15-minute walk. Physical movement and casual social contact are scientifically shown to help combat feelings of sadness."
            )
            db.add(rec)
        elif entry.emotion == "anger":
            rec = Recommendation(
                user_id=entry.user_id,
                category="exercise",
                title="Physical Release Action",
                content="Engage in a 10-minute high-intensity cardio burst or go to the gym to safely release physical tension associated with frustration or anger."
            )
            db.add(rec)
        elif entry.emotion == "fear":
            rec = Recommendation(
                user_id=entry.user_id,
                category="breathing",
                title="Grounding 5-4-3-2-1 Technique",
                content="Acknowledge 5 things you can see around you, 4 things you can physically touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings you back into the present moment."
            )
            db.add(rec)
            
    db.commit()
