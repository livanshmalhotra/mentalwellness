import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 Unauthorized and log out user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access detected. Clearing session.");
      localStorage.removeItem('token');
      // If we are not already on the login page, redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password, fullName) => 
    api.post('/api/auth/register', { email, password, full_name: fullName }),
  login: (email, password) => 
    api.post('/api/auth/login', { email, password }),
  getCurrentUser: () => 
    api.get('/api/users/me'), // Not strictly required, but standard
};

export const moodAPI = {
  logMood: (data) => api.post('/api/mood', data),
  getHistory: (limit = 30) => api.get(`/api/mood/history?limit=${limit}`),
};

export const journalAPI = {
  logJournal: (text, isPrivate = false, password = null) => 
    api.post('/api/journal', { text, is_private: isPrivate, password }),
  getHistory: (limit = 30) => api.get(`/api/journal/history?limit=${limit}`),
  hasPasscode: () => api.get('/api/journal/has-passcode'),
  setPasscode: (passcode) => api.post('/api/journal/set-passcode', { passcode }),
  unlockJournal: (id, password) => api.post(`/api/journal/${id}/unlock`, { password }),
  updateJournal: (id, text, password = null) => api.put(`/api/journal/${id}`, { text, password }),
};

export const predictionAPI = {
  predictBurnout: () => api.get('/api/predict/burnout'),
  predictEmotion: (text) => api.get(`/api/predict/emotion?text=${encodeURIComponent(text)}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getTrends: () => api.get('/api/analytics/trends'),
};

export const recommendationAPI = {
  getRecommendations: () => api.get('/api/recommendations'),
  completeRecommendation: (id) => api.put(`/api/recommendations/${id}/complete`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/api/notifications'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
};

export const chatbotAPI = {
  sendMessage: (message) => api.post('/api/chatbot', { message }),
};

export const assessmentAPI = {
  submitAssessment: (data) => api.post('/api/assessment/submit', data),
  getProfile: () => api.get('/api/assessment/profile'),
  getStatus: () => api.get('/api/assessment/status'),
  retakeAssessment: (data) => api.post('/api/assessment/retake', data),
};

export default api;
