import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) ||
  'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alsp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour les erreurs
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Endpoints Lotteries
export const lotteryAPI = {
  analyzeLottery: (type) => api.get(`/api/lotteries/analyze/${type}`),
  getStatistics: (type) => api.get(`/api/lotteries/statistics/${type}`),
  getLatestResults: (lottery) => api.get('/api/lotteries/results/latest', { params: lottery ? { lottery } : {} }),
  getHistory: (lottery, limit = 50) => api.get('/api/lotteries/results/history', { params: { lottery, limit } }),
  getRecommendations: (type, topN = 10) => 
    api.get(`/api/lotteries/recommendations/${type}`, { params: { top_n: topN } }),
  generateGrids: (type, numGrids = 5) =>
    api.get(`/api/lotteries/grids/${type}`, { params: { num_grids: numGrids } }),
  autoSelect: (lottery, take = 5, minConfidence = 80) =>
    api.get('/api/auto-select/lottery', { params: { lottery, take, min_confidence: minConfidence } }),
  kenoAnalysis: () => api.get('/api/lotteries/keno/analysis'),
  euromillionsAnalysis: () => api.get('/api/lotteries/euromillions/analysis'),
  lotoAnalysis: () => api.get('/api/lotteries/loto/analysis'),
};

// Endpoints Sports
export const sportsAPI = {
  getLeagues: () => api.get('/api/sports/leagues'),
  getUpcomingMatches: (params = {}) => api.get('/api/sports/matches', { params }),
  predictMatch: (homeTeam, awayTeam) => 
    api.get(`/api/sports/matches/${homeTeam}/vs/${awayTeam}/prediction`),
  predictMultiple: (matches) => 
    api.post('/api/sports/matches/predict', matches),
  getTeamForm: (teamName) => 
    api.get(`/api/sports/team/${teamName}/form`),
  getSportsStatistics: () => 
    api.get('/api/sports/statistics'),
  getSportsRecommendations: (params = {}) => 
    api.get('/api/sports/recommendations', { params }),
  autoSelectSports: (league, take = 5, minConfidence = 80) =>
    api.get('/api/auto-select/sports', { params: { league, take, min_confidence: minConfidence } }),
  footballAnalysis: () => 
    api.get('/api/sports/football/analysis'),
};

export const dashboardAPI = {
  getOverview: () => api.get('/api/dashboard/overview'),
  getPerformance: () => api.get('/api/performance'),
  getPredictionHistory: (type, limit = 100) => api.get('/api/predictions/history', { params: { type, limit } }),
  getPredictionHistoryPaginated: (type, page = 1, perPage = 25) =>
    api.get('/api/predictions/history/paginated', { params: { type, page, per_page: perPage } }),
  getRecentResults: (type, limit = 50) => api.get('/api/results/recent', { params: { type, limit } }),
  getRecentResultsPaginated: (type, page = 1, perPage = 25) =>
    api.get('/api/results/recent/paginated', { params: { type, page, per_page: perPage } }),
  getNotifications: (unreadOnly = false, limit = 20) => api.get('/api/notifications', { params: { unread_only: unreadOnly, limit } }),
  markNotificationsRead: () => api.post('/api/notifications/read'),
  refreshSystem: () => api.post('/api/system/refresh'),
  reconcilePredictions: () => api.post('/api/system/reconcile'),
  getSchedulerStatus: (limit = 20) => api.get('/api/system/scheduler', { params: { limit } }),
};

export const authAPI = {
  register: (email, password) => api.post('/api/auth/register', { email, password }),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/api/subscriptions/plans'),
  getCurrent: () => api.get('/api/subscriptions/current'),
  upgrade: (plan) => api.post('/api/subscriptions/upgrade', { plan }),
};

// Endpoints Health
export const healthAPI = {
  getHealth: () => api.get('/health'),
  getRoot: () => api.get('/'),
};

export default api;
