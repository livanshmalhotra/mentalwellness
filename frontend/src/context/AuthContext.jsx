import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force refresh the token to get a fresh Firebase ID token
          const idToken = await firebaseUser.getIdToken(true);
          localStorage.setItem('token', idToken);
          setToken(idToken);
          setUser({
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
          // Fetch onboarding status after login
          // Small delay to ensure token is set in localStorage for API interceptor
          setTimeout(() => fetchOnboardingStatus(), 100);
        } catch (err) {
          console.error("Error getting Firebase ID token:", err);
          logout();
        }
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    localStorage.setItem('token', idToken);
    setToken(idToken);
    setUser({
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    });
    // Fetch onboarding status
    setTimeout(() => fetchOnboardingStatus(), 100);
    return userCredential;
  };

  const registerWithEmail = async (email, password, fullName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update the profile display name in Firebase Auth
    await updateProfile(userCredential.user, { displayName: fullName });
    // Force refresh token to ensure display name/custom claims are in the ID token
    const idToken = await userCredential.user.getIdToken(true);
    localStorage.setItem('token', idToken);
    setToken(idToken);
    setUser({
      email: userCredential.user.email,
      displayName: fullName,
    });
    // New user — onboarding not yet done
    setOnboardingCompleted(false);
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
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
