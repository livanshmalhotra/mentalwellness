import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    private_journal_password_hash = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    burnout_predictions = relationship("BurnoutPrediction", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    assessment_profiles = relationship("AssessmentProfile", back_populates="user", cascade="all, delete-orphan")


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mood_score = Column(Integer, nullable=False) # 1 to 10
    stress_level = Column(Integer, nullable=False) # 1 to 10
    energy_level = Column(Integer, nullable=True) # 1 to 10
    sleep_hours = Column(Float, nullable=False)
    sleep_quality = Column(Integer, nullable=True) # 1 to 10
    productivity_level = Column(Integer, nullable=False) # 1 to 10
    motivation_level = Column(Integer, nullable=False) # 1 to 10
    mood_source = Column(String, nullable=True, default="user")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="mood_logs")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    sentiment = Column(String, nullable=False) # positive, negative, neutral
    sentiment_score = Column(Float, nullable=True) # numeric score
    emotion = Column(String, nullable=False) # sadness, joy, love, anger, fear, surprise
    stress_level = Column(Integer, nullable=True) # predicted stress score (1-10)
    is_private = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


    user = relationship("User", back_populates="journal_entries")


class BurnoutPrediction(Base):
    __tablename__ = "burnout_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stress_level = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    productivity_level = Column(Integer, nullable=False)
    motivation_level = Column(Integer, nullable=False)
    burnout_risk = Column(String, nullable=False) # Low, Medium, High
    burnout_score = Column(Float, nullable=True) # numerical probability
    explainability = Column(Text, nullable=True) # JSON details of weights / explanations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="burnout_predictions")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False) # breathing, focus, break, exercise, activity
    content = Column(Text, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # burnout_alert, mood_reminder, journal_reminder
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AssessmentProfile(Base):
    __tablename__ = "assessment_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Raw TIPI responses (Q1-Q10, scale 1-7)
    tipi_q1 = Column(Integer, nullable=False)
    tipi_q2 = Column(Integer, nullable=False)
    tipi_q3 = Column(Integer, nullable=False)
    tipi_q4 = Column(Integer, nullable=False)
    tipi_q5 = Column(Integer, nullable=False)
    tipi_q6 = Column(Integer, nullable=False)
    tipi_q7 = Column(Integer, nullable=False)
    tipi_q8 = Column(Integer, nullable=False)
    tipi_q9 = Column(Integer, nullable=False)
    tipi_q10 = Column(Integer, nullable=False)

    # Raw BRS responses (Q11-Q16, scale 1-5)
    brs_q1 = Column(Integer, nullable=False)  # Q11
    brs_q2 = Column(Integer, nullable=False)  # Q12
    brs_q3 = Column(Integer, nullable=False)  # Q13
    brs_q4 = Column(Integer, nullable=False)  # Q14
    brs_q5 = Column(Integer, nullable=False)  # Q15
    brs_q6 = Column(Integer, nullable=False)  # Q16

    # Computed personality traits (percentages 0-100)
    extraversion = Column(Float, nullable=False)
    agreeableness = Column(Float, nullable=False)
    conscientiousness = Column(Float, nullable=False)
    emotional_stability = Column(Float, nullable=False)
    openness = Column(Float, nullable=False)

    # Computed resilience
    resilience_score = Column(Float, nullable=False)
    resilience_level = Column(String, nullable=False)  # Low, Moderate, High

    initial_wellness_score = Column(Float, nullable=True)
    initial_burnout_risk = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)  # For archiving on retake
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessment_profiles")
