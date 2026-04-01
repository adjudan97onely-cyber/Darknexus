/**
 * Service API pour les prédictions
 * Enregistre, récupère et suit les prédictions
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const predictionsAPI = {
  /**
   * Enregistre une nouvelle prédiction
   * @param {Object} predictionData - { type: 'keno|loto|euromillions|football', numbers: [], prediction: '', confidence: 0 }
   * @returns {Promise} - { id, status, created_at }
   */
  savePrediction: async (predictionData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/learning/predict`,
        predictionData,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur enregistrement prédiction:', error.message);
      // Retourner un ID local temporaire si l'API échoue
      return {
        id: `LOCAL-${Date.now()}`,
        status: 'local',
        message: 'Enregistrement local (API indisponible)'
      };
    }
  },

  /**
   * Récupère toutes les prédictions actives
   * @returns {Promise<Array>} - Liste des prédictions
   */
  getActivePredictions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/learning/predictions`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération prédictions:', error.message);
      return [];
    }
  },

  /**
   * Enregistre un résultat réel (tirage/match)
   * @param {Object} resultData - { type: 'keno|loto|football', numbers: [], date: '' }
   * @returns {Promise}
   */
  saveResult: async (resultData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/learning/result`,
        resultData,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur enregistrement résultat:', error.message);
      return null;
    }
  },

  /**
   * Récupère les résultats réels pour comparaison
   * @param {string} type - 'keno', 'loto', 'euromillions', 'football'
   * @returns {Promise<Array>}
   */
  getResults: async (type = 'all') => {
    try {
      const url = type === 'all' 
        ? `${API_BASE_URL}/api/learning/results`
        : `${API_BASE_URL}/api/learning/results?type=${type}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération résultats:', error.message);
      return [];
    }
  },

  /**
   * Récupère les statistiques de prédictions
   * @returns {Promise}
   */
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/learning/stats`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error.message);
      return null;
    }
  },

  /**
   * Compare une prédiction avec son résultat
   * @param {string} predictionId
   * @param {Array} realResult
   * @returns {Promise}
   */
  comparePredictionWithResult: async (predictionId, realResult) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/learning/compare`,
        { prediction_id: predictionId, real_result: realResult },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur comparaison:', error.message);
      return null;
    }
  }
};

export default predictionsAPI;
