import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

def train_burnout_model():
    print("Training Burnout Prediction Model...")
    dataset_path = 'ml_models/datasets/burnout_dataset.csv'
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}. Please run generate_datasets.py first.")
        
    df = pd.read_csv(dataset_path)
    
    X = df[['stress_level', 'sleep_hours', 'productivity_level', 'motivation_level', 'study_hours', 'extracurricular_hours']]
    y = df['burnout_risk']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = None
    model_type = "XGBoost"
    
    # Try training with XGBoost
    try:
        from xgboost import XGBClassifier
        print("Using XGBoost Classifier...")
        model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='mlogloss'
        )
        model.fit(X_train_scaled, y_train)
    except Exception as e:
        print(f"XGBoost training failed or package not installed: {e}")
        print("Falling back to Scikit-learn RandomForestClassifier...")
        from sklearn.ensemble import RandomForestClassifier
        model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
        model.fit(X_train_scaled, y_train)
        model_type = "RandomForest"
        
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model ({model_type}) Accuracy: {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Save the model and scaler
    os.makedirs('ml_models/saved_models', exist_ok=True)
    
    model_data = {
        'model': model,
        'scaler': scaler,
        'features': list(X.columns),
        'model_type': model_type
    }
    
    model_path = 'ml_models/saved_models/burnout_model.pkl'
    joblib.dump(model_data, model_path)
    print(f"Burnout model successfully saved to {model_path}!")

if __name__ == "__main__":
    train_burnout_model()
