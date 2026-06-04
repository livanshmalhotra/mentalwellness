from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, Any, List, Optional

from app.models.models import MoodLog, JournalEntry, BurnoutPrediction, Notification, AssessmentProfile
from app.utils.ml_helpers import extract_journal_features


def _get_assessment_data(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch the user's active assessment profile for wellness scoring."""
    profile = db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == user_id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()

    if not profile:
        return None

    return {
        "extraversion": profile.extraversion,
        "agreeableness": profile.agreeableness,
        "conscientiousness": profile.conscientiousness,
        "emotional_stability": profile.emotional_stability,
        "openness": profile.openness,
        "resilience_score": profile.resilience_score,
        "resilience_level": profile.resilience_level,
        "initial_wellness_score": profile.initial_wellness_score,
        "initial_burnout_risk": profile.initial_burnout_risk,
    }


def _compute_journal_features(journals: List[JournalEntry]) -> Dict[str, float]:
    """Compute aggregate journal NLP features from recent journal entries."""
    if not journals:
        return {
            "avg_sentiment": 0.0,
            "avg_stress": 0.5,
            "burnout_signals": 0,
            "anxiety_signals": 0,
            "positive_signals": 0,
        }

    total_sentiment = 0.0
    total_stress = 0.0
    total_burnout = 0
    total_anxiety = 0
    total_positive = 0
    analyzed = 0

    for j in journals:
        if j.is_private:
            continue
        try:
            features = extract_journal_features(j.text)
            total_sentiment += features["journal_sentiment_score"]
            total_stress += features["journal_stress_score"]
            total_burnout += features["burnout_indicators"]
            total_anxiety += features["anxiety_indicators"]
            total_positive += features["positive_indicators"]
            analyzed += 1
        except Exception:
            continue

    if analyzed == 0:
        return {
            "avg_sentiment": 0.0,
            "avg_stress": 0.5,
            "burnout_signals": 0,
            "anxiety_signals": 0,
            "positive_signals": 0,
        }

    return {
        "avg_sentiment": round(total_sentiment / analyzed, 3),
        "avg_stress": round(total_stress / analyzed, 3),
        "burnout_signals": total_burnout,
        "anxiety_signals": total_anxiety,
        "positive_signals": total_positive,
    }


def _compute_trend_penalty(moods: List[MoodLog]) -> float:
    """
    Compute a behavioral trend penalty (0.0 to 1.0).
    0.0 = stable/improving trends, 1.0 = strongly declining trends.
    """
    if len(moods) < 4:
        return 0.0

    # Compare recent 2 vs older 2
    recent_mood = sum(m.mood_score for m in moods[:2]) / 2
    older_mood = sum(m.mood_score for m in moods[2:4]) / 2
    recent_stress = sum(m.stress_level for m in moods[:2]) / 2
    older_stress = sum(m.stress_level for m in moods[2:4]) / 2

    mood_decline = max(0, (older_mood - recent_mood) / 10.0)  # Normalized to 0-1
    stress_increase = max(0, (recent_stress - older_stress) / 10.0)

    return min(1.0, (mood_decline + stress_increase) / 2)


def generate_wellness_explanation(components: Dict[str, float], assessment: Optional[Dict], journal_features: Dict) -> str:
    """
    Generate human-readable explanation of wellness score contributing factors.
    Never provides black-box predictions — always exposes contributing factors.
    """
    explanations = []

    # Mood component
    if components.get("mood_pct", 100) < 40:
        explanations.append("Your recent mood scores have been consistently low")
    elif components.get("mood_pct", 0) > 80:
        explanations.append("Your mood has been positive recently")

    # Stress component
    if components.get("stress_pct", 0) < 40:
        explanations.append("high stress levels are significantly impacting your overall score")

    # Sleep
    if components.get("sleep_pct", 100) < 50:
        explanations.append("insufficient sleep quality and duration are reducing cognitive recovery")

    # Energy
    if components.get("energy_pct", 100) < 40:
        explanations.append("low energy levels suggest physical or mental fatigue")

    # Journal sentiment
    if journal_features.get("avg_sentiment", 0) < -0.3:
        explanations.append("journal entries show increasingly negative sentiment over recent entries")
    if journal_features.get("burnout_signals", 0) >= 2:
        explanations.append("multiple burnout-related indicators were detected in your journal writing")
    if journal_features.get("anxiety_signals", 0) >= 2:
        explanations.append("anxiety-related language patterns were identified in recent journal entries")

    # Assessment-based
    if assessment:
        if assessment.get("emotional_stability", 100) < 35:
            explanations.append("your personality baseline indicates sensitivity to emotional fluctuations")
        if assessment.get("resilience_score", 5) < 2.5:
            explanations.append("low resilience baseline means stressors may have amplified impact on wellbeing")

    # Trend
    if components.get("trend_penalty", 0) > 0.3:
        explanations.append("a declining trend in mood and increasing stress has been detected over recent logs")

    if not explanations:
        return "Your wellness metrics are balanced across all dimensions. Keep maintaining your current habits."

    # Build narrative
    explanation = explanations[0].capitalize()
    if len(explanations) > 1:
        explanation += ", " + ", ".join(explanations[1:-1])
        if len(explanations) > 2:
            explanation += ","
        explanation += " and " + explanations[-1]
    explanation += "."

    return explanation


def get_dashboard_analytics(db: Session, user_id: int) -> Dict[str, Any]:
    # 1. Fetch data
    all_moods = db.query(MoodLog).filter(MoodLog.user_id == user_id).order_by(MoodLog.created_at.desc()).all()
    user_moods = [m for m in all_moods if m.mood_source != "onboarding_assessment"]
    moods = user_moods[:10] if user_moods else all_moods[:10]
    journals = db.query(JournalEntry).filter(JournalEntry.user_id == user_id).order_by(JournalEntry.created_at.desc()).limit(10).all()
    latest_pred = db.query(BurnoutPrediction).filter(BurnoutPrediction.user_id == user_id).order_by(BurnoutPrediction.created_at.desc()).first()

    # Reverse mood list for chronological chart display
    mood_list = list(reversed(moods))
    journal_list = list(reversed(journals))

    # 2. Fetch assessment profile
    assessment = _get_assessment_data(db, user_id)

    # 3. Compute journal NLP features
    journal_features = _compute_journal_features(journals[:5])  # Use last 5 entries

    # 4. Compute Enhanced Wellness Score (0 to 100)
    # Multi-dimensional: Mood(15%) + Stress(15%) + Sleep(10%) + Productivity(10%)
    #   + Energy(5%) + Motivation(5%) + EmotionalStability(10%) + Resilience(10%)
    #   + JournalSentiment(10%) + Trends(10%)
    wellness_score = 75.0  # Default benchmark
    components = {}

    if moods:
        avg_mood = sum(m.mood_score for m in moods) / len(moods)
        avg_stress = sum(m.stress_level for m in moods) / len(moods)
        avg_sleep = sum(m.sleep_hours for m in moods) / len(moods)
        avg_prod = sum(m.productivity_level for m in moods) / len(moods)
        avg_motivation = sum(m.motivation_level for m in moods) / len(moods)
        avg_energy = sum((m.energy_level or 5) for m in moods) / len(moods)
        avg_sleep_quality = sum((m.sleep_quality or 5) for m in moods) / len(moods)

        # Scale each to percentage (0-100)
        mood_pct = (avg_mood / 10.0) * 100
        stress_pct = ((10.0 - avg_stress) / 9.0) * 100  # Invert: low stress = high score
        sleep_pct = min(100, ((avg_sleep / 8.0) * 50) + ((avg_sleep_quality / 10.0) * 50))
        prod_pct = (avg_prod / 10.0) * 100
        energy_pct = (avg_energy / 10.0) * 100
        motivation_pct = (avg_motivation / 10.0) * 100

        components["mood_pct"] = mood_pct
        components["stress_pct"] = stress_pct
        components["sleep_pct"] = sleep_pct
        components["energy_pct"] = energy_pct

        # Assessment-based components (defaults if no assessment)
        emotional_stability_pct = assessment["emotional_stability"] if assessment else 50.0
        resilience_pct = ((assessment["resilience_score"] - 1) / 4) * 100 if assessment else 50.0

        # Journal sentiment component: -1..1 mapped to 0..100
        journal_pct = ((journal_features["avg_sentiment"] + 1) / 2) * 100

        # Trend penalty (0..1 mapped to inverted 0..100)
        trend_penalty = _compute_trend_penalty(moods)
        components["trend_penalty"] = trend_penalty
        trend_pct = (1 - trend_penalty) * 100

        # Weighted sum
        wellness_score = (
            mood_pct * 0.15 +
            stress_pct * 0.15 +
            sleep_pct * 0.10 +
            prod_pct * 0.10 +
            energy_pct * 0.05 +
            motivation_pct * 0.05 +
            emotional_stability_pct * 0.10 +
            resilience_pct * 0.10 +
            journal_pct * 0.10 +
            trend_pct * 0.10
        )
        wellness_score = round(max(0, min(100, wellness_score)), 1)

        # Override with stored initial wellness score if the only log is baseline onboarding assessment
        if len(moods) == 1 and moods[0].mood_source == "onboarding_assessment":
            if assessment and assessment.get("initial_wellness_score") is not None:
                wellness_score = assessment["initial_wellness_score"]

    # 5. Burnout Risk
    burnout_risk = "Low"
    burnout_score = 0.15
    explainability = "Insufficient data to calculate risks."
    if latest_pred:
        burnout_risk = latest_pred.burnout_risk
        burnout_score = latest_pred.burnout_score
        explainability = latest_pred.explainability
    elif moods:
        # Generate inline assessment if no saved prediction exists yet
        from app.utils.ml_helpers import predict_burnout
        m = moods[0]
        pred_res = predict_burnout(m.stress_level, m.sleep_hours, m.productivity_level, m.motivation_level)
        burnout_risk = pred_res["risk"]
        burnout_score = pred_res["score"]
        explainability = pred_res["explainability"]

    # 6. Generate wellness explanation
    wellness_explanation = generate_wellness_explanation(components, assessment, journal_features)

    # 7. Behavioral Drift Detection
    drifts = []

    # Drift 1: Productivity decline
    if len(moods) >= 5:
        recent_prod = sum(m.productivity_level for m in moods[:2]) / 2
        older_prod = sum(m.productivity_level for m in moods[2:5]) / 3
        if older_prod - recent_prod >= 2.0:
            drifts.append({
                "type": "productivity_decline",
                "severity": "Medium",
                "title": "Productivity Slide Detected",
                "detail": f"Your average productivity level has dropped from {older_prod:.1f} to {recent_prod:.1f} in the past few logs."
            })

    # Drift 2: Emotional drift (Journals consistently negative)
    if len(journals) >= 3:
        recent_sentiments = [j.sentiment for j in journals[:3]]
        if all(s == "negative" for s in recent_sentiments):
            drifts.append({
                "type": "emotional_drift",
                "severity": "High",
                "title": "Persistent Negative Mood Pattern",
                "detail": "Your last three journal entries indicate a negative emotional state. Consider taking a restorative break."
            })

    # Drift 3: Sleep decline
    if len(moods) >= 4:
        recent_sleep = sum(m.sleep_hours for m in moods[:2]) / 2
        older_sleep = sum(m.sleep_hours for m in moods[2:4]) / 2
        if older_sleep - recent_sleep >= 1.5:
            drifts.append({
                "type": "sleep_decline",
                "severity": "High",
                "title": "Sleep Hours Dropping",
                "detail": f"Your nightly sleep average dropped from {older_sleep:.1f} to {recent_sleep:.1f} hours."
            })

    # Drift 4: Inactivity pattern
    if moods:
        last_log_date = moods[0].created_at
        days_passed = (datetime.utcnow() - last_log_date).days
        if days_passed >= 3:
            drifts.append({
                "type": "inactivity",
                "severity": "Low",
                "title": "Inactivity Detected",
                "detail": f"You haven't logged your wellness metrics in the last {days_passed} days. Consistent tracking helps build healthy habits."
            })
    else:
        drifts.append({
            "type": "inactivity",
            "severity": "Medium",
            "title": "No Mood Entries Found",
            "detail": "Start tracking your wellness metrics daily to activate burnout predictions and detailed charts."
        })

    # Drift 5: Burnout keywords in journal
    if journal_features.get("burnout_signals", 0) >= 2:
        drifts.append({
            "type": "burnout_language",
            "severity": "High",
            "title": "Burnout Language Detected in Journal",
            "detail": "Recent journal entries contain multiple burnout-related keywords. This is an early warning signal."
        })

    # 8. Weekly summary string
    weekly_summary = "Your wellness status is stable. Keep logging your mood and thoughts to gather more insights."
    if drifts:
        high_alerts = [d["title"] for d in drifts if d["severity"] == "High"]
        if high_alerts:
            weekly_summary = f"Attention needed: We have flagged potential concerns ({', '.join(high_alerts)}). Focus on resting and prioritizing self-care."
        else:
            weekly_summary = "Wellness metrics are slightly drifting, but overall manageable. Maintain your scheduled breaks."

    # 9. Assemble Chart Data
    trend_data = []
    for m in mood_list:
        trend_data.append({
            "date": m.created_at.strftime("%b %d"),
            "mood": m.mood_score,
            "stress": m.stress_level,
            "sleep": m.sleep_hours,
            "productivity": m.productivity_level,
            "motivation": m.motivation_level,
            "energy": m.energy_level or 5,
            "sleep_quality": m.sleep_quality or 5,
        })

    timeline_data = []
    for j in journal_list:
        if j.is_private:
            timeline_data.append({
                "date": j.created_at.strftime("%b %d %H:%M"),
                "sentiment": "private",
                "emotion": "private",
                "stress": None,
                "snippet": "Private 🔒"
            })
        else:
            timeline_data.append({
                "date": j.created_at.strftime("%b %d %H:%M"),
                "sentiment": j.sentiment,
                "emotion": j.emotion,
                "stress": j.stress_level,
                "snippet": j.text[:60] + "..." if len(j.text) > 60 else j.text
            })

    # 10. Build personality & resilience summaries
    personality_summary = None
    resilience_summary = None
    if assessment:
        personality_summary = {
            "extraversion": assessment["extraversion"],
            "agreeableness": assessment["agreeableness"],
            "conscientiousness": assessment["conscientiousness"],
            "emotional_stability": assessment["emotional_stability"],
            "openness": assessment["openness"],
        }
        resilience_summary = {
            "score": assessment["resilience_score"],
            "level": assessment["resilience_level"],
        }

    return {
        "wellness_score": wellness_score,
        "wellness_explanation": wellness_explanation,
        "burnout_risk": burnout_risk,
        "burnout_score": round(float(burnout_score), 2) if burnout_score else 0.0,
        "explainability": explainability,
        "weekly_summary": weekly_summary,
        "drifts": drifts,
        "trends": trend_data,
        "timeline": timeline_data,
        "personality_summary": personality_summary,
        "resilience_summary": resilience_summary,
        "journal_insights": {
            "avg_sentiment": journal_features["avg_sentiment"],
            "avg_stress": journal_features["avg_stress"],
            "burnout_signals": journal_features["burnout_signals"],
            "anxiety_signals": journal_features["anxiety_signals"],
        }
    }
