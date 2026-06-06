import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load DATABASE_URL from environment or fallback to local PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:wellnesspassword@localhost:5432/student_wellness")

# SQLite needs special connection arguments to avoid multi-thread errors in FastAPI
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Check if users already has private_journal_password_hash
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN private_journal_password_hash VARCHAR;"))
            db.commit()
            print("Migration: Added private_journal_password_hash column to users.")
        except Exception:
            db.rollback()
            
        # Check if journal_entries already has is_private
        try:
            db.execute(text("ALTER TABLE journal_entries ADD COLUMN is_private BOOLEAN DEFAULT FALSE;"))
            db.commit()
            print("Migration: Added is_private column to journal_entries.")
        except Exception:
            db.rollback()

        # Add onboarding_completed to users
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;"))
            db.commit()
            print("Migration: Added onboarding_completed column to users.")
        except Exception:
            db.rollback()

        # Add energy_level to mood_logs
        try:
            db.execute(text("ALTER TABLE mood_logs ADD COLUMN energy_level INTEGER;"))
            db.commit()
            print("Migration: Added energy_level column to mood_logs.")
        except Exception:
            db.rollback()

        # Add sleep_quality to mood_logs
        try:
            db.execute(text("ALTER TABLE mood_logs ADD COLUMN sleep_quality INTEGER;"))
            db.commit()
            print("Migration: Added sleep_quality column to mood_logs.")
        except Exception:
            db.rollback()

        # Add mood_source to mood_logs
        try:
            db.execute(text("ALTER TABLE mood_logs ADD COLUMN mood_source VARCHAR DEFAULT 'user';"))
            db.commit()
            print("Migration: Added mood_source column to mood_logs.")
        except Exception:
            db.rollback()

        # Add initial_wellness_score to assessment_profiles
        try:
            db.execute(text("ALTER TABLE assessment_profiles ADD COLUMN initial_wellness_score FLOAT;"))
            db.commit()
            print("Migration: Added initial_wellness_score column to assessment_profiles.")
        except Exception:
            db.rollback()

        # Add initial_burnout_risk to assessment_profiles
        try:
            db.execute(text("ALTER TABLE assessment_profiles ADD COLUMN initial_burnout_risk VARCHAR;"))
            db.commit()
            print("Migration: Added initial_burnout_risk column to assessment_profiles.")
        except Exception:
            db.rollback()
    finally:
        db.close()

