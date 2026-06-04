from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Assessment Schemas ---
class AssessmentSubmit(BaseModel):
    tipi_responses: List[int] = Field(..., min_length=10, max_length=10)  # Q1-Q10, each 1-7
    brs_responses: List[int] = Field(..., min_length=6, max_length=6)    # Q11-Q16, each 1-5

class AssessmentProfileResponse(BaseModel):
    id: int
    extraversion: float
    agreeableness: float
    conscientiousness: float
    emotional_stability: float
    openness: float
    resilience_score: float
    resilience_level: str
    initial_wellness_score: Optional[float] = None
    initial_burnout_risk: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OnboardingStatusResponse(BaseModel):
    onboarding_completed: bool


# --- Mood Schemas ---
class MoodLogCreate(BaseModel):
    mood_score: int = Field(..., ge=1, le=10)
    stress_level: int = Field(..., ge=1, le=10)
    energy_level: int = Field(..., ge=1, le=10)
    sleep_hours: float = Field(..., ge=0, le=24)
    sleep_quality: int = Field(..., ge=1, le=10)
    productivity_level: int = Field(..., ge=1, le=10)
    motivation_level: int = Field(..., ge=1, le=10)

class MoodLogResponse(BaseModel):
    id: int
    user_id: int
    mood_score: int
    stress_level: int
    energy_level: Optional[int] = None
    sleep_hours: float
    sleep_quality: Optional[int] = None
    productivity_level: int
    motivation_level: int
    mood_source: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Journal Schemas ---
class JournalEntryCreate(BaseModel):
    text: str = Field(..., min_length=2)
    is_private: bool = False
    password: Optional[str] = None

class JournalEntryResponse(BaseModel):
    id: int
    user_id: int
    text: str
    sentiment: str
    sentiment_score: Optional[float] = None
    emotion: str
    stress_level: Optional[int] = None
    is_private: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class PasscodeRequest(BaseModel):
    passcode: str = Field(..., min_length=4)

class JournalUnlockRequest(BaseModel):
    password: str

class JournalUpdateRequest(BaseModel):
    text: str = Field(..., min_length=2)
    password: Optional[str] = None



# --- Prediction Schemas ---
class BurnoutPredictionResponse(BaseModel):
    id: int
    user_id: int
    stress_level: int
    sleep_hours: float
    productivity_level: int
    motivation_level: int
    burnout_risk: str
    burnout_score: Optional[float] = None
    explainability: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmotionPredictionResponse(BaseModel):
    text: str
    emotion: str
    confidence: float
    all_scores: Dict[str, float]


# --- Recommendation Schemas ---
class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    content: str
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chatbot Schemas ---
class ChatbotRequest(BaseModel):
    message: str

class ChatbotResponse(BaseModel):
    response: str
