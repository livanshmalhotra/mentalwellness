# AI-Powered Predictive Burnout & Mental Wellness Intelligence System for Students

MindShield AI is a comprehensive full-stack application designed to help students track their mental health, analyze personal journals using Natural Language Processing (NLP), identify behavioral drift, and predict burnout risks using Machine Learning classifiers (XGBoost/RandomForest).

---

## Technical Stack

- **Frontend:** React.js (Vite), Tailwind CSS, Recharts, Axios, React Router DOM, Lucide Icons, Framer Motion
- **Backend:** FastAPI, SQLAlchemy, SQLite (local development fallback) / PostgreSQL (production), JWT authentication, Pydantic, Uvicorn
- **AI/ML:** XGBoost, Scikit-learn (TF-IDF vectorizer + LogisticRegression/RandomForest), Pandas, Numpy, Joblib, HuggingFace Transformers

---

## Directory Layout

```
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── database/         # Session engine connections
│   │   ├── models/           # SQLAlchemy schemas (mood_logs, journal, etc.)
│   │   ├── schemas/          # Pydantic input/output validation models
│   │   ├── middleware/       # JWT Authorization middleware
│   │   ├── utils/            # JWT helpers and ML model loaders
│   │   ├── services/         # Business logics (auth, mood, NLP, analytics)
│   │   └── routes/           # REST endpoints
│   ├── requirements.txt      # Backend libraries
│   └── .env                  # Port, JWT keys, Database path
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Router guards, Navbar layouts
│   │   ├── pages/            # Dashboard, Mood, Journal, Analytics, settings
│   │   ├── layouts/          # Responsive Sidebar frame
│   │   ├── services/         # Axios API mappings
│   │   └── index.css         # Custom typography and CSS themes
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json          # Node modules declarations
├── ml_models/                # AI Pipelines
│   ├── datasets/             # Local datasets folder (burnout, journal, emotion)
│   ├── saved_models/         # Pickled trained model files (joblib loaded)
│   └── training/             # Generation and classifier training scripts
├── docker/                   # Docker containers configs
├── docs/                     # Endpoints payload specifications
└── requirements.txt          # Unified Python environment dependencies
```

---

## Local Setup & Installation

### Prerequisite
- **Python 3.10+**
- **Node.js 18+ & npm**

### Step 1: Install Python Dependencies & Train ML Models
To train the classifiers and build the mock student datasets, run:

```bash
# 1. Install packages
pip install -r requirements.txt

# 2. Generate datasets and train the ML classifiers
python ml_models/training/train_all.py
```
This generates:
1. `ml_models/datasets/burnout_dataset.csv` (1500 records)
2. `ml_models/datasets/journal_dataset.csv` (600 records)
3. `ml_models/datasets/emotion_dataset.csv` (copied from local training.csv)

And outputs the trained classifiers to `ml_models/saved_models/`:
- `burnout_model.pkl` (XGBoost/RandomForest classifier)
- `emotion_model.pkl` (TF-IDF Text classifier)
- `sentiment_model.pkl` (Sentiment classification & stress scoring models)

### Step 2: Boot the FastAPI Backend
Start the FastAPI server:

```bash
cd backend   
uvicorn app.main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger documentation: `http://localhost:8000/docs`

### Step 3: Boot the React Frontend
Set up and boot Vite:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Docker Compose Setup (Multi-Container Deployment)

To build and run the entire stack (PostgreSQL database, FastAPI backend, React in Nginx) with a single command, run:

```bash
cd docker
docker-compose up --build
```
- Frontend will serve on: `http://localhost:80`
- API gateway: `http://localhost:8000`
- PostgreSQL port: `5432`

---

## Core Features & AI Model Mechanics

1. **Burnout Classifier:** Leverages an XGBoost/RandomForest model trained on student workload indicators. Outputs Low/Medium/High risk classifications accompanied by explainable feature weight alerts (like lack of sleep or peak study stress).
2. **Journal NLP Sentiment:** Passes journal inputs through a TF-IDF vectorizer and Logistic Regression classifier to capture positive, negative, or neutral sentiment tags, alongside 1-10 numerical stress weights.
3. **Journal Emotion Detection:** Classifies student diary texts into six emotions (sadness, joy, love, anger, fear, surprise) trained on local data.
4. **Behavioral Drift Analysis:** Monitors daily activity logs to detect deviations in productivity, decreasing sleep patterns, inactivity gaps, and persistent negative journals.
5. **Interactive Self-Care Widgets:** Calming breathing guides and customizable Pomodoro clocks to help students recover from stress.
6. **Empathetic Chatbot:** Conversational assistant to advise on study guidelines and direct students to support resources.
