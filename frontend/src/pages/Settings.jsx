import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, ShieldCheck, User, Bell, Shield, Sparkles } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState(true);
  const [anonymity, setAnonymity] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
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

        {/* 2. Notifications & Alerts */}
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

        {/* 3. AI Safety Bounds */}
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
