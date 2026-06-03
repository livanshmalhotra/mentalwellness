import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart3, LineChart, TrendingUp, Sparkles, Moon, Activity, Calendar } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, BarChart, Bar, ComposedChart, Line
} from 'recharts';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendsData = async () => {
      try {
        const res = await analyticsAPI.getTrends();
        setTrends(res.data.trends);
        setTimeline(res.data.timeline);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch analytics data. Make sure you have logged some wellness logs first.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrendsData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-400 font-medium">Compiling wellness trends...</p>
      </div>
    );
  }

  const showFallback = error || trends.length === 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Advanced Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Cross-correlate student mood, productivity, sleep, and emotional patterns over time.</p>
      </div>

      {showFallback ? (
        <div className="glass-panel p-8 text-center space-y-4 max-w-lg mx-auto">
          <BarChart3 className="h-12 w-12 text-accent mx-auto" />
          <h2 className="text-lg font-bold text-slate-200">No Analytics Data Available</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            We need data to plot stress/productivity trends and emotion indexes. Please check back after logging your daily metrics and writing journals.
          </p>
          <a href="/mood" className="inline-block px-4 py-2.5 bg-primary hover:bg-indigo-650 text-white font-bold rounded-xl transition text-xs">
            Log Daily Metrics
          </a>
        </div>
      ) : (
        <>
          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Stress vs Productivity Correlation Composed Chart (8 cols) */}
            <div className="lg:col-span-8 glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-primary" /> Stress vs Productivity Correlation
                </h4>
              </div>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Stress / Prod', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Sleep (hours)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#161d30', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar yAxisId="left" name="Stress Level" dataKey="stress" fill="#ef4444" fillOpacity={0.6} barSize={20} />
                    <Line yAxisId="left" name="Productivity Level" type="monotone" dataKey="productivity" stroke="#f59e0b" strokeWidth={3} />
                    <Line yAxisId="right" name="Sleep Hours" type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={2.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Motivation vs Productivity Composed Chart (4 cols) */}
            <div className="lg:col-span-4 glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" /> Motivation Drift
                </h4>
              </div>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#161d30', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar name="Motivation" dataKey="motivation" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Emotional Timeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* NLP Sentiment & Emotion Tracker (12 cols) */}
            <div className="lg:col-span-12 glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Student NLP Journal Sentiment Timeline</h4>
              </div>
              
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Timestamp</th>
                      <th className="pb-3 px-4">Journal Excerpt</th>
                      <th className="pb-3 px-4 text-center">Sentiment</th>
                      <th className="pb-3 px-4 text-center">Emotion Type</th>
                      <th className="pb-3 pl-4 text-center">NLP Stress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {timeline.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500">No journal logs registered.</td>
                      </tr>
                    ) : (
                      timeline.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/10">
                          <td className="py-3.5 pr-4 text-slate-400 whitespace-nowrap">{item.date}</td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-350">{item.snippet}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold border ${
                              item.sentiment === 'positive' 
                                ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                                : item.sentiment === 'negative' 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                  : 'bg-slate-500/10 text-slate-400 border-slate-800'
                            }`}>
                              {item.sentiment}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-250">
                            {item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1)}
                          </td>
                          <td className="py-3.5 pl-4 text-center font-extrabold text-red-400">{item.stress}/10</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default Analytics;
