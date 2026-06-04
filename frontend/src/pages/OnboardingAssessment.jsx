import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentAPI } from '../services/api';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import './OnboardingAssessment.css';

// ── Question Data ──
const TIPI_QUESTIONS = [
  { id: 1, text: 'Extraverted, enthusiastic' },
  { id: 2, text: 'Critical, quarrelsome' },
  { id: 3, text: 'Dependable, self-disciplined' },
  { id: 4, text: 'Anxious, easily upset' },
  { id: 5, text: 'Open to new experiences, complex' },
  { id: 6, text: 'Reserved, quiet' },
  { id: 7, text: 'Sympathetic, warm' },
  { id: 8, text: 'Disorganized, careless' },
  { id: 9, text: 'Calm, emotionally stable' },
  { id: 10, text: 'Conventional, uncreative' },
];

const BRS_QUESTIONS = [
  { id: 11, text: 'I tend to bounce back quickly after hard times.' },
  { id: 12, text: 'I have a hard time making it through stressful events.' },
  { id: 13, text: 'It does not take me long to recover from a stressful event.' },
  { id: 14, text: 'It is hard for me to snap back when something bad happens.' },
  { id: 15, text: 'I usually come through difficult times with little trouble.' },
  { id: 16, text: 'I tend to take a long time to get over setbacks in my life.' },
];

const TIPI_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Slightly Disagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Slightly Agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly Agree' },
];

const BRS_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const TOTAL_QUESTIONS = 16;

const OnboardingAssessment = () => {
  const navigate = useNavigate();
  const { refreshOnboardingStatus } = useAuth();

  // State
  const [phase, setPhase] = useState('welcome'); // welcome | assessment | submitting | results
  const [currentQuestion, setCurrentQuestion] = useState(0); // 0-15 index
  const [answers, setAnswers] = useState({}); // { 1: 5, 2: 3, ... }
  const [slideDirection, setSlideDirection] = useState(''); // '' | 'slide-out'
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Derived
  const isTipi = currentQuestion < 10;
  const questionData = isTipi
    ? TIPI_QUESTIONS[currentQuestion]
    : BRS_QUESTIONS[currentQuestion - 10];
  const scale = isTipi ? TIPI_SCALE : BRS_SCALE;
  const currentAnswer = answers[questionData?.id];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL_QUESTIONS;
  const isLastQuestion = currentQuestion === TOTAL_QUESTIONS - 1;

  const handleSelectAnswer = useCallback((value) => {
    if (!questionData) return;
    setAnswers(prev => ({ ...prev, [questionData.id]: value }));
  }, [questionData]);

  const handleNext = useCallback(() => {
    if (currentAnswer === undefined) return;
    if (isLastQuestion) return;

    setSlideDirection('slide-out');
    setTimeout(() => {
      setCurrentQuestion(prev => prev + 1);
      setSlideDirection('');
    }, 280);
  }, [currentAnswer, isLastQuestion]);

  const handlePrev = useCallback(() => {
    if (currentQuestion === 0) return;

    setSlideDirection('slide-out');
    setTimeout(() => {
      setCurrentQuestion(prev => prev - 1);
      setSlideDirection('');
    }, 280);
  }, [currentQuestion]);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setPhase('submitting');
    setError('');

    try {
      const tipiResponses = TIPI_QUESTIONS.map(q => answers[q.id]);
      const brsResponses = BRS_QUESTIONS.map(q => answers[q.id]);

      const payload = {
        tipi_responses: tipiResponses,
        brs_responses: brsResponses,
      };

      let res;
      try {
        // Try normal submit first
        res = await assessmentAPI.submitAssessment(payload);
      } catch (submitErr) {
        // If already completed (retake scenario), use retake endpoint
        if (submitErr.response?.status === 400) {
          res = await assessmentAPI.retakeAssessment(payload);
        } else {
          throw submitErr;
        }
      }

      setResults(res.data);
      setPhase('results');

      // Refresh the auth context so ProtectedRoute knows onboarding is done
      if (refreshOnboardingStatus) {
        await refreshOnboardingStatus();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit assessment. Please try again.');
      setPhase('assessment');
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/', { replace: true });
  };

  // ═══ WELCOME SCREEN ═══
  if (phase === 'welcome') {
    return (
      <div className="assessment-container">
        <div className="welcome-card">
          <div className="welcome-icon">🧠</div>
          <h1 className="welcome-title">
            Let's Build Your Wellness Baseline
          </h1>
          <p className="welcome-description">
            Before we begin, we need to understand your unique psychological profile.
            This brief scientifically-validated assessment will establish your personality traits
            and resilience baseline — the foundation of all future wellness predictions.
          </p>
          <div className="welcome-badges">
            <span className="welcome-badge">
              <span className="badge-dot purple"></span>
              10 Personality Questions (TIPI)
            </span>
            <span className="welcome-badge">
              <span className="badge-dot green"></span>
              6 Resilience Questions (BRS)
            </span>
          </div>
          <button
            className="btn-start"
            onClick={() => setPhase('assessment')}
            id="btn-start-assessment"
          >
            <Sparkles size={18} />
            Begin Assessment
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ═══ SUBMITTING SCREEN ═══
  if (phase === 'submitting') {
    return (
      <div className="assessment-container">
        <div className="welcome-card">
          <div className="welcome-icon">⚡</div>
          <h1 className="welcome-title">Analyzing Your Profile</h1>
          <p className="welcome-description">
            Computing personality traits, resilience score, and building your wellness baseline...
          </p>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  // ═══ RESULTS SCREEN ═══
  if (phase === 'results' && results) {
    const traitData = [
      { name: 'Extraversion', value: results.extraversion },
      { name: 'Agreeableness', value: results.agreeableness },
      { name: 'Conscientiousness', value: results.conscientiousness },
      { name: 'Emotional Stability', value: results.emotional_stability },
      { name: 'Openness', value: results.openness },
    ];

    const gaugePercent = ((results.resilience_score - 1) / 4) * 100;
    const levelClass = results.resilience_level.toLowerCase();

    return (
      <div className="assessment-container">
        <div className="results-container">
          <div className="results-header">
            <div className="results-icon">✨</div>
            <h1 className="results-title">Your Wellness Baseline</h1>
            <p className="results-subtitle">
              This profile will power all your future wellness predictions and recommendations.
            </p>
          </div>

          <div className="results-grid">
            {/* Personality Traits Card */}
            <div className="result-card" style={{ gridColumn: 'span 1' }}>
              <div className="result-card-title">
                <span style={{ color: '#818cf8' }}>🎭</span> Personality Profile
              </div>
              {traitData.map((trait) => (
                <div key={trait.name} className="trait-bar-container">
                  <div className="trait-bar-label">
                    <span className="trait-bar-name">{trait.name}</span>
                    <span className="trait-bar-value">{Math.round(trait.value)}%</span>
                  </div>
                  <div className="trait-bar-track">
                    <div
                      className="trait-bar-fill"
                      style={{ width: `${trait.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resilience Card */}
            <div className="result-card" style={{ gridColumn: 'span 1' }}>
              <div className="result-card-title">
                <span style={{ color: '#34d399' }}>🛡️</span> Resilience Score
              </div>
              <div className="resilience-gauge" style={{ padding: '0.5rem 0' }}>
                <div
                  className="gauge-circle"
                  style={{ '--gauge-pct': `${gaugePercent}%` }}
                >
                  <span className="gauge-value">{results.resilience_score}</span>
                </div>
                <span className={`gauge-label ${levelClass}`}>
                  {results.resilience_level} Resilience
                </span>
              </div>
            </div>

            {/* Initial Wellness Score Card */}
            <div className="result-card" style={{ gridColumn: 'span 1' }}>
              <div className="result-card-title">
                <span style={{ color: '#f59e0b' }}>⚡</span> Initial Wellness Score
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '170px' }}>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fbbf24', lineHeight: '1' }}>
                  {results.initial_wellness_score !== undefined ? Math.round(results.initial_wellness_score) : 75}
                  <span style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: '600' }}>/100</span>
                </div>
                <span className="gauge-label" style={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                  color: '#fbbf24', 
                  border: '1px solid rgba(245, 158, 11, 0.25)', 
                  marginTop: '1.5rem',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0.3rem 1rem',
                  borderRadius: '999px'
                }}>
                  {(results.initial_wellness_score || 75) >= 70 ? 'Thriving' : 'Requires Rest'}
                </span>
              </div>
            </div>

            {/* Initial Burnout Risk Card */}
            <div className="result-card" style={{ gridColumn: 'span 1' }}>
              <div className="result-card-title">
                <span style={{ color: '#ef4444' }}>⚠️</span> Initial Burnout Risk
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '170px' }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '900', 
                  color: results.initial_burnout_risk === 'High' ? '#ef4444' : results.initial_burnout_risk === 'Medium' ? '#fbbf24' : '#34d399',
                  lineHeight: '1'
                }}>
                  {results.initial_burnout_risk || 'Low'}
                </div>
                <span className="gauge-label" style={{ 
                  backgroundColor: results.initial_burnout_risk === 'High' ? 'rgba(239, 68, 68, 0.12)' : results.initial_burnout_risk === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                  color: results.initial_burnout_risk === 'High' ? '#f87171' : results.initial_burnout_risk === 'Medium' ? '#fbbf24' : '#34d399', 
                  border: results.initial_burnout_risk === 'High' ? '1px solid rgba(239, 68, 68, 0.25)' : results.initial_burnout_risk === 'Medium' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  marginTop: '1.5rem',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0.3rem 1rem',
                  borderRadius: '999px'
                }}>
                  {results.initial_burnout_risk === 'High' ? 'High Risk' : results.initial_burnout_risk === 'Medium' ? 'Moderate Risk' : 'Minimal Risk'}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn-continue"
            onClick={handleContinueToDashboard}
            id="btn-continue-dashboard"
          >
            <CheckCircle2 size={18} />
            Continue to Dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ═══ ASSESSMENT SCREEN ═══
  const sectionLabel = isTipi ? 'Personality Assessment (TIPI)' : 'Resilience Assessment (BRS)';
  const sectionInstruction = isTipi
    ? 'Please indicate how accurately each statement describes you.'
    : 'The following questions assess how well you recover from stress and setbacks.';

  return (
    <div className="assessment-container">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-info">
          <span className="progress-section">{sectionLabel}</span>
          <span className="progress-count">{currentQuestion + 1} of {TOTAL_QUESTIONS}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / TOTAL_QUESTIONS) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className={`question-card ${slideDirection}`} key={currentQuestion}>
        <span className={`section-badge ${isTipi ? 'tipi' : 'brs'}`}>
          {isTipi ? '🎭 Personality' : '🛡️ Resilience'}
        </span>

        <div className="question-number">Question {questionData.id}</div>
        <h2 className="question-text">{questionData.text}</h2>
        <p className="question-instruction">{sectionInstruction}</p>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '0.75rem',
            fontSize: '0.75rem',
            color: '#f87171',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {/* Likert Scale */}
        <div className="likert-scale">
          {scale.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`likert-option ${currentAnswer === option.value ? 'selected' : ''} ${!isTipi && currentAnswer === option.value ? 'brs-selected' : ''}`}
              onClick={() => handleSelectAnswer(option.value)}
              id={`likert-q${questionData.id}-v${option.value}`}
            >
              <span className="likert-number">{option.value}</span>
              <span className="likert-label">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="nav-buttons">
          <button
            className="btn-prev"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {isLastQuestion ? (
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              <Sparkles size={16} />
              Complete Assessment
            </button>
          ) : (
            <button
              className="btn-next"
              onClick={handleNext}
              disabled={currentAnswer === undefined}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAssessment;
