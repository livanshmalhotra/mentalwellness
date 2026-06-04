import os
import joblib
import numpy as np

# Absolute paths to saved models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "ml_models", "saved_models")

BURNOUT_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "burnout_model.pkl")
EMOTION_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "emotion_model.pkl")
SENTIMENT_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "sentiment_model.pkl")

# Load models with fallback indicators
burnout_data = None
emotion_data = None
sentiment_data = None

try:
    if os.path.exists(BURNOUT_MODEL_PATH):
        burnout_data = joblib.load(BURNOUT_MODEL_PATH)
        print("Loaded Burnout model successfully.")
except Exception as e:
    print(f"Failed to load burnout model: {e}")

try:
    if os.path.exists(EMOTION_MODEL_PATH):
        emotion_data = joblib.load(EMOTION_MODEL_PATH)
        print("Loaded Emotion model successfully.")
except Exception as e:
    print(f"Failed to load emotion model: {e}")

try:
    if os.path.exists(SENTIMENT_MODEL_PATH):
        sentiment_data = joblib.load(SENTIMENT_MODEL_PATH)
        print("Loaded Sentiment model successfully.")
except Exception as e:
    print(f"Failed to load sentiment model: {e}")


def predict_burnout(stress_level: int, sleep_hours: float, productivity_level: int, motivation_level: int, study_hours: float = 5.0, extracurricular_hours: float = 2.0):
    """
    Predicts burnout risk using XGBoost/RandomForest model or rule-based fallback.
    """
    if burnout_data is not None:
        try:
            model = burnout_data['model']
            scaler = burnout_data['scaler']
            
            # Prepare inputs
            features = np.array([[stress_level, sleep_hours, productivity_level, motivation_level, study_hours, extracurricular_hours]])
            features_scaled = scaler.transform(features)
            
            prediction = int(model.predict(features_scaled)[0])
            probabilities = model.predict_proba(features_scaled)[0]
            
            risk_labels = {0: "Low", 1: "Medium", 2: "High"}
            risk = risk_labels.get(prediction, "Medium")
            score = float(probabilities[prediction])
            
            # Formulate simple feature importance explainability
            explanations = []
            if stress_level > 7:
                explanations.append("High stress levels are driving up burnout scores.")
            if sleep_hours < 6.0:
                explanations.append("Insufficient sleep (less than 6 hours) is severely reducing cognitive recovery.")
            if motivation_level < 5:
                explanations.append("Declining motivation levels suggest early stages of apathy or exhaustion.")
            if study_hours > 8.0:
                explanations.append("Excessive study hours (over 8 hours per day) limit restorative breaks.")
                
            if not explanations:
                explanations.append("Current workload metrics are in standard thresholds.")
                
            return {
                "risk": risk,
                "score": score,
                "explainability": "; ".join(explanations)
            }
        except Exception as e:
            print(f"Error in model burnout prediction: {e}. Falling back to rule-based.")

    # Rule-based fallback
    score = (stress_level * 1.5) - (sleep_hours * 1.0) - (motivation_level * 0.8) + (study_hours * 0.5) - (productivity_level * 0.3)
    
    explanations = []
    if stress_level > 7:
        explanations.append("High stress levels are driving up burnout scores.")
    if sleep_hours < 6.0:
        explanations.append("Insufficient sleep (less than 6 hours) is limiting cognitive recovery.")
    if motivation_level < 5:
        explanations.append("Low motivation indicates emotional exhaustion.")
    if study_hours > 8.0:
        explanations.append("High study volume leaves insufficient time for recovery.")
    
    if score > 5.0:
        risk = "High"
        confidence = 0.85
    elif score > -1.0:
        risk = "Medium"
        confidence = 0.65
    else:
        risk = "Low"
        confidence = 0.90
        
    if not explanations:
        explanations.append("Student habits and workload appear balanced.")
        
    return {
        "risk": risk,
        "score": confidence,
        "explainability": "; ".join(explanations)
    }


def predict_emotion(text: str):
    """
    Predicts text emotion (sadness, joy, love, anger, fear, surprise) using the local TF-IDF model.
    """
    if emotion_data is not None:
        try:
            pipeline = emotion_data['pipeline']
            label_mapping = emotion_data['label_mapping']
            
            prediction = pipeline.predict([text])[0]
            probs = pipeline.predict_proba([text])[0]
            
            label_name = label_mapping.get(prediction, "joy")
            scores = {label_mapping[i]: float(probs[i]) for i in range(len(label_mapping))}
            
            return {
                "emotion": label_name,
                "confidence": float(probs[prediction]),
                "all_scores": scores
            }
        except Exception as e:
            print(f"Error in model emotion prediction: {e}. Falling back to rule-based.")

    # Rule-based fallback
    lower_text = text.lower()
    scores = {"sadness": 0.1, "joy": 0.1, "love": 0.1, "anger": 0.1, "fear": 0.1, "surprise": 0.1}
    
    if any(word in lower_text for word in ["sad", "depressed", "lonely", "cry", "hurt", "unhappy"]):
        scores["sadness"] = 0.8
    elif any(word in lower_text for word in ["happy", "excited", "good", "great", "glad", "wonderful", "love"]):
        scores["joy"] = 0.8
        if "love" in lower_text:
            scores["love"] = 0.8
    elif any(word in lower_text for word in ["angry", "pissed", "hate", "mad", "annoyed", "frustrated"]):
        scores["anger"] = 0.8
    elif any(word in lower_text for word in ["scared", "afraid", "terrified", "anxious", "worry", "fear"]):
        scores["fear"] = 0.8
    elif any(word in lower_text for word in ["surprised", "wow", "shocked", "unexpected"]):
        scores["surprise"] = 0.8
    else:
        scores["joy"] = 0.5 # default
        
    # Normalize scores
    total = sum(scores.values())
    scores = {k: v/total for k, v in scores.items()}
    max_emotion = max(scores, key=scores.get)
    
    return {
        "emotion": max_emotion,
        "confidence": scores[max_emotion],
        "all_scores": scores
    }


def predict_sentiment(text: str):
    """
    Predicts sentiment (positive, neutral, negative) and stress score (1-10) using the local Sentiment model.
    """
    if sentiment_data is not None:
        try:
            sentiment_pipeline = sentiment_data['sentiment_pipeline']
            stress_pipeline = sentiment_data['stress_pipeline']
            
            sentiment = sentiment_pipeline.predict([text])[0]
            probs = sentiment_pipeline.predict_proba([text])[0]
            stress_level = int(stress_pipeline.predict([text])[0])
            
            classes = list(sentiment_pipeline.classes_)
            idx = classes.index(sentiment)
            confidence = float(probs[idx])
            
            return {
                "sentiment": sentiment,
                "confidence": confidence,
                "stress_level": stress_level
            }
        except Exception as e:
            print(f"Error in model sentiment prediction: {e}. Falling back to rule-based.")

    # Rule-based fallback
    lower_text = text.lower()
    sentiment = "neutral"
    confidence = 0.5
    stress_level = 5
    
    neg_words = ["sad", "depressed", "lonely", "stressed", "exhausted", "tired", "worst", "fail", "hate", "scared"]
    pos_words = ["happy", "excited", "good", "great", "glad", "best", "love", "fun", "productive"]
    
    neg_count = sum(1 for w in neg_words if w in lower_text)
    pos_count = sum(1 for w in pos_words if w in lower_text)
    
    if neg_count > pos_count:
        sentiment = "negative"
        confidence = 0.7 + (neg_count * 0.05)
        stress_level = min(10, 5 + neg_count * 2)
    elif pos_count > neg_count:
        sentiment = "positive"
        confidence = 0.7 + (pos_count * 0.05)
        stress_level = max(1, 4 - pos_count)
    else:
        sentiment = "neutral"
        confidence = 0.6
        stress_level = 5
        
    return {
        "sentiment": sentiment,
        "confidence": min(1.0, confidence),
        "stress_level": stress_level
    }


def extract_journal_features(text: str) -> dict:
    """
    Extract comprehensive NLP features from a journal entry for wellness scoring.
    Combines existing sentiment/emotion models with keyword-based burnout/anxiety detection.
    
    Returns:
        journal_sentiment_score: -1.0 to 1.0 (negative to positive)
        journal_stress_score: 0.0 to 1.0 (low to high stress)
        journal_emotion_vector: dict of emotion probabilities
        burnout_indicators: count of burnout-related keywords detected
        anxiety_indicators: count of anxiety-related keywords detected
    """
    # Get base predictions
    sentiment_result = predict_sentiment(text)
    emotion_result = predict_emotion(text)
    
    # Convert sentiment to numeric score (-1.0 to 1.0)
    sentiment_map = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
    sentiment_score = sentiment_map.get(sentiment_result["sentiment"], 0.0)
    # Weight by confidence
    sentiment_score *= sentiment_result["confidence"]
    
    # Normalize stress to 0-1 range
    stress_score = sentiment_result["stress_level"] / 10.0
    
    # Burnout keyword detection
    lower_text = text.lower()
    burnout_keywords = [
        "exhausted", "burnt out", "burnout", "burn out", "drained",
        "overwhelmed", "can't cope", "too much", "breaking point",
        "no energy", "worn out", "giving up", "hopeless", "pointless"
    ]
    anxiety_keywords = [
        "anxious", "anxiety", "worried", "worry", "panic",
        "nervous", "restless", "can't sleep", "racing thoughts",
        "on edge", "tense", "dread", "fearful", "uneasy"
    ]
    positive_keywords = [
        "motivated", "productive", "grateful", "energetic", "happy",
        "excited", "optimistic", "confident", "accomplished", "proud",
        "peaceful", "content", "inspired", "focused", "determined"
    ]
    
    burnout_count = sum(1 for kw in burnout_keywords if kw in lower_text)
    anxiety_count = sum(1 for kw in anxiety_keywords if kw in lower_text)
    positive_count = sum(1 for kw in positive_keywords if kw in lower_text)
    
    # Adjust sentiment score based on keyword detection
    keyword_adjustment = (positive_count * 0.1) - (burnout_count * 0.15) - (anxiety_count * 0.1)
    adjusted_sentiment = max(-1.0, min(1.0, sentiment_score + keyword_adjustment))
    
    # Adjust stress score based on keywords
    stress_adjustment = (burnout_count * 0.1) + (anxiety_count * 0.08) - (positive_count * 0.05)
    adjusted_stress = max(0.0, min(1.0, stress_score + stress_adjustment))
    
    return {
        "journal_sentiment_score": round(adjusted_sentiment, 3),
        "journal_stress_score": round(adjusted_stress, 3),
        "journal_emotion_vector": emotion_result["all_scores"],
        "primary_emotion": emotion_result["emotion"],
        "burnout_indicators": burnout_count,
        "anxiety_indicators": anxiety_count,
        "positive_indicators": positive_count,
    }
