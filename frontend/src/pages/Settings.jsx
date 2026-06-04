import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentAPI } from '../services/api';
import { Settings, ShieldCheck, User, Bell, Shield, Sparkles, Brain, RefreshCw, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState(true);
  const [anonymity, setAnonymity] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await assessmentAPI.getProfile();
        setProfile(res.data);
      } catch (err) {
        // No profile yet
      }
    };
    fetchProfile();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleRetake = () => {
    // Navigate to onboarding page for retake
    // The onboarding page will handle retake via the retake API
    setShowRetakeConfirm(false);
    navigate('/onboarding');
  };

  const traitLabels = {
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    conscientiousness: 'Conscientiousness',
    emotional_stability: 'Emotional Stability',
    openness: 'Openness',
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure profile details and wellness boundaries.</p>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-6 md:p-8 space-y-6">
        
        {success && (
          <div className="p-4 bg-secondary/15 border border-secondary/25 text-xs text-emerald-450 rounded-xl flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-secondary shrink-0" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        {/* 1. Account Details */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
            <User className="h-4 w-4 text-primary" /> Profile Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="block w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-450 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Membership Status</label>
              <input
                type="text"
                disabled
                value="Student Wellness Plan"
                className="block w-full px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-450 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Assessment Baseline */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
            <Brain className="h-4 w-4 text-primary" /> Psychological Baseline
          </h4>
          
          {profile ? (
            <div className="space-y-4">
              {/* Personality Traits Preview */}
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-850 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Personality Traits (TIPI)</p>
                {Object.entries(traitLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-350 font-medium w-36 shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${profile[key]}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 w-10 text-right">{Math.round(profile[key])}%</span>
                  </div>
                ))}
              </div>

              {/* Resilience Preview */}
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Resilience (BRS)</p>
                  <p className="text-sm font-bold text-slate-200 mt-1">
                    Score: <span className={`${
                      profile.resilience_level === 'High' ? 'text-emerald-400' : 
                      profile.resilience_level === 'Moderate' ? 'text-amber-400' : 'text-red-400'
                    }`}>{profile.resilience_score}</span>
                    <span className="text-slate-500 ml-1">/ 5.0</span>
                  </p>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                  profile.resilience_level === 'High' 
                    ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25' 
                    : profile.resilience_level === 'Moderate'
                    ? 'bg-amber-500/12 text-amber-400 border border-amber-500/25'
                    : 'bg-red-500/12 text-red-400 border border-red-500/25'
                }`}>
                  {profile.resilience_level}
                </span>
              </div>

              {/* Assessment Date */}
              <p className="text-[10px] text-slate-500 text-center">
                Assessment completed on {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>

              {/* Retake Button */}
              {!showRetakeConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowRetakeConfirm(true)}
                  className="w-full py-2.5 px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 font-bold rounded-xl transition text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retake Baseline Assessment
                </button>
              ) : (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">Are you sure?</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Your current baseline will be archived and a new assessment will begin. 
                        This will affect future wellness predictions.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-xs transition"
                    >
                      Yes, Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRetakeConfirm(false)}
                      className="flex-1 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 font-bold rounded-lg text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-850 text-center">
              <p className="text-xs text-slate-500">No baseline assessment found.</p>
            </div>
          )}
        </div>

        {/* 3. Notifications & Alerts */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
            <Bell className="h-4 w-4 text-primary" /> Alert Preferences
          </h4>
          
          <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-850">
            <div>
              <h5 className="text-xs font-bold text-slate-200">Daily Tracking Reminders</h5>
              <p className="text-[10px] text-slate-500 mt-1">Receive daily notifications if mood logs are missed.</p>
            </div>
            <button
              type="button"
              onClick={() => setReminders(!reminders)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${reminders ? 'bg-primary' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${reminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-850">
            <div>
              <h5 className="text-xs font-bold text-slate-200">Strict Data Privacy Mode</h5>
              <p className="text-[10px] text-slate-500 mt-1">Anonymize wellness scores shared with university advisers.</p>
            </div>
            <button
              type="button"
              onClick={() => setAnonymity(!anonymity)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${anonymity ? 'bg-primary' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${anonymity ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* 4. AI Safety Bounds */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
            <Shield className="h-4 w-4 text-primary" /> AI Verification & Thresholds
          </h4>
          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-850 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-350 font-bold">Burnout Alert Sensitivity</span>
              <span className="text-slate-500 font-bold">Standard (default)</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-2/3"></div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition text-xs"
        >
          Save Configuration
        </button>

      </form>

    </div>
  );
};

export default SettingsPage;
