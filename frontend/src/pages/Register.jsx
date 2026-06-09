import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await register(email, password, fullName);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error(err);
      let userFriendlyError = err.message || 'Registration failed. Please try again.';
      const msg = userFriendlyError.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user_already_exists') || msg.includes('already exists')) {
        userFriendlyError = 'This email address is already registered.';
      } else if (msg.includes('invalid email') || msg.includes('badly formatted')) {
        userFriendlyError = 'The email address is badly formatted.';
      } else if (msg.includes('weak-password') || msg.includes('should be at least') || msg.includes('password')) {
        userFriendlyError = 'Password is too weak or too short (minimum 6 characters).';
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
            Create Account
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Register to start tracking student wellness and burnout risk
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-secondary/15 border border-secondary/25 rounded-xl text-xs font-semibold text-emerald-450">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition duration-200"
              />
            </div>
          </div>

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
                placeholder="Min. 6 characters"
                className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-700 hover:from-indigo-650 hover:to-indigo-750 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Register
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-900 pt-6">
          <p className="text-xs text-slate-400 font-medium">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:text-indigo-400 font-bold inline-flex items-center gap-1 group"
            >
              Sign In
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
