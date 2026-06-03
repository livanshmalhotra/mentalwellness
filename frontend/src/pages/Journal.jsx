import React, { useState, useEffect } from 'react';
import { journalAPI } from '../services/api';
import { BookOpen, Sparkles, AlertCircle, RefreshCw, Calendar, Tag, ShieldCheck } from 'lucide-react';

const Journal = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  // NLP analysis response state
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadJournalHistory = async () => {
    try {
      const res = await journalAPI.getHistory(10);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJournalHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim().length < 10) {
      setError('Please write at least a few sentences (10 characters minimum) to allow NLP models to analyze sentiment.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setLatestAnalysis(null);

    try {
      const res = await journalAPI.logJournal(text);
      setSuccess('Journal entry saved and analyzed!');
      setLatestAnalysis(res.data);
      setText('');
      loadJournalHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit journal entry.');
    } finally {
      setLoading(false);
    }
  };

  const getEmotionEmoji = (em) => {
    switch (em?.toLowerCase()) {
      case 'joy': return '😊';
      case 'sadness': return '😔';
      case 'love': return '❤️';
      case 'anger': return '😠';
      case 'fear': return '😨';
      case 'surprise': return '😲';
      default: return '😐';
    }
  };

  const getSentimentColor = (sent) => {
    switch (sent?.toLowerCase()) {
      case 'positive': return 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20';
      case 'negative': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-350 border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Daily Journal NLP</h1>
        <p className="text-slate-400 text-sm mt-1">Write freely. Our natural language processing models extract sentiment, stress, and emotions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editor Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 space-y-5">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 text-xs text-red-400 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-danger shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-secondary/15 border border-secondary/25 text-xs text-emerald-450 rounded-xl flex items-start gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-secondary shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Write your thoughts here...
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Today was pretty hectic... I had two lectures and studied for my algorithm midterms. I feel a bit overwhelmed by the workload, but I think I will get through it..."
                rows="8"
                className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition resize-none leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading || text.trim().length === 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-750 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  Analyze Journal Entry
                </>
              )}
            </button>
          </form>

          {/* Live NLP Results Display */}
          {latestAnalysis && (
            <div className="glass-panel p-6 border-l-4 border-l-primary space-y-4 animate-scaleUp">
              <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" /> Live AI NLP Feedback
              </h4>
              
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sentiment</p>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full font-bold border ${getSentimentColor(latestAnalysis.sentiment)}`}>
                    {latestAnalysis.sentiment.toUpperCase()}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emotion Class</p>
                  <p className="text-sm font-bold text-slate-200 mt-2.5 flex items-center justify-center gap-1">
                    <span>{getEmotionEmoji(latestAnalysis.emotion)}</span> 
                    <span>{latestAnalysis.emotion.charAt(0).toUpperCase() + latestAnalysis.emotion.slice(1)}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NLP Stress Indicator</p>
                  <p className="text-base font-extrabold text-red-400 mt-2">{latestAnalysis.stress_level}/10</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Journal Entries History (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Journal History</h4>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto mt-4 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Your journal history is empty.</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="p-3 bg-slate-900/40 border border-slate-805 rounded-xl space-y-2 text-xs leading-relaxed">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getSentimentColor(entry.sentiment)}`}>
                          {entry.sentiment}
                        </span>
                        <span className="text-[11px]" title={`Emotion: ${entry.emotion}`}>
                          {getEmotionEmoji(entry.emotion)}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-350">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Journal;
