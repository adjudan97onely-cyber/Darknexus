/**
 * STORAGE MANAGER
 * 
 * Wrapper localStorage pour :
 * - Prédictions
 * - Résultats réels
 * - Évaluations
 */

const STORAGE_KEYS = {
  PREDICTIONS: 'alsp_predictions',
  RESULTS: 'alsp_results',
  EVALUATIONS: 'alsp_evaluations',
  SETTINGS: 'alsp_settings'
};

/**
 * Sauvegarde une prédiction
 */
export function savePrediction(prediction) {
  try {
    const predictions = getPredictions();
    
    // Ajouter timestamp et UUID
    const withMeta = {
      ...prediction,
      id: prediction.id || generateUUID(),
      createdAt: prediction.createdAt || new Date().toISOString()
    };

    predictions.push(withMeta);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
    
    return withMeta;
  } catch (error) {
    console.error('❌ Erreur sauvegarde prédiction:', error);
    return null;
  }
}

/**
 * Récupère toutes les prédictions
 */
export function getPredictions() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Erreur lecture prédictions:', error);
    return [];
  }
}

/**
 * Récupère prédictions par type
 */
export function getPredictionsByType(type) {
  return getPredictions().filter(p => p.type === type);
}

/**
 * Récupère prédictions actives (non évaluées)
 */
export function getActivePredictions() {
  const predictions = getPredictions();
  const evaluations = getEvaluations();

  return predictions.filter(pred => 
    !evaluations.some(eval => eval.predictionId === pred.id)
  );
}

/**
 * Récupère prédictions récenteskeno (derniers X jours)
 */
export function getRecentPredictions(days = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return getPredictions().filter(p => {
    const createdDate = new Date(p.createdAt);
    return createdDate > cutoff;
  });
}

/**
 * Supprime une prédiction
 */
export function deletePrediction(predictionId) {
  try {
    const predictions = getPredictions();
    const filtered = predictions.filter(p => p.id !== predictionId);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression prédiction:', error);
    return false;
  }
}

/**
 * Efface TOUTES les prédictions
 */
export function clearAllPredictions() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PREDICTIONS);
    return true;
  } catch (error) {
    console.error('❌ Erreur clear prédictions:', error);
    return false;
  }
}

// ============ RÉSULTATS ============

/**
 * Sauvegarde un résultat réel
 */
export function saveResult(result) {
  try {
    const results = getResults();
    
    const withMeta = {
      ...result,
      id: result.id || generateUUID(),
      recordedAt: result.recordedAt || new Date().toISOString()
    };

    results.push(withMeta);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    
    return withMeta;
  } catch (error) {
    console.error('❌ Erreur sauvegarde résultat:', error);
    return null;
  }
}

/**
 * Récupère tous les résultats
 */
export function getResults() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Erreur lecture résultats:', error);
    return [];
  }
}

/**
 * Récupère résultats par type
 */
export function getResultsByType(type) {
  return getResults().filter(r => r.type === type);
}

/**
 * Récupère derniers résultats
 */
export function getLatestResults(count = 10) {
  return getResults()
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .slice(0, count);
}

/**
 * Supprime un résultat
 */
export function deleteResult(resultId) {
  try {
    const results = getResults();
    const filtered = results.filter(r => r.id !== resultId);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression résultat:', error);
    return false;
  }
}

/**
 * Efface tous les résultats
 */
export function clearAllResults() {
  try {
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
    return true;
  } catch (error) {
    console.error('❌ Erreur clear résultats:', error);
    return false;
  }
}

// ============ ÉVALUATIONS ============

/**
 * Sauvegarde une évaluation (prédiction vs résultat)
 */
export function saveEvaluation(evaluation) {
  try {
    const evaluations = getEvaluations();
    
    const withMeta = {
      ...evaluation,
      id: evaluation.id || generateUUID(),
      evaluatedAt: evaluation.evaluatedAt || new Date().toISOString()
    };

    evaluations.push(withMeta);
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    
    return withMeta;
  } catch (error) {
    console.error('❌ Erreur sauvegarde évaluation:', error);
    return null;
  }
}

/**
 * Récupère toutes les évaluations
 */
export function getEvaluations() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Erreur lecture évaluations:', error);
    return [];
  }
}

/**
 * Récupère évaluations par type
 */
export function getEvaluationsByType(type) {
  return getEvaluations().filter(e => e.type === type);
}

/**
 * Récupère évaluations récentes
 */
export function getEvaluationStats(typeFilter = null) {
  let evals = getEvaluations();
  
  if (typeFilter) {
    evals = evals.filter(e => e.type === typeFilter);
  }

  if (evals.length === 0) {
    return {
      totalEvaluations: 0,
      successCount: 0,
      successRate: 0,
      avgScore: 0
    };
  }

  const successes = evals.filter(e => e.success).length;
  const avgScore = Math.round(
    evals.reduce((acc, e) => acc + (e.score || 0), 0) / evals.length
  );

  return {
    totalEvaluations: evals.length,
    successCount: successes,
    successRate: Math.round((successes / evals.length) * 100),
    avgScore
  };
}

/**
 * Supprime une évaluation
 */
export function deleteEvaluation(evaluationId) {
  try {
    const evaluations = getEvaluations();
    const filtered = evaluations.filter(e => e.id !== evaluationId);
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression évaluation:', error);
    return false;
  }
}

/**
 * Efface toutes les évaluations
 */
export function clearAllEvaluations() {
  try {
    localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
    return true;
  } catch (error) {
    console.error('❌ Erreur clear évaluations:', error);
    return false;
  }
}

// ============ UTILITIES ============

/**
 * Exporte les données (pour backup/debug)
 */
export function exportAllData() {
  return {
    predictions: getPredictions(),
    results: getResults(),
    evaluations: getEvaluations(),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Importe les données (pour restore)
 */
export function importData(data) {
  try {
    if (data.predictions) {
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(data.predictions));
    }
    if (data.results) {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(data.results));
    }
    if (data.evaluations) {
      localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(data.evaluations));
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur import données:', error);
    return false;
  }
}

/**
 * Efface TOUT
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PREDICTIONS);
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
    localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
    return true;
  } catch (error) {
    console.error('❌ Erreur clear tout:', error);
    return false;
  }
}

/**
 * Génère UUID simple
 */
function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  // Prédictions
  savePrediction,
  getPredictions,
  getPredictionsByType,
  getActivePredictions,
  getRecentPredictions,
  deletePrediction,
  clearAllPredictions,

  // Résultats
  saveResult,
  getResults,
  getResultsByType,
  getLatestResults,
  deleteResult,
  clearAllResults,

  // Évaluations
  saveEvaluation,
  getEvaluations,
  getEvaluationsByType,
  getEvaluationStats,
  deleteEvaluation,
  clearAllEvaluations,

  // Utils
  exportAllData,
  importData,
  clearAllData
};
