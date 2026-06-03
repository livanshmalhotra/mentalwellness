import React, { useState, useEffect } from 'react';
import { analyticsAPI, recommendationAPI, chatbotAPI } from '../services/api';
import { 
  ShieldAlert, Activity, Heart, Sparkles, Send, CheckCircle2,
  TrendingUp, Moon, Brain, ChevronRight, AlertTriangle, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hi! I am your wellness AI helper. Ask me anything about exam stress, sleep logs, or study tips.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      const [dashRes, recsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        recommendationAPI.getRecommendations()
      ]);
      setData(dashRes.data);
      // Filter out completed ones, display top 3
      setRecs(recsRes.data.filter(r => !r.completed).slice(0, 3));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch wellness data. Make sure you have logged your mood today.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCompleteRec = async (id) => {
    try {
      await recommendationAPI.completeRecommendation(id);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;

    const userMessage = chatMsg.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatMsg('');
    setChatLoading(true);

    try {
      const res = await chatbotAPI.sendMessage(userMessage);
      setChatHistory(prev => [...prev, { sender: 'bot', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'bot', text: 'Oops! I had trouble connecting. Let me try again later.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-400 font-medium">Analyzing wellness metrics...</p>
      </div>
    );
  }

  // Fallback default UI if no logs are present
  const showFallback = error || !data || data.trends.length === 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Student Wellness Cockpit</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time mental load tracking and predictive risk forecasting.</p>
        </div>
        <div className="flex gap-3">
          <a href="/mood" className="px-4 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs">
            Log Daily Metrics
          </a>
          <a href="/journal" className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all text-xs">
            Write Journal
          </a>
        </div>
      </div>

      {showFallback ? (
        <div className="glass-panel p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-accent mx-auto animate-bounce" />
          <h2 className="text-xl font-bold text-slate-200">No Wellness Logs Found Yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Before we can predict your burnout risk and display dashboard trends, we need you to enter at least one daily mood check.
          </p>
          <a href="/mood" className="inline-block px-5 py-3 bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-all text-xs">
            Log Your First Mood Now
          </a>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Wellness Score Card */}
            <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full filter blur-xl opacity-40"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Wellness Score</p>
                  <h3 className="text-4xl font-black text-slate-100 mt-2">{data.wellness_score}<span className="text-sm font-semibold text-slate-500">/100</span></h3>
                </div>
                <div className="bg-secondary/20 p-2.5 rounded-xl border border-secondary/30">
                  <Activity className="h-5 w-5 text-secondary" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  data.wellness_score >= 70 ? 'bg-secondary/15 text-secondary' : 'bg-danger/10 text-red-400'
                }`}>
                  {data.wellness_score >= 70 ? 'Thriving' : 'Requires Rest'}
                </span>
                <p className="text-[11px] text-slate-400 font-medium">Aggregated across recent logs.</p>
              </div>
            </div>

            {/* Burnout Score Card */}
            <div className={`glass-panel p-6 flex flex-col justify-between border-l-4 relative overflow-hidden ${
              data.burnout_risk === 'High' ? 'border-l-danger' : data.burnout_risk === 'Medium' ? 'border-l-accent' : 'border-l-secondary'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full filter blur-xl opacity-40"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Burnout Risk</p>
                  <h3 className={`text-4xl font-black mt-2 ${
                    data.burnout_risk === 'High' ? 'text-red-400' : data.burnout_risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{data.burnout_risk}</h3>
                </div>
                <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] text-slate-400 leading-tight truncate">
                  <span className="font-bold text-slate-350">AI Reason:</span> {data.explainability}
                </p>
              </div>
            </div>

            {/* Inactivity & Drift Summary */}
            <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full filter blur-xl opacity-40"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Behavioral Alerts</p>
                  <h3 className="text-4xl font-black text-slate-100 mt-2">{data.drifts.length}<span className="text-sm font-semibold text-slate-500"> flagged</span></h3>
                </div>
                <div className="bg-accent/20 p-2.5 rounded-xl border border-accent/30">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${data.drifts.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {data.drifts.length > 0 ? data.drifts[0].title : 'Consistency levels are normal.'}
                </p>
              </div>
            </div>

          </div>

          {/* Weekly Summary Warning Banner */}
          {data.drifts.length > 0 && (
            <div className="glass-panel p-4 bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 rounded-2xl">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Behavioral Drift Indicators Flagged</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{data.weekly_summary}</p>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Mood vs Stress Chart */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Mood & Stress Evolution</h4>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[1, 10]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#161d30', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line name="Mood Score (1-5)" type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line name="Stress Level (1-10)" type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sleep vs Productivity Chart */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Sleep Hours vs Productivity</h4>
                <Moon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#161d30', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area name="Sleep Hours" type="monotone" dataKey="sleep" stroke="#10b981" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2} />
                    <Area name="Productivity Level (1-10)" type="monotone" dataKey="productivity" stroke="#f59e0b" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Columns: Recommendations & Chatbot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Recommendations column (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" /> Active AI Care Recommendations
                  </h4>
                </div>
                
                <div className="space-y-3.5 mt-4">
                  {recs.length === 0 ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-secondary mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-500">All caught up! Check back after logging mood or writing logs.</p>
                    </div>
                  ) : (
                    recs.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs leading-relaxed group">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-indigo-400 border border-primary/25">
                              {rec.category}
                            </span>
                            <h5 className="font-bold text-slate-200">{rec.title}</h5>
                          </div>
                          <p className="text-slate-400 mt-1.5 text-[11px] leading-relaxed">{rec.content}</p>
                        </div>
                        <button
                          onClick={() => handleCompleteRec(rec.id)}
                          className="text-slate-500 hover:text-secondary hover:bg-slate-800 p-1.5 rounded-lg border border-transparent hover:border-slate-700/60 transition"
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <a href="/recommendations" className="text-primary hover:text-indigo-400 text-xs font-bold flex items-center gap-1 group mt-6 pt-4 border-t border-slate-900">
                Explore Care Routines
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Chatbot widget (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-4">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" /> Empathetic Chatbot Assistant
                  </h4>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Online</span>
                </div>
                
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {chatHistory.map((item, idx) => (
                    <div key={idx} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                        item.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-750'
                      }`}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="p-3 bg-slate-800/80 text-slate-400 rounded-xl rounded-tl-none border border-slate-750 text-xs flex items-center gap-2">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce [animation-delay:0.2s]">●</span>
                        <span className="animate-bounce [animation-delay:0.4s]">●</span>
                        Analyzing message...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 mt-4 pt-4 border-t border-slate-900">
                <input
                  type="text"
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  placeholder="Ask a question (e.g. 'I am stressed about exams')"
                  className="flex-1 bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                />
                <button
                  type="submit"
                  disabled={!chatMsg.trim() || chatLoading}
                  className="bg-primary hover:bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
