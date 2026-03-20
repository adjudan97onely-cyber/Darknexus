import axios from 'axios';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const PRIVATE_IP_REGEX = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
const LOCAL_URL_REGEX = /localhost|127\.0\.0\.1|0\.0\.0\.0/i;

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const isLocalHost = (host) => {
  if (!host) return false;
  return LOCAL_HOSTS.has(host) || PRIVATE_IP_REGEX.test(host);
};

const resolveApiBaseUrl = () => {
  const envUrl = trimTrailingSlash((import.meta.env.VITE_API_URL || '').trim());

  if (typeof window === 'undefined') {
    return envUrl || 'http://localhost:5001';
  }

  const { protocol, hostname, origin } = window.location;
  const localClient = isLocalHost(hostname);

  if (localClient) {
    const envLooksLocal = LOCAL_URL_REGEX.test(envUrl);
    if (envUrl && envLooksLocal) {
      return envUrl;
    }
    return `${protocol}//${hostname}:5001`;
  }

  // En production, on force même origine pour passer par /api rewrite (évite CORS).
  return trimTrailingSlash(origin);
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

// Retry léger pour les démarrages à froid backend et réseaux mobiles instables.
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config || {};
  const method = String(config.method || 'get').toLowerCase();
  const isRetryableMethod = RETRYABLE_METHODS.has(method);
  const isNetworkError = !error.response;
  const isTimeout = error.code === 'ECONNABORTED';

  if (isRetryableMethod && (isNetworkError || isTimeout) && !config.__retried) {
    config.__retried = true;
    await new Promise((resolve) => setTimeout(resolve, 900));
    return api(config);
  }

  throw error;
});

export const getApiErrorMessage = (error, fallback = 'Erreur de connexion au service.') => {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Le serveur met trop de temps à répondre. Réessaie dans quelques secondes.';
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Aucune connexion internet détectée sur ton appareil.';
  }
  if (!error?.response) {
    return 'Connexion réseau instable. Vérifie internet puis réessaie.';
  }
  return fallback;
};

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

// ── Bilan IA : comparatif prédictions vs réalité ──────────────────
export const bilanAPI = {
  getLotteryBilan: (subtype, limit = 20) =>
    api.get(`/api/rapport/lottery/${subtype}`, { params: { limit } }),
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
