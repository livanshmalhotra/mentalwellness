from fastapi import APIRouter, Depends
from app.models.models import User
from app.middleware.auth import get_current_user
from app.schemas.schemas import ChatbotRequest, ChatbotResponse

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

@router.post("", response_model=ChatbotResponse)
def api_chatbot(
    payload: ChatbotRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Mental wellness AI chatbot assistant. Provides empathetic support, focus advice, and self-care recommendations.
    """
    msg = payload.message.lower()
    
    # Analyze query content to provide tailored conversational responses
    if any(word in msg for word in ["exam", "test", "study", "grade", "fail", "midterm"]):
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
        
    return ChatbotResponse(response=reply)
