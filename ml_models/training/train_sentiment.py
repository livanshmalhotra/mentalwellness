import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

def train_sentiment_model():
    print("Training Sentiment Analysis Model...")
    dataset_path = 'ml_models/datasets/journal_dataset.csv'
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}. Please run generate_datasets.py first.")
        
    df = pd.read_csv(dataset_path)
    
    # Preprocessing
    df = df.dropna(subset=['text', 'sentiment', 'stress_level'])
    
    X = df['text']
    y_sentiment = df['sentiment']
    y_stress = df['stress_level']
    
    # Train sentiment classifier
    X_train, X_test, y_train, y_test = train_test_split(X, y_sentiment, test_size=0.2, random_state=42, stratify=y_sentiment)
    
    sentiment_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=1.0, random_state=42))
    ])
    
    sentiment_pipeline.fit(X_train, y_train)
    y_pred = sentiment_pipeline.predict(X_test)
    print(f"Sentiment Model Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Train stress level regressor/classifier (using TF-IDF + Ridge Regression or LogisticRegression)
    # We can simplify by classifying stress level into categories or running a simple Ridge regressor.
    # Let's train a simple LogisticRegression classifier on the 10 classes of stress level for exact predictions.
    X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(X, y_stress, test_size=0.2, random_state=42, stratify=y_stress)
    stress_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=1.0, random_state=42))
    ])
    stress_pipeline.fit(X_train_s, y_train_s)
    
    # Save the models
    os.makedirs('ml_models/saved_models', exist_ok=True)
    model_path = 'ml_models/saved_models/sentiment_model.pkl'
    
    model_data = {
        'sentiment_pipeline': sentiment_pipeline,
        'stress_pipeline': stress_pipeline
    }
    
    joblib.dump(model_data, model_path)
    print(f"Sentiment & stress analysis models saved to {model_path} successfully!")

if __name__ == "__main__":
    train_sentiment_model()
