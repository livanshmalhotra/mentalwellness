from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.models import User, JournalEntry
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.schemas.schemas import ChatbotRequest, ChatbotResponse

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

@router.post("", response_model=ChatbotResponse)
def api_chatbot(
    payload: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mental wellness AI chatbot assistant. Provides empathetic support, focus advice, and self-care recommendations.
    Uses recent journal analytics (both public and private) to silently customize empathy in responses.
    """
    msg = payload.message.lower()
    
    # Query recent journals for silent context
    journals = db.query(JournalEntry)\
                 .filter(JournalEntry.user_id == current_user.id)\
                 .order_by(JournalEntry.created_at.desc())\
                 .limit(5)\
                 .all()
                  
    # Query assessment profile for personality-aware chatbot alignment
    from app.models.models import AssessmentProfile
    profile = db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == current_user.id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()
    
    empathy_prefix = ""
    if journals:
        recent_negatives = [j for j in journals if j.sentiment == "negative"]
        if recent_negatives:
            emotions = [j.emotion for j in recent_negatives if j.emotion in ["sadness", "fear", "anger"]]
            dominant_emotion = max(set(emotions), key=emotions.count) if emotions else None
            
            if dominant_emotion == "sadness":
                empathy_prefix = "I've sensed that you might have been feeling a bit low or sad recently. Please remember to be gentle with yourself. "
            elif dominant_emotion == "fear":
                empathy_prefix = "I've noticed some feelings of worry or stress in your recent patterns. Let's try to focus on what you can control right now. "
            elif dominant_emotion == "anger":
                empathy_prefix = "I've detected a bit of frustration or tension in your recent records. I'm here to listen if you want to vent. "
            else:
                empathy_prefix = "I've noticed your recent wellness patterns have been a bit heavy or stressful. Let's take a deep breath together. "

    personality_suffix = ""
    if profile:
        if profile.conscientiousness > 75 and any(word in msg for word in ["study", "exam", "grade", "fail", "stress", "exhausted", "work"]):
            personality_suffix = " (Since your baseline indicates high conscientiousness, remember that scheduled rest is just as productive as study hours—try not to overwork yourself.)"
        elif profile.emotional_stability < 35 and any(word in msg for word in ["sad", "depressed", "anxious", "stress", "cry", "panic"]):
            personality_suffix = " (With your emotional sensitivity baseline, intense swings are completely natural. Take a few slow breaths to ground your nervous system.)"
        elif profile.extraversion < 40 and any(word in msg for word in ["sad", "lonely", "unhappy", "tired"]):
            personality_suffix = " (As an introvert, you recharge best in calm settings. Ensure you allocate solo decompression time this week.)"
        elif profile.extraversion >= 60 and any(word in msg for word in ["sad", "lonely", "unhappy", "tired"]):
            personality_suffix = " (Since you lean extraverted, reaching out to friends or study groups can be a great way to boost your energy.)"

    # Analyze query content to provide tailored conversational responses
    if any(word in msg for word in ["model", "ml", "algorithm", "work", "calculate", "predict", "sentiment", "formula", "score", "under the hood"]):
        reply = (
            "Under the hood, this platform is powered by a dual-engine architecture combining machine learning models with rule-based fallbacks: "
            "1) Burnout Prediction: We run an XGBoost/Random Forest classification model (with a rule-based backup) taking your stress level, sleep hours, productivity, and motivation as inputs. "
            "2) Journal sentiment: We utilize TF-IDF text classification pipelines to predict emotions (sadness, joy, anger, fear, etc.) and sentiment score/polarity from your public journals. "
            "3) Wellness Score: This is a multi-dimensional weighted calculation combining your daily logs (50%), onboarding personality & resilience baseline (20%), recent journal sentiment (10%), and behavioral trends/drifts (20%)."
        )
    elif any(word in msg for word in ["exam", "test", "study", "grade", "fail", "midterm"]):
        reply = (
            f"Hello {current_user.full_name or 'student'}! Academic pressure is highly common. "
            "Try to break down your studying into 25-minute Pomodoro sessions. Focus on completing "
            "one small chunk at a time rather than looking at the entire course. Remember to schedule "
            "5-minute breaks to rest your eyes, and don't forget to write your thoughts down in the Journal tab!"
        )
    elif any(word in msg for word in ["sleep", "insomnia", "tired", "exhausted", "rest"]):
        reply = (
            "I hear you. Sleep is the foundation of mental wellness. If you are struggling to rest, "
            "try to create a wind-down window. Keep all screens turned off for at least 45 minutes "
            "before sleep, and try a slow breathing exercise. Have you logged your sleep hours in "
            "the Mood Tracker today? It helps track if consistency is improving."
        )
    elif any(word in msg for word in ["sad", "depressed", "lonely", "cry", "unhappy"]):
        reply = (
            "I'm really sorry you're feeling this way, but please know you aren't alone. "
            "It can help to express these feelings in writing. Try writing a quick entry in the Journal "
            "module so our sentiment analyzer can help check your emotional timeline. "
            "If it persists, reaching out to friends, family, or student support services is a strong and healthy step."
        )
    elif any(word in msg for word in ["stress", "anxious", "anxiety", "overwhelm", "panic"]):
        reply = (
            "When anxiety or stress peaks, your body enters a fight-or-flight response. "
            "The fastest way to calm your nervous system is slow breathing. I highly recommend trying "
            "the 4-7-8 box breathing routine in the Recommendations tab. Try to do it for just 2 minutes "
            "right now: breathe in 4s, hold 7s, exhale 8s. You can do this!"
        )
    elif any(word in msg for word in ["hello", "hi", "hey"]):
        reply = (
            f"Hello {current_user.full_name or 'there'}! I am your AI mental wellness assistant. "
            "You can tell me how your day is going, ask for advice on exam stress, sleep issues, or how to handle burnout. "
            "How can I help you today?"
        )
    else:
        reply = (
            "Thank you for sharing that with me. Academic life can be demanding, and balancing everything is tough. "
            "Please make sure to prioritize self-care, take frequent breaks, log your mood levels, and write in your journal. "
            "Is there a specific area you are struggling with, like studying, sleeping, or feeling anxious?"
        )
        
    return ChatbotResponse(response=empathy_prefix + reply + personality_suffix)
