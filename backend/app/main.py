import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine, Base, run_migrations
from app.routes import auth, mood, journal, predict, analytics, chatbot, recommendations, notifications, assessment

# Run database migrations
run_migrations()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Student Burnout & Mental Wellness Intelligence System",
    description="Backend API for student wellness tracker, journal NLP processing, and burnout forecasting",
    version="1.0.0"
)

# CORS Configuration for React Frontend
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"                       # Allow all for development flexibility
]

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
