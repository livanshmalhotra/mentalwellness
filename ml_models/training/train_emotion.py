import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

# Label mapping for Kaggle Emotion dataset
EMOTION_LABELS = {
    0: "sadness",
    1: "joy",
    2: "love",
    3: "anger",
    4: "fear",
    5: "surprise"
}

def train_sklearn_emotion_model(df):
    print("Training fast TF-IDF + Logistic Regression emotion classifier...")
    X = df['text']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
    
    # Vectorizer + Classifier pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=10000, ngram_range=(1, 2), stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=1.5, solver='saga', random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Emotion TF-IDF Model Accuracy: {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=[EMOTION_LABELS[i] for i in range(6)]))
    
    return pipeline

def train_emotion_model():
    dataset_path = 'ml_models/datasets/emotion_dataset.csv'
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}. Please run generate_datasets.py first.")
        
    df = pd.read_csv(dataset_path)
    
    # Ensure there are no null values
    df = df.dropna(subset=['text', 'label'])
    
    pipeline = train_sklearn_emotion_model(df)
    
    # Try training DistilBERT if HuggingFace and GPU/Torch are fully setup (Optional, for advanced environments)
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
        print("Checking if environment supports HuggingFace DistilBERT training...")
        if torch.cuda.is_available():
            print("GPU available. Proceeding with DistilBERT training demonstration setup...")
        else:
            print("GPU not available. Skipping slow CPU HuggingFace transformer training...")
    except Exception as e:
        print(f"HuggingFace training environment check skipped: {e}")
        print("Using scikit-learn TF-IDF pipeline.")

    # Save Scikit-learn model as primary local inference engine
    os.makedirs('ml_models/saved_models', exist_ok=True)
    model_path = 'ml_models/saved_models/emotion_model.pkl'
    
    model_data = {
        'pipeline': pipeline,
        'label_mapping': EMOTION_LABELS
    }
    
    joblib.dump(model_data, model_path)
    print(f"Emotion classifier saved to {model_path} successfully!")

if __name__ == "__main__":
    train_emotion_model()
