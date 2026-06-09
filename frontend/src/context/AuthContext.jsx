import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { assessmentAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null); // null = unknown, true/false = known

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const res = await assessmentAPI.getStatus();
      setOnboardingCompleted(res.data.onboarding_completed);
    } catch (err) {
      console.error("Error fetching onboarding status:", err);
      // Default to true to avoid blocking existing users if the endpoint fails
      setOnboardingCompleted(true);
    }
  }, []);

  useEffect(() => {
    // Check active session immediately on load
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('token', session.access_token);
          setToken(session.access_token);
          setUser({
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          });
          // Small delay to ensure token is set in localStorage for API interceptor
          setTimeout(() => fetchOnboardingStatus(), 100);
        }
      } catch (err) {
        console.error("Error checking initial session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const idToken = session.access_token;
        localStorage.setItem('token', idToken);
        setToken(idToken);
        setUser({
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        });
        setTimeout(() => fetchOnboardingStatus(), 100);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOnboardingStatus]);

  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const session = data.session;
    localStorage.setItem('token', session.access_token);
    setToken(session.access_token);
    setUser({
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
    });
    
    // Fetch onboarding status
    setTimeout(() => fetchOnboardingStatus(), 100);
    return data;
  };

  const registerWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) throw error;

    // Check if session is already active (i.e. auto-confirmed)
    const session = data.session;
    if (session) {
      localStorage.setItem('token', session.access_token);
      setToken(session.access_token);
      setUser({
        email: data.user.email,
        displayName: fullName,
      });
    }
    
    // New user — onboarding not yet done
    setOnboardingCompleted(false);
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
    
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setOnboardingCompleted(null);
  };

  const refreshOnboardingStatus = useCallback(async () => {
    await fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login: loginWithEmail, 
        register: registerWithEmail, 
        logout, 
        isAuthenticated: !!user, 
        loading,
        onboardingCompleted,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
