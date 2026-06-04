import json
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from fastapi import HTTPException, status

from app.models.models import JournalEntry, Recommendation, Notification, User
from app.schemas.schemas import JournalEntryCreate
from app.utils.ml_helpers import predict_emotion, predict_sentiment
from app.utils.security import encrypt_text, decrypt_text, verify_password, get_password_hash

def create_journal_entry(db: Session, journal_in: JournalEntryCreate, user_id: int) -> JournalEntry:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    sentiment_result = predict_sentiment(journal_in.text)
    emotion_result = predict_emotion(journal_in.text)
    
    is_private = journal_in.is_private
    
    if is_private:
        if not journal_in.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passcode is required for private journal entries"
            )
        # If user has not created a passcode yet, set it
        if not user.private_journal_password_hash:
            user.private_journal_password_hash = get_password_hash(journal_in.password)
            db.add(user)
            db.commit()
        else:
            # Verify passcode
            if not verify_password(journal_in.password, user.private_journal_password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect passcode"
                )
                
        # Encrypt the full JSON payload
        payload = {
            "text": journal_in.text,
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["confidence"],
            "emotion": emotion_result["emotion"],
            "stress_level": sentiment_result["stress_level"]
        }
        encrypted_text = encrypt_text(json.dumps(payload), journal_in.password)
        
        db_entry = JournalEntry(
            user_id=user_id,
            text=encrypted_text,
            sentiment=sentiment_result["sentiment"],
            sentiment_score=sentiment_result["confidence"],
            emotion=emotion_result["emotion"],
            stress_level=sentiment_result["stress_level"],
            is_private=True
        )
    else:
        db_entry = JournalEntry(
            user_id=user_id,
            text=journal_in.text,
            sentiment=sentiment_result["sentiment"],
            sentiment_score=sentiment_result["confidence"],
            emotion=emotion_result["emotion"],
            stress_level=sentiment_result["stress_level"],
            is_private=False
        )
        
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Process notifications/recommendations ONLY for public journals
    if not is_private:
        process_journal_nlp_events(db, db_entry)
        
    if is_private:
        db.expunge(db_entry)
        db_entry.text = "Private 🔒"
        db_entry.sentiment = "private"
        db_entry.sentiment_score = None
        db_entry.emotion = "private"
        db_entry.stress_level = None
        
    return db_entry

def get_journal_history(db: Session, user_id: int, limit: int = 30) -> List[JournalEntry]:
    entries = db.query(JournalEntry)\
                 .filter(JournalEntry.user_id == user_id)\
                 .order_by(JournalEntry.created_at.desc())\
                 .limit(limit)\
                 .all()
    # Expunge to prevent changes from being written back, then replace ciphertext
    for entry in entries:
        if entry.is_private:
            db.expunge(entry)
            entry.text = "Private 🔒"
            entry.sentiment = "private"
            entry.sentiment_score = None
            entry.emotion = "private"
            entry.stress_level = None
    return entries

def unlock_journal_entry(db: Session, entry_id: int, user_id: int, password: str) -> dict:
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
        
    if not entry.is_private:
        return {
            "id": entry.id,
            "user_id": entry.user_id,
            "text": entry.text,
            "sentiment": entry.sentiment,
            "sentiment_score": entry.sentiment_score,
            "emotion": entry.emotion,
            "stress_level": entry.stress_level,
            "is_private": False,
            "created_at": entry.created_at
        }
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.private_journal_password_hash:
        raise HTTPException(status_code=400, detail="Private passcode is not set up")
        
    if not verify_password(password, user.private_journal_password_hash):
        raise HTTPException(status_code=401, detail="Incorrect Password")
        
    try:
        decrypted_payload = decrypt_text(entry.text, password)
        payload = json.loads(decrypted_payload)
        return {
            "id": entry.id,
            "user_id": entry.user_id,
            "text": payload["text"],
            "sentiment": payload["sentiment"],
            "sentiment_score": payload["sentiment_score"],
            "emotion": payload["emotion"],
            "stress_level": payload["stress_level"],
            "is_private": True,
            "created_at": entry.created_at
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Decryption failed. Please verify your passcode.")

def update_journal_entry(db: Session, entry_id: int, user_id: int, text: str, password: str = None) -> dict:
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
        
    sentiment_result = predict_sentiment(text)
    emotion_result = predict_emotion(text)
    
    if entry.is_private:
        if not password:
            raise HTTPException(status_code=400, detail="Passcode is required to edit private journals")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.private_journal_password_hash:
            raise HTTPException(status_code=400, detail="Private passcode is not set up")
            
        if not verify_password(password, user.private_journal_password_hash):
            raise HTTPException(status_code=401, detail="Incorrect Password")
            
        payload = {
            "text": text,
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["confidence"],
            "emotion": emotion_result["emotion"],
            "stress_level": sentiment_result["stress_level"]
        }
        encrypted_text = encrypt_text(json.dumps(payload), password)
        entry.text = encrypted_text
        entry.sentiment = sentiment_result["sentiment"]
        entry.sentiment_score = sentiment_result["confidence"]
        entry.emotion = emotion_result["emotion"]
        entry.stress_level = sentiment_result["stress_level"]
    else:
        entry.text = text
        entry.sentiment = sentiment_result["sentiment"]
        entry.sentiment_score = sentiment_result["confidence"]
        entry.emotion = emotion_result["emotion"]
        entry.stress_level = sentiment_result["stress_level"]
        
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "text": text,
        "sentiment": sentiment_result["sentiment"],
        "sentiment_score": sentiment_result["confidence"],
        "emotion": emotion_result["emotion"],
        "stress_level": sentiment_result["stress_level"],
        "is_private": entry.is_private,
        "created_at": entry.created_at
    }


def process_journal_nlp_events(db: Session, entry: JournalEntry):
    # Fetch assessment profile
    from app.models.models import AssessmentProfile
    profile = db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == entry.user_id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()

    # If negative sentiment combined with fear/sadness/anger
    if entry.sentiment == "negative" and entry.emotion in ["sadness", "anger", "fear"]:
        notification = Notification(
            user_id=entry.user_id,
            type="journal_reminder",
            title=f"Emotional Drift Detected: {entry.emotion.capitalize()}",
            message=f"Your journal analysis indicates elevated feelings of {entry.emotion}. Remember that you are not alone and can access university support resources."
        )
        db.add(notification)
        
        # Recommendations tailored to emotion and personality baseline
        if entry.emotion == "sadness":
            if profile and profile.extraversion < 40:
                rec = Recommendation(
                    user_id=entry.user_id,
                    category="break",
                    title="Solo Self-Care Reflection",
                    content="Your journal suggests sadness, and your introverted traits mean you recharge best in quiet settings. Plan a quiet evening doing something you love (reading, hot bath, listening to music) to restore emotional balance."
                )
            else:
                rec = Recommendation(
                    user_id=entry.user_id,
                    category="activity",
                    title="Social Connection Walk",
                    content="Reach out to a classmate or friend for a 15-minute walk. Physical movement and casual social contact are scientifically shown to help combat feelings of sadness."
                )
            db.add(rec)
        elif entry.emotion == "anger":
            if profile and profile.emotional_stability < 40:
                rec = Recommendation(
                    user_id=entry.user_id,
                    category="breathing",
                    title="Mindful Reset for Stability",
                    content="Frustration detected. Given your sensitivity to emotional shifts, try a 10-minute grounding breathing session: close your eyes and focus purely on the flow of your breath to release physical anger."
                )
            else:
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
            
        # Additional recommendation if resilience is low or conscientiousness is high
        if profile:
            if profile.resilience_level == "Low":
                rec_res = Recommendation(
                    user_id=entry.user_id,
                    category="activity",
                    title="Resilience Anchor: Compassionate Self-Talk",
                    content="Your lower resilience baseline combined with current distress can amplify stress. Speak to yourself with the same kindness you'd show a friend. Acknowledge that having a tough day is okay."
                )
                db.add(rec_res)
            elif profile.conscientiousness > 75:
                rec_cons = Recommendation(
                    user_id=entry.user_id,
                    category="break",
                    title="Enforcing Study Boundaries",
                    content="Your high conscientiousness makes you prone to overworking, especially when stressed. Put away all coursework for the rest of today and commit to pure recovery."
                )
                db.add(rec_cons)
                
    db.commit()
