import os
import sys
from dotenv import load_dotenv

# Load environmental variables from .env
load_dotenv()

# Add backend root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal, Base
from sqlalchemy import text

def migrate_database():
    print("Starting database schema migration...")
    
    # Verify the DATABASE_URL points to Supabase
    db_url = os.getenv("DATABASE_URL", "")
    if "supabase" not in db_url and "localhost" not in db_url:
        print(f"Warning: DATABASE_URL doesn't look like Supabase or Localhost. URL: {db_url}")
        
    db = SessionLocal()
    try:
        # 1. Drop existing tables in reverse-dependency order
        tables_to_drop = [
            "mood_logs",
            "journal_entries",
            "burnout_predictions",
            "recommendations",
            "notifications",
            "assessment_profiles",
            "users"
        ]
        
        print("Dropping existing tables to convert primary and foreign key constraints...")
        for table in tables_to_drop:
            try:
                db.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
                db.commit()
                print(f" - Dropped table: {table}")
            except Exception as e:
                db.rollback()
                print(f" - Error dropping table {table}: {e}")
                
        # 2. Recreate all tables using updated SQLAlchemy schemas
        print("Recreating database tables with updated String UUID keys...")
        Base.metadata.create_all(bind=engine)
        print("Success: All database tables recreated successfully.")
        
    except Exception as e:
        print(f"Fatal migration error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()
