import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.utils.limiter import limiter

from app.database.session import engine, Base, run_migrations
from app.routes import auth, mood, journal, predict, analytics, chatbot, recommendations, notifications, assessment
import os

env = os.getenv("ENV", "development")

if env != "production":
    # Run database migrations for development
    run_migrations()
    # Initialize Database tables
    Base.metadata.create_all(bind=engine)
else:
    print("Production environment: Skipping auto-migrations and metadata.create_all. Run migrations using Alembic.")

app = FastAPI(
    title="AI-Powered Student Burnout & Mental Wellness Intelligence System",
    description="Backend API for student wellness tracker, journal NLP processing, and burnout forecasting",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration for React Frontend
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ]
    if env != "production":
        origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routes
app.include_router(auth.router)
app.include_router(mood.router)
app.include_router(journal.router)
app.include_router(predict.router)
app.include_router(analytics.router)
app.include_router(chatbot.router)
app.include_router(recommendations.router)
app.include_router(notifications.router)
app.include_router(assessment.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI-Powered Predictive Burnout & Mental Wellness API is running."
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
