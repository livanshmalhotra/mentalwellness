import React, { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';
import { Heart, Sparkles, CheckCircle2, Play, Pause, RotateCcw, Wind, BookOpen, Clock } from 'lucide-react';

const Recommendations = () => {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  // Pomodoro timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Breathing exercise visualizer state
  const [breathingText, setBreathingText] = useState('Ready');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingProgress, setBreathingProgress] = useState(0);

  const fetchRecommendations = async () => {
    try {
      const res = await recommendationAPI.getRecommendations();
      setRecs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Pomodoro timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            // Timer finished
            setIsBreak(!isBreak);
            setTimerMinutes(isBreak ? 25 : 5);
            setTimerSeconds(0);
            setTimerActive(false);
            alert(isBreak ? 'Break finished! Time to study!' : 'Study session finished! Take a break!');
          } else {
            setTimerMinutes(timerMinutes - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(timerSeconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds, isBreak]);

  // Breathing exercise effect
  useEffect(() => {
    let interval = null;
    if (breathingActive) {
      let step = 0; // 0=Inhale(4s), 1=Hold(7s), 2=Exhale(8s)
      let count = 0;
      
      setBreathingText('Inhale (4s)');
      setBreathingProgress(0);
      
      interval = setInterval(() => {
        count++;
        if (step === 0) {
          setBreathingProgress((count / 4) * 100);
          if (count >= 4) {
            step = 1;
            count = 0;
            setBreathingText('Hold (7s)');
          }
        } else if (step === 1) {
          setBreathingProgress((count / 7) * 100);
          if (count >= 7) {
            step = 2;
            count = 0;
            setBreathingText('Exhale (8s)');
          }
        } else if (step === 2) {
          setBreathingProgress((count / 8) * 100);
          if (count >= 8) {
            step = 0;
            count = 0;
            setBreathingText('Inhale (4s)');
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
      setBreathingText('Ready');
      setBreathingProgress(0);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  const handleCompleteRec = async (id) => {
    try {
      await recommendationAPI.completeRecommendation(id);
      setSuccess('Recommendation marked complete!');
      setTimeout(() => setSuccess(''), 2000);
      fetchRecommendations();
    } catch (err) {
      console.error(err);
    }
  };

  const activeRecs = recs.filter(r => !r.completed);
  const completedRecs = recs.filter(r => r.completed);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">AI Wellness Recommendations</h1>
        <p className="text-slate-400 text-sm mt-1">Calming care routines, breathing helpers, and interactive study tools.</p>
      </div>

      {success && (
        <div className="p-4 bg-secondary/15 border border-secondary/25 text-xs text-emerald-450 rounded-xl max-w-md">
          {success}
        </div>
      )}

      {/* Top section: AI generated recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recommendation Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" /> Personalized AI Recommendations
            </h4>

            {loading ? (
              <p className="text-xs text-slate-500 py-6">Recalculating suggestions...</p>
            ) : activeRecs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-secondary mx-auto mb-2 opacity-55" />
                <p className="text-xs">You have completed all recommendations! Log mood metrics to generate new suggestions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRecs.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start justify-between gap-4 text-xs leading-relaxed">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-indigo-400 border border-primary/25">
                          {rec.category}
                        </span>
                        <h5 className="font-bold text-slate-200">{rec.title}</h5>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{rec.content}</p>
                    </div>
                    <button
                      onClick={() => handleCompleteRec(rec.id)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-650 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl transition font-bold whitespace-nowrap text-[10px]"
                    >
                      Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History of Completed */}
          {completedRecs.length > 0 && (
            <div className="glass-panel p-6 space-y-4 opacity-60">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Completed Activities</h4>
              <div className="space-y-2">
                {completedRecs.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-3 bg-slate-900/10 border border-slate-900 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">{rec.title}</span>
                    <span className="text-[10px] text-emerald-450 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Self-Care Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive Breathing Tool */}
          <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Wind className="h-4.5 w-4.5 text-primary" /> 4-7-8 Breathing visualizer
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight">Reduce panic, reset heartrate, and combat stress instantly.</p>
            </div>
            
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative h-32 w-32 rounded-full border-4 border-slate-850 flex items-center justify-center overflow-hidden">
                {/* Visualizer expanding background */}
                <div 
                  className="absolute inset-0 bg-primary/20 transition-all duration-1000 rounded-full"
                  style={{ transform: `scale(${breathingActive ? 0.3 + (breathingProgress / 100) * 0.7 : 0.3})` }}
                ></div>
                <span className="relative text-xs font-black text-slate-200 text-center px-2">{breathingText}</span>
              </div>
            </div>

            <button
              onClick={() => setBreathingActive(!breathingActive)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                breathingActive ? 'bg-danger text-white' : 'bg-primary text-white shadow-lg'
              }`}
            >
              {breathingActive ? 'Stop Exercise' : 'Start Breathing Guide'}
            </button>
          </div>

          {/* Interactive Pomodoro Timer */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" /> Pomodoro Study Timer
            </h4>
            
            <div className="text-center py-4">
              <span className="text-4xl font-black text-slate-100 tracking-wider">
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </span>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                {isBreak ? 'Break Session' : 'Focus Session'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-255 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                {timerActive ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Start Focus
                  </>
                )}
              </button>
              <button
                onClick={() => { setTimerActive(false); setTimerMinutes(25); setTimerSeconds(0); setIsBreak(false); }}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Recommendations;
