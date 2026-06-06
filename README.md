# MindShield AI: Predictive Student Burnout & Mental Wellness Intelligence System

MindShield AI is an intelligent full-stack system designed to track student mental wellness, analyze self-reflective journals, detect behavioral drift, and predict academic burnout risks. By integrating machine learning classifiers with personality baselines and Natural Language Processing (NLP), the platform delivers proactive, personalized mental health insights and micro-interventions.

---

## 1. About the Project & Core Concepts

MindShield AI addresses the growing mental health crisis in academic environments. Unlike static mood logs, this platform analyzes the complex relationship between study workloads, sleep hygiene, and emotional states to flag students sliding towards clinical exhaustion.

### Core Concepts

*   **Student Workload & Stress Dynamics:** Academic burnout is modeled as a function of chronic stressors (extreme study hours, high subjective stress, low sleep) balanced against protective habits (extracurricular balance, sleep hygiene, and motivation).
*   **Behavioral Drift:** The system monitors trends over time. A consecutive drop in sleep hours, sudden inactivity, decline in motivation, or persistent negative sentiment in writing is flagged as a behavioral drift.
*   **Psychological Personality Baselines:** Coping mechanisms are not one-size-fits-all. MindShield AI evaluates students across key personality dimensions:
    *   *Extraversion:* Directs social vs. quiet recovery pathways (e.g., advising introverts to seek quiet reflection and extroverts to engage in social activities).
    *   *Emotional Stability:* Modulates susceptibility to frustration. Low stability scores trigger immediate grounding exercises during stressful episodes.
    *   *Conscientiousness:* Highly conscientious students often create self-imposed academic pressure. The system detects when high conscientiousness collides with high stress to suggest strict, mandatory boundaries.
    *   *Resilience Level (Low/Medium/High):* Serves as an analytical weight to adjust predicted burnout risk. High resilience downweights immediate risk scores, while low resilience increases vulnerability flags.
*   **Encrypted Self-Reflection:** Journaling serves as an unstructured source of raw emotional state data. By offering client/server-side encrypted private journals, the system ensures a safe space for honest reflection without exposing raw data to databases in plain text.

---

## 2. Key Features

1.  **Workload & Mood Tracking:** Daily log inputs capture sleep duration, study hours, extracurricular activity, productivity ratings (1–10), motivation levels (1–10), and subjective stress.
2.  **Predictive Burnout Analytics:** Runs trained ML models to categorize risk as **Low**, **Medium**, or **High**. Results include explainability summaries detailing what metrics (e.g., sleep deprivation, study overload) are driving the prediction.
3.  **NLP Journal Parsing:** Extracts sentiment polarity, emotion category, and stress scores from raw textual journals.
4.  **Behavioral Drift Monitoring:** Tracks rolling averages of sleep, motivation, and writing sentiment to warn students before they reach severe exhaustion.
5.  **Personalized Intervention Engine:** Automatically pushes actionable self-care exercises, breathing resets, and support recommendations based on the combination of current stress and the student's personality profile.
6.  **Empathetic Chatbot:** A conversational advisor available to provide wellness guidelines, answer questions, and direct the student to support lines.
7.  **Calming Widgets:** Accessible visual breathing trainers and customizable Pomodoro timers to support emotional regulation and stress reduction.

---

## 3. Technology Stack

### Frontend (React Single Page Application)
*   **Core:** React 18 (Vite build tool)
*   **Styling:** Tailwind CSS for a modern responsive design, Lucide Icons, and Framer Motion for smooth UI/UX micro-animations.
*   **State & Navigation:** React Router DOM for routing, Axios for backend connection.
*   **Visualization:** Recharts for rendering personal wellness statistics, drift charts, and burnout trend indexes.

### Backend (FastAPI Web Framework)
*   **Core API:** FastAPI, Uvicorn ASGI server.
*   **Database & ORM:** SQLAlchemy for object relational mapping and PostgreSQL (used for both local development and production).
*   **Authentication & Security:** JSON Web Tokens (JWT) for session management, Passlib (bcrypt) for user credential protection, and PyCryptodome for journal encryption.
*   **Data Validation:** Pydantic models for request/response serialization.

### AI/ML & NLP Pipeline
*   **Modeling Frameworks:** XGBoost, Scikit-learn, Joblib (for model serialization).
*   **Data Analysis:** Pandas, NumPy.
*   **Deep Learning (Optional Setup):** PyTorch, Hugging Face Transformers (DistilBERT base pipeline capability).

---

## 4. Machine Learning Models

MindShield AI leverages three distinct machine learning models trained on custom student datasets:

### A. Burnout Risk Prediction Model
*   **Algorithm:** `XGBClassifier` (XGBoost Classifier) with a fallback to `RandomForestClassifier` (Scikit-learn) if XGBoost is missing.
*   **Dataset:** `burnout_dataset.csv` (1,500 synthetic student records mapping daily academic and lifestyle habits).
*   **Input Features:** 
    *   `stress_level` (1–10)
    *   `sleep_hours` (4.0–10.0)
    *   `productivity_level` (1–10)
    *   `motivation_level` (1–10)
    *   `study_hours` (1.0–10.0)
    *   `extracurricular_hours` (0.0–5.0)
*   **Data Preprocessing:** Standard scaling of features using Scikit-learn's `StandardScaler`.
*   **Outputs:** Multi-class classification (0 = Low Risk, 1 = Medium Risk, 2 = High Risk), confidence probability score, and custom explainability alerts highlighting risk factors (e.g. `sleep_hours < 6.0` triggering a sleep deprivation warning).
*   **Resilience Tuning:** The backend dynamically adjusts the model's confidence scores and risk output based on the student's baseline resilience profile (e.g., raising risk class for Low Resilience profiles, lowering risk class for High Resilience profiles).

### B. Journal Emotion Detection Model
*   **Algorithm:** TF-IDF Vectorizer (`TfidfVectorizer` with 10,000 max features, unigrams + bigrams, English stop words) + Logistic Regression Classifier (`LogisticRegression` with SAGA solver, C=1.5, max_iter=1000).
*   **Dataset:** `emotion_dataset.csv` (trained on a labeled emotion text dataset).
*   **Outputs:** Predicts the probability across six basic emotions: `sadness` (0), `joy` (1), `love` (2), `anger` (3), `fear` (4), `surprise` (5).
*   **Transformer Capabilities:** The system contains hooks to support Hugging Face `DistilBERT` sequence classification models if a GPU environment is detected.

### C. Journal Sentiment & Stress Model
*   **Algorithm:** Dual-head pipeline utilizing two separate TF-IDF Vectorizers (5,000 features, English stop words) combined with independent Logistic Regression classifiers:
    1.  *Sentiment Head:* Classifies text into `positive`, `negative`, or `neutral`.
    2.  *Stress Head:* Classifies the journal's content into a stress rating scale from `1` (lowest) to `10` (highest).
*   **Dataset:** `journal_dataset.csv` (600 synthetic academic journaling records).

---

## 5. NLP for Journaling

The journal analysis engine performs linguistic processing to assess students' emotional states, maintain data privacy, and trigger automated support actions:

### Sentiment & Stress Score Calculations
When a journal entry is submitted, it is evaluated by the sentiment and stress classifiers. To refine these scores, a custom lexicon-based adjustment is applied:
$$\text{Adjusted Sentiment} = \text{Model Sentiment Confidence} \times \text{Polarity} + (\text{Positive Keywords} \times 0.1) - (\text{Burnout Keywords} \times 0.15) - (\text{Anxiety Keywords} \times 0.1)$$
$$\text{Adjusted Stress} = \frac{\text{Model Stress Level}}{10} + (\text{Burnout Keywords} \times 0.1) + (\text{Anxiety Keywords} \times 0.08) - (\text{Positive Keywords} \times 0.05)$$

*   **Burnout Keywords:** Words like *exhausted, burnt out, drained, overwhelmed, can't cope, hopeless*.
*   **Anxiety Keywords:** Words like *anxious, worried, panic, restless, can't sleep, tense, dread*.
*   **Positive Keywords:** Words like *motivated, productive, grateful, energetic, happy, focused*.

### Security & Privacy (Passcode Protection)
Students can mark journals as **Private**. 
*   Private journals encrypt the full JSON payload (containing raw text, sentiment, primary emotion, and stress level) using symmetric encryption (derived from the student's passcode).
*   The raw content is never stored on the server database in plain text. The database stores the ciphertext.
*   For general listing and history API calls, metadata is fully sanitized: the fields display `Private 🔒`, sentiment/emotion attributes return `private`, and numerical scores are replaced with `None`. Decryption occurs only in memory on the client/server after verifying the user's password/passcode.

### Emotional Drift Interventions & Personalized Recommendations
Public journals feed the system's dynamic recommendation engine. When negative sentiment is flagged alongside specific negative emotions, targeted micro-interventions are triggered:
*   **Sadness:** 
    *   *Introverts (Extraversion < 40):* Recommends *Solo Self-Care Reflection* (quiet activities like reading, music, hot bath).
    *   *Extroverts (Extraversion >= 40):* Recommends a *Social Connection Walk* (15-minute walk with a friend).
*   **Anger:**
    *   *Low Emotional Stability (< 40):* Recommends a *Mindful Reset* (deep breathing exercises).
    *   *High Emotional Stability (>= 40):* Recommends a *Physical Release Action* (cardio burst or gym session).
*   **Fear:** Recommends the *5-4-3-2-1 Grounding Technique* to manage anxiety.
*   **Workplace/Workload Adjustments:**
    *   *High Conscientiousness (> 75):* Proactively advises enforcing strict study boundaries to prevent self-induced fatigue.
    *   *Low Resilience:* Suggests *Compassionate Self-Talk* exercises to prevent emotional spiral.

---

## 6. Local Setup & Installation

### Prerequisites
*   **Python 3.10+**
*   **Node.js 18+** & npm

### Step 1: Install Dependencies & Train Models
1. Clone the repository and navigate to the project root.
2. Install the unified Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Generate the datasets and train the machine learning models:
   ```bash
   python ml_models/training/train_all.py
   ```
   *This trains the burnout, emotion, and sentiment pipelines, saving `.pkl` files to `ml_models/saved_models/`.*

### Step 2: Run the FastAPI Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the Uvicorn development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will start on `http://localhost:8000`. You can inspect the endpoints and interact with the Swagger docs at `http://localhost:8000/docs`.*

### Step 3: Run the React Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to access the frontend.*

---

## Docker Compose Setup

To launch the entire application stack (PostgreSQL database, FastAPI backend, and Nginx-hosted React frontend) with single-command orchestration:

1. Navigate to the Docker folder:
   ```bash
   cd docker
   ```
2. Build and launch the containers:
   ```bash
   docker-compose up --build
   ```
*   **Frontend Service:** `http://localhost:80`
*   **Backend Service:** `http://localhost:8000`
*   **PostgreSQL Port:** `5432`
