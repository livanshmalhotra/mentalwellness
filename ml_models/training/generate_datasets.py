import os
import shutil
import pandas as pd
import numpy as np

def generate_burnout_dataset():
    print("Generating burnout_dataset.csv...")
    np.random.seed(42)
    n_samples = 1500
    
    # Generate random features
    stress_level = np.random.randint(1, 11, n_samples)
    sleep_hours = np.random.uniform(4.0, 10.0, n_samples)
    productivity_level = np.random.randint(1, 11, n_samples)
    motivation_level = np.random.randint(1, 11, n_samples)
    study_hours = np.random.uniform(1.0, 10.0, n_samples)
    extracurricular_hours = np.random.uniform(0.0, 5.0, n_samples)
    
    burnout_risk = []
    for i in range(n_samples):
        # Rule based risk assessment with noise
        score = (stress_level[i] * 1.5) - (sleep_hours[i] * 1.0) - (motivation_level[i] * 0.8) + (study_hours[i] * 0.5) - (productivity_level[i] * 0.3)
        # Normalize score to decide class
        noise = np.random.normal(0, 1.5)
        score += noise
        
        if score > 5.0:
            burnout_risk.append(2) # High
        elif score > -1.0:
            burnout_risk.append(1) # Medium
        else:
            burnout_risk.append(0) # Low
            
    df = pd.DataFrame({
        'stress_level': stress_level,
        'sleep_hours': np.round(sleep_hours, 1),
        'productivity_level': productivity_level,
        'motivation_level': motivation_level,
        'study_hours': np.round(study_hours, 1),
        'extracurricular_hours': np.round(extracurricular_hours, 1),
        'burnout_risk': burnout_risk
    })
    
    os.makedirs('ml_models/datasets', exist_ok=True)
    df.to_csv('ml_models/datasets/burnout_dataset.csv', index=False)
    print(f"Generated burnout_dataset.csv with {n_samples} records. Value counts:\n{df['burnout_risk'].value_counts()}")

def generate_journal_dataset():
    print("Generating journal_dataset.csv...")
    # List of positive, negative, and neutral statements from a student perspective
    positives = [
        "I had an amazing day today. I got a high grade on my math exam and felt so accomplished.",
        "I feel really good about the group project. My team was super helpful and we got everything done.",
        "Today was a productive day. I studied for 4 hours, went to the gym, and got a good sleep.",
        "I'm feeling very motivated and excited about the upcoming holidays.",
        "Spent the evening talking to my friends. It was so relaxing and made me feel happy.",
        "I finally understood the programming concepts today! Feeling smart and happy.",
        "I had a great sleep and woke up energized. Ready to tackle the day's tasks.",
        "The weather is beautiful and I had a nice walk around the campus. Feeling peaceful."
    ]
    
    negatives = [
        "I am so stressed about my finals. I feel like I'm going to fail everything.",
        "I'm feeling extremely exhausted and burnt out. I can't seem to focus on any assignment.",
        "Had a terrible fight with my roommate today. Feeling very down and anxious.",
        "I didn't sleep at all last night. I feel groggy, irritated, and depressed.",
        "This semester is too hard. The workload is overwhelming and I have no motivation left.",
        "I feel lonely and isolated on campus. Nobody seems to care or want to hang out.",
        "Failed my quiz today despite studying all night. I feel hopeless and stupid.",
        "I have a massive headache and so much homework to finish. I just want to cry."
    ]
    
    neutrals = [
        "I attended two lectures today and then worked on my assignment in the library.",
        "I had lunch at the student cafeteria and then went back to my dorm room.",
        "We have a group meeting scheduled for tomorrow afternoon to discuss the project.",
        "Just finished cleaning my room and now I am going to buy some groceries.",
        "The professor covered chapter 5 today in the computer science class.",
        "I am just sitting in the lounge waiting for the next class to start.",
        "Standard day today. Went to classes, did some study, and read a book.",
        "Nothing special happened today. Just did my normal routine."
    ]
    
    np.random.seed(42)
    n_samples = 600
    texts = []
    sentiments = []
    stress_levels = []
    
    for _ in range(n_samples):
        cat = np.random.choice(['positive', 'negative', 'neutral'])
        if cat == 'positive':
            texts.append(np.random.choice(positives))
            sentiments.append('positive')
            stress_levels.append(np.random.randint(1, 4))
        elif cat == 'negative':
            texts.append(np.random.choice(negatives))
            sentiments.append('negative')
            stress_levels.append(np.random.randint(7, 11))
        else:
            texts.append(np.random.choice(neutrals))
            sentiments.append('neutral')
            stress_levels.append(np.random.randint(4, 7))
            
    df = pd.DataFrame({
        'text': texts,
        'sentiment': sentiments,
        'stress_level': stress_levels
    })
    
    os.makedirs('ml_models/datasets', exist_ok=True)
    df.to_csv('ml_models/datasets/journal_dataset.csv', index=False)
    print(f"Generated journal_dataset.csv with {n_samples} records.")

def copy_emotion_dataset():
    print("Copying emotion_dataset.csv from training.csv...")
    src = 'datasets/dataset/training.csv'
    dest = 'ml_models/datasets/emotion_dataset.csv'
    
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy(src, dest)
        print(f"Copied emotion dataset from {src} to {dest}.")
    else:
        print(f"Warning: Source dataset at {src} not found! Generating dummy emotion dataset instead...")
        # Create a small fallback emotion dataset
        emotions_dummy = [
            ("i feel so happy and excited today", 1), # joy
            ("i feel very sad and lonely", 0), # sadness
            ("i love my family and friends so much", 2), # love
            ("i am extremely angry and pissed off at this situation", 3), # anger
            ("i am terrified of the exam results and feel scared", 4), # fear
            ("i was completely surprised by the sudden news", 5) # surprise
        ]
        texts = []
        labels = []
        for _ in range(200):
            item = emotions_dummy[np.random.randint(0, len(emotions_dummy))]
            texts.append(item[0])
            labels.append(item[1])
        df = pd.DataFrame({'text': texts, 'label': labels})
        os.makedirs('ml_models/datasets', exist_ok=True)
        df.to_csv(dest, index=False)
        print(f"Generated dummy emotion dataset at {dest}.")

if __name__ == "__main__":
    generate_burnout_dataset()
    generate_journal_dataset()
    copy_emotion_dataset()
    print("All datasets generated and setup successfully!")
