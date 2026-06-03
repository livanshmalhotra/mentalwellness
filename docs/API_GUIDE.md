# API Integration Guide

This guide maps backend endpoints, headers, and request/response payloads to facilitate verification.

## Base URL
`http://localhost:8000`

---

## Authentication Endpoints

### 1. Register User
- **Route:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Request Payload:**
  ```json
  {
    "email": "student@university.edu",
    "password": "strongpassword123",
    "full_name": "Alex Mercer"
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "id": 1,
    "email": "student@university.edu",
    "full_name": "Alex Mercer",
    "created_at": "2026-05-29T16:58:38Z"
  }
  ```

### 2. Login User
- **Route:** `POST /api/auth/login`
- **Request Payload:**
  ```json
  {
    "email": "student@university.edu",
    "password": "strongpassword123"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
  ```

---

## Mood Logging Endpoints

### 1. Log Daily Mood
- **Route:** `POST /api/mood`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Payload:**
  ```json
  {
    "mood_score": 4,
    "stress_level": 7,
    "sleep_hours": 6.5,
    "productivity_level": 5,
    "motivation_level": 6
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "id": 1,
    "user_id": 1,
    "mood_score": 4,
    "stress_level": 7,
    "sleep_hours": 6.5,
    "productivity_level": 5,
    "motivation_level": 6,
    "created_at": "2026-05-29T17:01:00Z"
  }
  ```

---

## NLP Journal Endpoints

### 1. Submit Journal
- **Route:** `POST /api/journal`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Payload:**
  ```json
  {
    "text": "I feel very overwhelmed with my finals preparation. I didn't sleep well."
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "id": 1,
    "user_id": 1,
    "text": "I feel very overwhelmed with my finals preparation. I didn't sleep well.",
    "sentiment": "negative",
    "sentiment_score": 0.85,
    "emotion": "sadness",
    "stress_level": 8,
    "created_at": "2026-05-29T17:05:00Z"
  }
  ```

---

## Prediction Endpoints

### 1. Predict Burnout Risk
- **Route:** `GET /api/predict/burnout`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Shape (200 OK):**
  ```json
  {
    "id": 1,
    "user_id": 1,
    "stress_level": 7,
    "sleep_hours": 6.5,
    "productivity_level": 5,
    "motivation_level": 6,
    "burnout_risk": "Medium",
    "burnout_score": 0.65,
    "explainability": "High stress levels are driving up burnout scores.",
    "created_at": "2026-05-29T17:10:00Z"
  }
  ```

---

## Analytics Endpoints

### 1. Get Dashboard Analytics
- **Route:** `GET /api/analytics/dashboard`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Shape (200 OK):**
  ```json
  {
    "wellness_score": 68.5,
    "burnout_risk": "Medium",
    "burnout_score": 0.65,
    "explainability": "High stress levels are driving up burnout scores.",
    "weekly_summary": "Wellness metrics are slightly drifting, but overall manageable.",
    "drifts": [
      {
        "type": "productivity_decline",
        "severity": "Medium",
        "title": "Productivity Slide Detected",
        "detail": "Your average productivity level has dropped from 7.0 to 5.0 in the past few logs."
      }
    ],
    "trends": [
      {
        "date": "May 29",
        "mood": 4,
        "stress": 7,
        "sleep": 6.5,
        "productivity": 5,
        "motivation": 6
      }
    ],
    "timeline": [
      {
        "date": "May 29 17:05",
        "sentiment": "negative",
        "emotion": "sadness",
        "stress": 8,
        "snippet": "I feel very overwhelmed with my finals preparation..."
      }
    ]
  }
  ```

---

## Chatbot Endpoints

### 1. Message Chatbot
- **Route:** `POST /api/chatbot`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Payload:**
  ```json
  {
    "message": "I have exam stress"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "response": "Hello Alex! Academic pressure is highly common. Try to break down your studying into 25-minute Pomodoro sessions..."
  }
  ```
