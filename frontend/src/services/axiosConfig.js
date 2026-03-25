/**
 * API Client Centralisé avec Intercepteurs
 * Gère automatique la sérialisation, authentification et erreurs
 */

import axios from 'axios';
import { BACKEND_URL } from './backendUrl';

// Créer une instance axios personnalisée AUTHENTIFIÉE
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTEUR REQUEST - Ajouter le token Bearer
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTEUR RESPONSE - Gérer les erreurs d'authentification
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erreur 401 = Token expiré ou invalide
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Rediriger vers login
      window.location.href = '/login';
    }

    // Erreur 403 = Accès interdit
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }

    // Erreur 500 = Erreur serveur
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Créer une instance NON-AUTHENTIFIÉE pour login, register, etc.
 */
export const apiPublic = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
