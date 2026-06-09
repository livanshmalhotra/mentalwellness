import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      let userFriendlyError = err.message || 'Login failed. Please verify your credentials and try again.';
      const msg = userFriendlyError.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('user not found') || msg.includes('invalid email')) {
        userFriendlyError = 'Invalid email or password. Please try again.';
      } else if (msg.includes('email not confirmed')) {
        userFriendlyError = 'Please verify your email address before signing in.';
      } else if (msg.includes('network') || msg.includes('failed to fetch')) {
        userFriendlyError = 'Network error. Please check your internet connection.';
      }
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-darkBg text-slate-100 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl opacity-20"></div>

      <div className="w-full max-w-md glass-panel p-8 md:p-10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 mb-4 shadow-inner">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-100">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-2">
            AI-Powered Student Wellness & Burnout Analytics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-700 hover:from-indigo-650 hover:to-indigo-750 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-900 pt-6">
          <p className="text-xs text-slate-400 font-medium">
            New to the wellness platform?{' '}
            <Link 
              to="/register" 
              className="text-primary hover:text-indigo-400 font-bold inline-flex items-center gap-1 group"
            >
              Create Account
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
