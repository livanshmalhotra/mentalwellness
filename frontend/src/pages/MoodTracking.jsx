import React, { useState, useEffect } from 'react';
import { moodAPI, predictionAPI } from '../services/api';
import { Smile, Info, CheckCircle2, AlertTriangle, Calendar, Moon, Sparkles, Zap, Battery } from 'lucide-react';

const MoodTracking = () => {
  const [moodScore, setMoodScore] = useState(6); // 1-10 (mapped to 5 levels)
  const [stressLevel, setStressLevel] = useState(5); // 1-10
  const [energyLevel, setEnergyLevel] = useState(5); // 1-10
  const [sleepHours, setSleepHours] = useState(7.0); // float
  const [sleepQuality, setSleepQuality] = useState(5); // 1-10
  const [productivityLevel, setProductivityLevel] = useState(5); // 1-10
  const [motivationLevel, setMotivationLevel] = useState(5); // 1-10
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const moodOptions = [
    { score: 2, emoji: '😩', label: 'Terrible' },
    { score: 4, emoji: '😕', label: 'Poor' },
    { score: 6, emoji: '😐', label: 'Okay' },
    { score: 8, emoji: '😊', label: 'Good' },
    { score: 10, emoji: '🌟', label: 'Excellent' },
  ];

  const loadMoodHistory = async () => {
    try {
      const res = await moodAPI.getHistory(10);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // 1. Log mood metrics
      await moodAPI.logMood({
        mood_score: moodScore,
        stress_level: stressLevel,
        energy_level: energyLevel,
        sleep_hours: parseFloat(sleepHours),
        productivity_level: productivityLevel
      });

      // 2. Trigger burnout risk recalculation automatically
      const predRes = await predictionAPI.predictBurnout();
      
      setSuccess(`Mood logged! Burnout risk classified as: ${predRes.data.burnout_risk}`);
      loadMoodHistory();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to submit mood log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Log Daily Wellness</h1>
        <p className="text-slate-400 text-sm mt-1">Submit your parameters to recalculate stress and burnout indices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Form Column (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-panel p-6 md:p-8 space-y-6">
          
          {success && (
            <div className="p-4 bg-secondary/15 border border-secondary/25 text-xs text-emerald-450 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-secondary shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 text-xs text-red-400 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-danger shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Mood Select (1-10) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              How do you feel overall today? (1-10)
            </label>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Select the emoji representing your overall emotional baseline over the last 24 hours (1 for terrible/exhausted to 10 for thriving/excellent).
            </p>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((opt) => (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setMoodScore(opt.score)}
                  className={`py-3 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 ${
                    moodScore === opt.score
                      ? 'bg-primary/25 border-primary shadow-inner scale-105'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xl mb-1">{opt.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-350">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Stress Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-red-400" /> Stress Level (1-10)
              </label>
              <span className="font-extrabold text-slate-200 bg-danger/10 px-2 py-0.5 rounded border border-danger/25">
                {stressLevel}/10
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Estimate your current stress burden: 1 indicates completely relaxed/calm, 5 is moderate load (typical study day), 10 indicates extreme pressure/panic.
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value))}
              className="w-full accent-danger bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 3. Energy Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-yellow-400" /> Energy Level (1-10)
              </label>
              <span className="font-extrabold text-slate-200 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                {energyLevel}/10
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Rate your physical vitality and mental alert state today: select 1 for feeling completely drained/fatigued, 5 for average wakefulness, and 10 for feeling highly energetic.
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full accent-accent bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 4. Sleep Hours */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Moon className="h-4 w-4 text-emerald-400" /> Nightly Sleep (hours)
              </label>
              <span className="font-extrabold text-slate-200 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                {sleepHours} hrs
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Drag the slider to input the total duration of sleep you achieved last night (range 0 to 16 hours, incremented by 0.5 hours).
            </p>
            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full accent-secondary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 5. Productivity Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400">
                Productivity Level (1-10)
              </label>
              <span className="font-extrabold text-slate-200 bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
                {productivityLevel}/10
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Evaluate your study efficiency today: select 1 if you were highly distracted and got no work done, 5 for moderate task completion, and 10 for complete focus.
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={productivityLevel}
              onChange={(e) => setProductivityLevel(parseInt(e.target.value))}
              className="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-750 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                Submit and Forecast Burnout
              </>
            )}
          </button>

        </form>

        {/* History Column (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Recent Wellness Logs</h4>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto mt-4 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No mood history available.</p>
              ) : (
                history.map((log) => {
                  const mOpt = moodOptions.find(o => o.score === log.mood_score) || { emoji: '😐', label: 'Okay' };
                  return (
                    <div key={log.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs leading-none">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{mOpt.emoji}</span>
                        <div>
                          <p className="font-bold text-slate-350">{mOpt.label}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{new Date(log.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 text-center text-[10px]">
                        <div>
                          <p className="text-slate-500">Sleep</p>
                          <p className="font-bold text-slate-300 mt-0.5">{log.sleep_hours}h</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Stress</p>
                          <p className="font-bold text-red-400 mt-0.5">{log.stress_level}/10</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Energy</p>
                          <p className="font-bold text-yellow-400 mt-0.5">{log.energy_level || '-'}/10</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Prod</p>
                          <p className="font-bold text-amber-400 mt-0.5">{log.productivity_level}/10</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl text-[11px] leading-relaxed text-slate-400 mt-6">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>Logging daily helps our drift algorithm detect changes in your productivity levels, sleep cycles, and study habits before burnout peaks.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default MoodTracking;
