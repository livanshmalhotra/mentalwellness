import os
import sys

# Ensure current folder is in Python path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_datasets import generate_burnout_dataset, generate_journal_dataset, copy_emotion_dataset
from train_burnout import train_burnout_model
from train_emotion import train_emotion_model
from train_sentiment import train_sentiment_model

def main():
    print("==================================================")
    print("STARTING ML DATA GENERATION & TRAINING PIPELINE")
    print("==================================================")
    
    # 1. Dataset Generation
    generate_burnout_dataset()
    generate_journal_dataset()
    copy_emotion_dataset()
    
    print("\n--------------------------------------------------")
    print("TRAINING MODELS")
    print("--------------------------------------------------")
    
    # 2. Model Training
    train_burnout_model()
    train_emotion_model()
    train_sentiment_model()
    
    print("\n==================================================")
    print("ML PIPELINE EXECUTED SUCCESSFULLY")
    print("==================================================")

if __name__ == "__main__":
    main()
