"""
Assessment Service – TIPI & BRS Scoring Logic

TIPI (Ten Item Personality Inventory):
  - 10 items scored 1-7
  - Reverse items: Q2, Q4, Q6, Q8, Q10  →  reverse = 8 - response
  - Trait calculations:
      Extraversion       = avg(Q1, R(Q6))
      Agreeableness      = avg(R(Q2), Q7)
      Conscientiousness  = avg(Q3, R(Q8))
      Emotional Stability = avg(R(Q4), Q9)
      Openness           = avg(Q5, R(Q10))
  - Trait percentage = ((avg - 1) / 6) × 100

BRS (Brief Resilience Scale):
  - 6 items scored 1-5
  - Reverse items: Q12(brs_q2), Q14(brs_q4), Q16(brs_q6)  →  reverse = 6 - response
  - Resilience Score = avg of all 6 items after reverse scoring
  - Levels: 1.0-2.4 → Low, 2.5-3.9 → Moderate, 4.0-5.0 → High
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.models.models import User, AssessmentProfile, MoodLog, BurnoutPrediction, Recommendation
from app.schemas.schemas import AssessmentSubmit
from app.utils.ml_helpers import predict_burnout


def _tipi_reverse(score: int) -> int:
    """Reverse score for TIPI items: reverse = 8 - response."""
    return 8 - score


def _brs_reverse(score: int) -> int:
    """Reverse score for BRS items: reverse = 6 - response."""
    return 6 - score


def _trait_percentage(avg_score: float) -> float:
    """Convert average trait score (1-7) to percentage (0-100)."""
    return round(((avg_score - 1) / 6) * 100, 1)


def _resilience_level(score: float) -> str:
    """Categorize resilience score into Low/Moderate/High."""
    if score <= 2.4:
        return "Low"
    elif score <= 3.9:
        return "Moderate"
    else:
        return "High"


def compute_personality_traits(tipi: List[int]) -> Dict[str, float]:
    """
    Compute Big Five personality trait percentages from TIPI responses.
    
    Args:
        tipi: List of 10 integers (Q1-Q10), each 1-7.
    
    Returns:
        Dictionary with trait percentages (0-100).
    """
    q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 = tipi

    extraversion_avg = (q1 + _tipi_reverse(q6)) / 2
    agreeableness_avg = (_tipi_reverse(q2) + q7) / 2
    conscientiousness_avg = (q3 + _tipi_reverse(q8)) / 2
    emotional_stability_avg = (_tipi_reverse(q4) + q9) / 2
    openness_avg = (q5 + _tipi_reverse(q10)) / 2

    return {
        "extraversion": _trait_percentage(extraversion_avg),
        "agreeableness": _trait_percentage(agreeableness_avg),
        "conscientiousness": _trait_percentage(conscientiousness_avg),
        "emotional_stability": _trait_percentage(emotional_stability_avg),
        "openness": _trait_percentage(openness_avg),
    }


def compute_resilience(brs: List[int]) -> Dict[str, Any]:
    """
    Compute resilience score and level from BRS responses.
    
    Args:
        brs: List of 6 integers (Q11-Q16), each 1-5.
        Reverse items are Q12 (index 1), Q14 (index 3), Q16 (index 5).
    
    Returns:
        Dictionary with resilience_score and resilience_level.
    """
    q11, q12, q13, q14, q15, q16 = brs

    scored = [
        q11,                    # Q11 - direct
        _brs_reverse(q12),      # Q12 - reverse
        q13,                    # Q13 - direct
        _brs_reverse(q14),      # Q14 - reverse
        q15,                    # Q15 - direct
        _brs_reverse(q16),      # Q16 - reverse
    ]

    resilience_score = round(sum(scored) / len(scored), 2)
    return {
        "resilience_score": resilience_score,
        "resilience_level": _resilience_level(resilience_score),
    }


def _validate_responses(tipi: List[int], brs: List[int]):
    """Validate response ranges."""
    for i, val in enumerate(tipi):
        if not (1 <= val <= 7):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"TIPI question {i+1} must be between 1 and 7. Got: {val}"
            )
    for i, val in enumerate(brs):
        if not (1 <= val <= 5):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"BRS question {i+11} must be between 1 and 5. Got: {val}"
            )


def generate_initial_recommendations(db: Session, user_id: int, profile: AssessmentProfile, wellness_score: float):
    """
    Generate initial personalized wellness recommendations based on the user's onboarding profile.
    """
    recs = []
    
    # 1. Resilience recommendation
    if profile.resilience_score <= 2.4:
        recs.append(Recommendation(
            user_id=user_id,
            category="activity",
            title="Resilience Plan: Micro-Recovery Breaks",
            content="Your resilience score suggests lower recovery from stress. Building consistent sleep and recovery habits is crucial. Try taking short, structured 5-minute recovery breaks every 50 minutes during studying."
        ))
    elif profile.resilience_score <= 3.9:
        recs.append(Recommendation(
            user_id=user_id,
            category="activity",
            title="Resilience Building: Cognitive Reframing",
            content="Your resilience score suggests moderate recovery from stress. Strengthening coping strategies can help. Try challenging negative thoughts with evidence-based positive alternatives when under stress."
        ))
    else:
        recs.append(Recommendation(
            user_id=user_id,
            category="focus",
            title="Sustaining High Resilience",
            content="Your resilience score indicates excellent recovery from stress. To sustain this, continue utilizing proactive study breaks and scheduling downtime ahead of high-workload periods."
        ))
        
    # 2. Conscientiousness recommendation
    if profile.conscientiousness >= 60:
        recs.append(Recommendation(
            user_id=user_id,
            category="break",
            title="Structured Rest Scheduling",
            content="Your personality profile indicates high conscientiousness. Because you are naturally driven, structured wellness goals and scheduled restorative breaks may be especially effective to prevent burnout."
        ))
    else:
        recs.append(Recommendation(
            user_id=user_id,
            category="focus",
            title="Pomodoro Goal Setting",
            content="Your personality profile suggests you prefer flexible scheduling. Try using the Pomodoro technique (25 minutes focus, 5 minutes break) with clear micro-goals to build study momentum easily."
        ))
        
    # 3. Emotional Stability recommendation
    if profile.emotional_stability < 40:
        recs.append(Recommendation(
            user_id=user_id,
            category="breathing",
            title="Anchoring Routine: 4-7-8 Breathing",
            content="Your baseline indicates sensitivity to emotional fluctuations. Deep breathing exercises can help regulate your nervous system. Inhale for 4 seconds, hold for 7, and exhale for 8."
        ))
    else:
        recs.append(Recommendation(
            user_id=user_id,
            category="activity",
            title="Weekly Emotional Check-in",
            content="Your profile shows robust emotional stability. Maintain this healthy balance by performing weekly reflective writing to check in on your academic workload and stress levels."
        ))
        
    # 4. Openness recommendation
    if profile.openness >= 65:
        recs.append(Recommendation(
            user_id=user_id,
            category="exercise",
            title="Exploring Creative De-stressors",
            content="Your high openness shows a love for novelty and creativity. Try incorporating creative hobbies (like drawing, exploring new running paths, or cooking a new recipe) to refresh your mind."
        ))
        
    # 5. Wellness Score recommendation
    if wellness_score < 50:
        recs.append(Recommendation(
            user_id=user_id,
            category="break",
            title="Workload Reduction Protocol",
            content="Your initial wellness score is low. Prioritize immediate rest, reduce secondary commitments, and aim for a consistent 8-hour sleep target to help restore your mental energy."
        ))
    elif wellness_score < 75:
        recs.append(Recommendation(
            user_id=user_id,
            category="exercise",
            title="Daily Restorative Walk",
            content="Your initial wellness score is moderate. Adding a simple 15-minute daily walk outdoors can significantly enhance sleep quality, stress levels, and overall wellness."
        ))
    else:
        recs.append(Recommendation(
            user_id=user_id,
            category="focus",
            title="Peak Performance Optimization",
            content="Your initial wellness score is very strong. Optimize your focus by establishing a clean workspace and blocking distractions during deep-work study hours."
        ))
        
    for rec in recs:
        db.add(rec)


def submit_assessment(db: Session, user_id: int, data: AssessmentSubmit) -> AssessmentProfile:
    """
    Process and store the onboarding assessment.
    Computes personality traits and resilience, creates the profile,
    marks onboarding as completed, auto-generates baseline mood record,
    initial wellness score, and initial recommendations.
    """
    tipi = data.tipi_responses
    brs = data.brs_responses

    _validate_responses(tipi, brs)

    # Compute scores
    personality = compute_personality_traits(tipi)
    resilience = compute_resilience(brs)

    extraversion = personality["extraversion"]
    agreeableness = personality["agreeableness"]
    conscientiousness = personality["conscientiousness"]
    emotional_stability = personality["emotional_stability"]
    openness = personality["openness"]
    resilience_score = resilience["resilience_score"]
    
    # Calculate initial wellness score (0-100)
    resilience_pct = ((resilience_score - 1.0) / 4.0) * 100.0
    initial_wellness_score = round(
        extraversion * 0.15 +
        agreeableness * 0.15 +
        conscientiousness * 0.20 +
        emotional_stability * 0.25 +
        openness * 0.10 +
        resilience_pct * 0.15,
        1
    )

    # Map personality / resilience to baseline mood log parameters
    # mood: calculated_from_assessment
    mood_score = max(1, min(10, round(emotional_stability / 10.0)))
    # stress: calculated_from_resilience (resilience 1-5 maps to stress 10-1)
    stress_level = max(1, min(10, round(11.0 - 2.0 * resilience_score)))
    # energy: estimated
    energy_level = max(1, min(10, round((extraversion + emotional_stability) / 20.0)))
    # motivation: estimated
    motivation_level = max(1, min(10, round((conscientiousness + openness) / 20.0)))
    # productivity: estimated
    productivity_level = max(1, min(10, round(conscientiousness / 10.0)))
    # sleep quality: estimated
    sleep_quality = max(1, min(10, round(emotional_stability / 10.0)))
    # sleep hours: estimated (default)
    sleep_hours = 7.5

    # Run ML burnout model on the synthetic mood parameters
    pred_res = predict_burnout(
        stress_level=stress_level,
        sleep_hours=sleep_hours,
        productivity_level=productivity_level,
        motivation_level=motivation_level
    )
    initial_burnout_risk = pred_res["risk"]

    # Create profile record
    profile = AssessmentProfile(
        user_id=user_id,
        tipi_q1=tipi[0], tipi_q2=tipi[1], tipi_q3=tipi[2], tipi_q4=tipi[3], tipi_q5=tipi[4],
        tipi_q6=tipi[5], tipi_q7=tipi[6], tipi_q8=tipi[7], tipi_q9=tipi[8], tipi_q10=tipi[9],
        brs_q1=brs[0], brs_q2=brs[1], brs_q3=brs[2], brs_q4=brs[3], brs_q5=brs[4], brs_q6=brs[5],
        extraversion=extraversion,
        agreeableness=agreeableness,
        conscientiousness=conscientiousness,
        emotional_stability=emotional_stability,
        openness=openness,
        resilience_score=resilience_score,
        resilience_level=resilience["resilience_level"],
        initial_wellness_score=initial_wellness_score,
        initial_burnout_risk=initial_burnout_risk,
    )
    db.add(profile)
    db.flush()  # Generate profile ID and set created_at timestamp

    # Save synthetic MoodLog record
    baseline_mood = MoodLog(
        user_id=user_id,
        mood_score=mood_score,
        stress_level=stress_level,
        energy_level=energy_level,
        sleep_hours=sleep_hours,
        sleep_quality=sleep_quality,
        productivity_level=productivity_level,
        motivation_level=motivation_level,
        mood_source="onboarding_assessment",
        created_at=profile.created_at
    )
    db.add(baseline_mood)

    # Save BurnoutPrediction record
    db_pred = BurnoutPrediction(
        user_id=user_id,
        stress_level=stress_level,
        sleep_hours=sleep_hours,
        productivity_level=productivity_level,
        motivation_level=motivation_level,
        burnout_risk=initial_burnout_risk,
        burnout_score=pred_res["score"],
        explainability=pred_res["explainability"],
        created_at=profile.created_at
    )
    db.add(db_pred)

    # Generate initial personalized recommendations
    generate_initial_recommendations(db, user_id, profile, initial_wellness_score)

    # Mark onboarding as completed
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.onboarding_completed = True

    db.commit()
    db.refresh(profile)
    return profile


def get_assessment_profile(db: Session, user_id: int) -> Optional[AssessmentProfile]:
    """Get the user's active assessment profile."""
    return db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == user_id,
        AssessmentProfile.is_active == True
    ).order_by(AssessmentProfile.created_at.desc()).first()


def check_onboarding_status(db: Session, user_id: int) -> bool:
    """Check if the user has completed the onboarding assessment."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    return bool(user.onboarding_completed)


def retake_assessment(db: Session, user_id: int, data: AssessmentSubmit) -> AssessmentProfile:
    """
    Retake the assessment: archive old profiles and create a new one.
    """
    # Archive all existing active profiles
    existing = db.query(AssessmentProfile).filter(
        AssessmentProfile.user_id == user_id,
        AssessmentProfile.is_active == True
    ).all()
    for profile in existing:
        profile.is_active = False

    # Submit new assessment
    return submit_assessment(db, user_id, data)
