import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import OnboardingAssessment from './pages/OnboardingAssessment';
import Dashboard from './pages/Dashboard';
import MoodTracking from './pages/MoodTracking';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding Assessment Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingAssessment />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mood" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MoodTracking />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/journal" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Journal />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recommendations" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Recommendations />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
