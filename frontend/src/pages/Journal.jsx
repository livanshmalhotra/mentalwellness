import React, { useState, useEffect } from 'react';
import { journalAPI } from '../services/api';
import { 
  BookOpen, Sparkles, AlertCircle, RefreshCw, Calendar, Tag, 
  ShieldCheck, Lock, Unlock, Key, Trash2, X, Edit3, Save, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Journal = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [sessionPasscode, setSessionPasscode] = useState(null);
  
  // NLP analysis response state
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Passcode Modal state
  const [passcodeModal, setPasscodeModal] = useState({
    isOpen: false,
    mode: 'unlock', // 'unlock' | 'create' | 'confirm'
    tempPin: '',
    onSuccess: null,
    error: '',
    shake: false
  });
  const [pin, setPin] = useState('');

  // Edit Modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    entry: null,
    text: '',
    loading: false,
    error: ''
  });

  const loadJournalHistory = async () => {
    try {
      const res = await journalAPI.getHistory(30);
      setHistory(res.data);
    } catch (err) {
      console.error("Error loading journal history:", err);
    }
  };

  const checkPasscodeStatus = async () => {
    try {
      const res = await journalAPI.hasPasscode();
      setHasPasscode(res.data.has_passcode);
    } catch (err) {
      console.error("Error checking passcode status:", err);
    }
  };

  useEffect(() => {
    loadJournalHistory();
    checkPasscodeStatus();
  }, []);

  // Keyboard input for passcode modal
  useEffect(() => {
    if (!passcodeModal.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          setPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          handleSubmitPin();
        }
      } else if (e.key === 'Escape') {
        closePasscodeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passcodeModal.isOpen, pin, passcodeModal.mode, passcodeModal.tempPin]);

  const closePasscodeModal = () => {
    setPasscodeModal(prev => ({ ...prev, isOpen: false, error: '', shake: false }));
    setPin('');
  };

  const openPasscodeModal = (mode, onSuccess, tempPin = '') => {
    setPin('');
    setPasscodeModal({
      isOpen: true,
      mode,
      tempPin,
      onSuccess,
      error: mode === 'create' ? 'Choose a 4-6 digit passcode' : mode === 'confirm' ? 'Confirm your passcode' : 'Enter your passcode',
      shake: false
    });
  };

  const triggerShake = () => {
    setPasscodeModal(prev => ({ ...prev, shake: true }));
    setTimeout(() => {
      setPasscodeModal(prev => ({ ...prev, shake: false }));
    }, 500);
  };

  const handleSubmitPin = async () => {
    const currentMode = passcodeModal.mode;
    const currentPin = pin;
    
    if (currentPin.length < 4) {
      setPasscodeModal(prev => ({ ...prev, error: 'Passcode must be 4-6 digits.' }));
      triggerShake();
      return;
    }

    if (currentMode === 'create') {
      // Transition to confirm mode
      openPasscodeModal('confirm', passcodeModal.onSuccess, currentPin);
      return;
    }

    if (currentMode === 'confirm') {
      if (currentPin !== passcodeModal.tempPin) {
        setPasscodeModal(prev => ({ ...prev, error: 'Passcodes do not match. Start over.' }));
        triggerShake();
        setTimeout(() => {
          openPasscodeModal('create', passcodeModal.onSuccess);
        }, 1200);
        return;
      }
      
      // Passcodes match, first save passcode to user account
      try {
        await journalAPI.setPasscode(currentPin);
        setHasPasscode(true);
        setSessionPasscode(currentPin);
        closePasscodeModal();
        if (passcodeModal.onSuccess) {
          passcodeModal.onSuccess(currentPin);
        }
      } catch (err) {
        setPasscodeModal(prev => ({ ...prev, error: err.response?.data?.detail || 'Failed to set passcode.' }));
        triggerShake();
      }
      return;
    }

    if (currentMode === 'unlock') {
      // Just test passcode by verifying in session (via has-passcode or mock test, or we call the success callback)
      if (passcodeModal.onSuccess) {
        // The success callback will attempt the unlock action (save or unlock_journal)
        try {
          await passcodeModal.onSuccess(currentPin);
          setSessionPasscode(currentPin);
          closePasscodeModal();
        } catch (err) {
          setPasscodeModal(prev => ({ 
            ...prev, 
            error: err.response?.data?.detail || 'Incorrect Passcode. Try again.' 
          }));
          triggerShake();
          setPin('');
        }
      }
    }
  };

  const handleCreatePrivateJournal = async (pinCode) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setLatestAnalysis(null);
    try {
      const res = await journalAPI.logJournal(text, true, pinCode);
      setSuccess('Private journal encrypted and saved successfully! 🔒');
      setLatestAnalysis(res.data);
      setText('');
      loadJournalHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save private journal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim().length < 10) {
      setError('Please write at least a few sentences (10 characters minimum) to allow NLP models to analyze sentiment.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLatestAnalysis(null);

    if (isPrivate) {
      if (sessionPasscode) {
        // Session is already unlocked, save immediately
        handleCreatePrivateJournal(sessionPasscode);
      } else {
        // Check if passcode is set
        if (!hasPasscode) {
          openPasscodeModal('create', (newPin) => handleCreatePrivateJournal(newPin));
        } else {
          openPasscodeModal('unlock', (enteredPin) => handleCreatePrivateJournal(enteredPin));
        }
      }
    } else {
      setLoading(true);
      try {
        const res = await journalAPI.logJournal(text, false);
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
    }
  };

  const handleOpenPrivateEntry = async (entry) => {
    setError('');
    setSuccess('');
    
    const unlockAction = async (pinCode) => {
      const res = await journalAPI.unlockJournal(entry.id, pinCode);
      setEditModal({
        isOpen: true,
        entry: res.data,
        text: res.data.text,
        loading: false,
        error: ''
      });
    };

    if (sessionPasscode) {
      try {
        await unlockAction(sessionPasscode);
      } catch (err) {
        // If session passcode fails (e.g. somehow invalid or expired), prompt
        openPasscodeModal('unlock', unlockAction);
      }
    } else {
      openPasscodeModal('unlock', unlockAction);
    }
  };

  const handleUpdateEntry = async () => {
    if (editModal.text.trim().length < 10) {
      setEditModal(prev => ({ ...prev, error: 'Journal must be at least 10 characters long.' }));
      return;
    }
    
    setEditModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const passcodeToUse = editModal.entry.is_private ? sessionPasscode : null;
      const res = await journalAPI.updateJournal(editModal.entry.id, editModal.text, passcodeToUse);
      
      // Update entry in history
      setHistory(prev => prev.map(item => item.id === res.data.id ? { ...item, text: editModal.entry.is_private ? 'Private 🔒' : res.data.text } : item));
      setEditModal(prev => ({ ...prev, isOpen: false }));
      setSuccess('Journal entry updated successfully!');
      loadJournalHistory();
    } catch (err) {
      console.error(err);
      setEditModal(prev => ({ 
        ...prev, 
        error: err.response?.data?.detail || 'Failed to update journal entry.' 
      }));
    } finally {
      setEditModal(prev => ({ ...prev, loading: false }));
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
      case 'positive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'private': return 'bg-slate-800 border-slate-700 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-350 border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      
      {/* Header with Relock Option */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Daily Journal NLP {sessionPasscode && <span className="text-xs font-semibold bg-emerald-500/15 text-emerald-450 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><Unlock className="h-3 w-3" /> Private Session Unlocked</span>}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Write freely. Our natural language processing models extract sentiment, stress, and emotions.</p>
        </div>
        {sessionPasscode && (
          <button 
            onClick={() => {
              setSessionPasscode(null);
              setSuccess('Private session relocked. 🔒');
              loadJournalHistory();
            }}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            Lock Private Vault
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editor Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 md:p-8 space-y-6">
            
            {/* Public vs Private Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-850">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  !isPrivate 
                    ? 'bg-gradient-to-r from-primary to-indigo-750 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Public Journal
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isPrivate 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="h-4 w-4" />
                Private Journal
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 text-xs text-red-400 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-danger shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Write your thoughts here...
                  </label>
                  {isPrivate && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500/25 flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> AES-256 Encrypted
                    </span>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    isPrivate
                      ? "Write your private thoughts here. They will be encrypted before reaching the database, and locked behind your passcode..."
                      : "Today was pretty hectic... I had two lectures and studied for my algorithm midterms. I feel a bit overwhelmed by the workload, but I think I will get through it..."
                  }
                  rows="8"
                  className={`block w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:ring-1 transition resize-none leading-relaxed duration-200 ${
                    isPrivate 
                      ? 'border-amber-500/20 focus:border-amber-500 focus:ring-amber-500/40' 
                      : 'border-slate-800 focus:border-primary/80 focus:ring-primary/45'
                  }`}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || text.trim().length === 0}
                className={`w-full py-3.5 px-4 font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isPrivate
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950'
                    : 'bg-gradient-to-r from-primary to-indigo-750 text-white'
                }`}
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></span>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" />
                    {isPrivate ? 'Encrypt & Save Private Entry' : 'Analyze Public Entry'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live NLP Results Display */}
          {latestAnalysis && (
            <div className={`glass-panel p-6 border-l-4 space-y-4 animate-scaleUp ${isPrivate ? 'border-l-amber-500' : 'border-l-primary'}`}>
              <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" /> {isPrivate ? 'Decrypted AI Analysis' : 'Live AI NLP Feedback'}
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
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stress Indicator</p>
                  <p className="text-base font-extrabold text-red-400 mt-2">{latestAnalysis.stress_level}/10</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Journal Entries History (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between h-fit min-h-[500px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Journal History</h4>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-y-auto mt-4 pr-1 scrollbar-thin">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">Your journal history is empty.</p>
              ) : (
                history.map((entry) => {
                  const dateStr = new Date(entry.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const timeStr = new Date(entry.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  if (entry.is_private) {
                    return (
                      <div 
                        key={entry.id} 
                        onClick={() => handleOpenPrivateEntry(entry)}
                        className="p-4 bg-slate-950/45 hover:bg-slate-900/60 border border-amber-500/10 hover:border-amber-500/30 rounded-2xl cursor-pointer flex justify-between items-center transition duration-200 group active:scale-[0.99]"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dateStr} at {timeStr}
                          </span>
                          <p className="font-bold text-slate-200 text-sm flex items-center gap-1.5 mt-1">
                            Private 🔒
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/40 transition">
                          <Lock className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => setEditModal({
                        isOpen: true,
                        entry,
                        text: entry.text,
                        loading: false,
                        error: ''
                      })}
                      className="p-4 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-805 hover:border-slate-700/50 rounded-2xl cursor-pointer space-y-2 text-xs leading-relaxed transition duration-200 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr} at {timeStr}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getSentimentColor(entry.sentiment)}`}>
                            {entry.sentiment.toUpperCase()}
                          </span>
                          <span className="text-xs" title={`Emotion: ${entry.emotion}`}>
                            {getEmotionEmoji(entry.emotion)}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-350 line-clamp-3 font-medium">{entry.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* iOS-STYLE PASSCODE MODAL */}
      <AnimatePresence>
        {passcodeModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                x: passcodeModal.shake ? [-10, 10, -10, 10, -5, 5, 0] : 0 
              }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-6 relative shadow-2xl"
            >
              {/* Close/Cancel top-right */}
              <button 
                onClick={closePasscodeModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-slate-850 p-1.5 rounded-full border border-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/25 mt-4">
                <Key className="h-7 w-7 text-amber-500" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-extrabold text-lg text-slate-100 uppercase tracking-wider">
                  {passcodeModal.mode === 'create' ? 'Create Passcode' : passcodeModal.mode === 'confirm' ? 'Confirm Passcode' : 'Vault Locked'}
                </h3>
                <p className={`text-xs ${passcodeModal.error.includes('Incorrect') || passcodeModal.error.includes('match') ? 'text-red-400 font-bold animate-pulse' : 'text-slate-450 font-medium'}`}>
                  {passcodeModal.error}
                </p>
              </div>

              {/* Passcode dots (4 to 6 support) */}
              <div className="flex gap-4 justify-center py-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border border-slate-600 transition-all duration-150 ${
                      i < pin.length 
                        ? 'bg-slate-200 scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Num Pad */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (pin.length < 6) setPin(prev => prev + num);
                    }}
                    className="w-14 h-14 rounded-full border border-slate-800 bg-slate-950/40 hover:bg-slate-800 active:scale-90 text-lg font-bold text-slate-200 flex items-center justify-center transition shadow"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Backspace/Delete or Cancel */}
                <button
                  onClick={() => {
                    if (pin.length > 0) {
                      setPin(prev => prev.slice(0, -1));
                    } else {
                      closePasscodeModal();
                    }
                  }}
                  className="w-14 h-14 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center active:scale-95 transition"
                >
                  {pin.length > 0 ? 'Delete' : 'Cancel'}
                </button>

                <button
                  onClick={() => {
                    if (pin.length < 6) setPin(prev => prev + '0');
                  }}
                  className="w-14 h-14 rounded-full border border-slate-800 bg-slate-950/40 hover:bg-slate-800 active:scale-90 text-lg font-bold text-slate-200 flex items-center justify-center transition shadow"
                >
                  0
                </button>

                <button
                  onClick={handleSubmitPin}
                  disabled={pin.length < 4}
                  className="w-14 h-14 text-xs font-bold text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center active:scale-95 transition"
                >
                  OK
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READ / EDIT JOURNAL MODAL */}
      <AnimatePresence>
        {editModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-900/60 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${editModal.entry.is_private ? 'bg-amber-500/15 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                    {editModal.entry.is_private ? <Lock className="h-4.5 w-4.5" /> : <BookOpen className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      {editModal.entry.is_private ? 'Decrypted Private Journal' : 'Journal Details'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(editModal.entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                  className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-755 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                {editModal.error && (
                  <div className="p-4 bg-danger/10 border border-danger/20 text-xs text-red-400 rounded-xl flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-danger shrink-0 mt-0.5" />
                    <span>{editModal.error}</span>
                  </div>
                )}

                {/* NLP Analysis */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sentiment</p>
                    <span className={`inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getSentimentColor(editModal.entry.sentiment)}`}>
                      {editModal.entry.sentiment.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Emotion</p>
                    <p className="text-xs font-bold text-slate-200 mt-2 flex items-center justify-center gap-1">
                      <span>{getEmotionEmoji(editModal.entry.emotion)}</span> 
                      <span>{editModal.entry.emotion.charAt(0).toUpperCase() + editModal.entry.emotion.slice(1)}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Stress indicator</p>
                    <p className="text-sm font-extrabold text-red-400 mt-1.5">{editModal.entry.stress_level}/10</p>
                  </div>
                </div>

                {/* Plaintext Edit Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Content
                  </label>
                  <textarea
                    value={editModal.text}
                    onChange={(e) => setEditModal(prev => ({ ...prev, text: e.target.value }))}
                    rows="8"
                    className="block w-full px-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-slate-700 rounded-xl text-sm focus:outline-none transition resize-none leading-relaxed text-slate-300"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-850 bg-slate-950/40 flex justify-end gap-3">
                <button
                  onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateEntry}
                  disabled={editModal.loading || editModal.text === editModal.entry.text}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-700 text-white text-xs font-bold rounded-xl shadow hover:scale-105 active:scale-95 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {editModal.loading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Journal;
