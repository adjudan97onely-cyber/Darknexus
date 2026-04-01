/**
 * AI PREDICTION ENGINE
 * 
 * Orchestrateur central pour :
 * - Générer toutes les prédictions (Keno + Loto + Football)
 * - Évaluer les prédictions réelles
 * - Gérer l'historique
 * - Calculer les métriques
 */

import { generateKenoPredicition, generateLotoPrediction, generateEuroMillionsPrediction } from '../logic/lottoPredictionLogic.js';
import { predictFootballMatch, predictMultipleMatches } from '../logic/footballPredictionLogic.js';
import { evaluateLotteryPrediction, evaluateFootballPrediction, calculateAccuracyMetrics } from '../services/predictionValidator.js';
import * as storageManager from '../utils/storageManager.js';

// ============ API CALLS ============

import { lotteryAPI, sportsAPI } from './api.js';

// ============ MAIN PREDICTION ENGINE ============

/**
 * Génère toutes les prédictions du jour
 * - Keno (10 grilles)
 * - Loto (1 grille)
 * - EuroMillions (1 grille)
 * - Football (toutes les matches du jour)
 */
export async function generateAllPredictions() {
  try {
    console.log('🚀 Generating all predictions...');
    
    const predictions = [];
    const errors = [];

    // 1️⃣ KENO PREDICTIONS
    try {
      const kenoDraws = await lotteryAPI.getHistory('keno', 10);
      
      if (kenoDraws && kenoDraws.length > 0) {
        for (let i = 0; i < 10; i++) {
          const kenoPred = generateKenoPredicition(kenoDraws, { gridNumber: i + 1 });
          const saved = storageManager.savePrediction({
            type: 'keno',
            prediction: kenoPred,
            source: 'aiEngine'
          });
          predictions.push(saved);
        }
        console.log('✅ Keno: 10 grilles générées');
      }
    } catch (error) {
      console.error('⚠️ Keno error:', error.message);
      errors.push({ type: 'keno', error: error.message });
    }

    // 2️⃣ LOTO PREDICTIONS
    try {
      const lotoDraws = await lotteryAPI.getHistory('loto', 10);
      
      if (lotoDraws && lotoDraws.length > 0) {
        const lotoPred = generateLotoPrediction(lotoDraws);
        const saved = storageManager.savePrediction({
          type: 'loto',
          prediction: lotoPred,
          source: 'aiEngine'
        });
        predictions.push(saved);
        console.log('✅ Loto: 1 grille générée');
      }
    } catch (error) {
      console.error('⚠️ Loto error:', error.message);
      errors.push({ type: 'loto', error: error.message });
    }

    // 3️⃣ EUROMILLIONS PREDICTIONS
    try {
      const euroDraws = await lotteryAPI.getHistory('euromillions', 10);
      
      if (euroDraws && euroDraws.length > 0) {
        const euroPred = generateEuroMillionsPrediction(euroDraws);
        const saved = storageManager.savePrediction({
          type: 'euromillions',
          prediction: euroPred,
          source: 'aiEngine'
        });
        predictions.push(saved);
        console.log('✅ EuroMillions: 1 grille générée');
      }
    } catch (error) {
      console.error('⚠️ EuroMillions error:', error.message);
      errors.push({ type: 'euromillions', error: error.message });
    }

    // 4️⃣ FOOTBALL PREDICTIONS
    try {
      const matches = await sportsAPI.getUpcomingMatches({ limit: 50 });
      
      if (matches && matches.length > 0) {
        // Récupérer les stats pour chaque match
        const allTeamStats = {};
        const uniqueTeams = [...new Set(matches.flatMap(m => [m.homeTeam.name, m.awayTeam.name]))];
        
        for (const team of uniqueTeams) {
          try {
            allTeamStats[team] = await sportsAPI.getTeamForm(team);
          } catch (e) {
            console.warn(`⚠️ Impossible de récupérer les stats pour ${team}`);
          }
        }

        // Générer les prédictions
        const footballPreds = predictMultipleMatches(matches, allTeamStats);
        
        for (const pred of footballPreds) {
          const saved = storageManager.savePrediction({
            type: 'football',
            prediction: pred,
            matchId: pred.matchId,
            source: 'aiEngine'
          });
          predictions.push(saved);
        }
        console.log(`✅ Football: ${footballPreds.length} matches prédits`);
      }
    } catch (error) {
      console.error('⚠️ Football error:', error.message);
      errors.push({ type: 'football', error: error.message });
    }

    // Retourner résumé
    return {
      success: true,
      totalGenerated: predictions.length,
      predictions,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    console.error('❌ generateAllPredictions fatal error:', error);
    return {
      success: false,
      error: error.message,
      totalGenerated: 0
    };
  }
}

/**
 * Évalue toutes les prédictions actives contre les résultats réels
 */
export async function evaluateAllPredictions() {
  try {
    console.log('📊 Evaluating predictions...');
    
    const activePredictions = storageManager.getActivePredictions();
    const evaluations = [];
    const errors = [];

    for (const pred of activePredictions) {
      try {
        // Chercher le résultat réel
        const results = storageManager.getResults();
        const result = results.find(r => 
          r.type === pred.type && 
          r.drawDate === pred.createdAt?.split('T')[0]
        );

        if (!result) {
          console.log(`⏳ Pas de résultat encore pour ${pred.type}`);
          continue;
        }

        let evaluation;

        if (pred.type === 'football') {
          evaluation = evaluateFootballPrediction(pred.prediction, result);
        } else {
          // Keno, Loto, EuroMillions
          evaluation = evaluateLotteryPrediction(pred.prediction, result);
        }

        // Sauvegarder l'évaluation
        const saved = storageManager.saveEvaluation({
          predictionId: pred.id,
          type: pred.type,
          evaluation,
          matchedAt: new Date().toISOString()
        });

        evaluations.push(saved);
        console.log(`✅ ${pred.type}: Evaluated (score: ${evaluation.score})`);

      } catch (error) {
        console.error(`⚠️ Evaluation error for ${pred.type}:`, error.message);
        errors.push({ predictionId: pred.id, error: error.message });
      }
    }

    return {
      success: true,
      totalEvaluated: evaluations.length,
      evaluations,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    console.error('❌ evaluateAllPredictions fatal error:', error);
    return {
      success: false,
      error: error.message,
      totalEvaluated: 0
    };
  }
}

/**
 * Retourne les stats du système global
 */
export function getSystemAccuracy() {
  try {
    const allEvaluations = storageManager.getEvaluations();

    if (allEvaluations.length === 0) {
      return {
        totalEvaluations: 0,
        successCount: 0,
        overallAccuracy: 0,
        byType: {}
      };
    }

    // Stats globales
    const successes = allEvaluations.filter(e => e.evaluation?.success).length;
    const overallAccuracy = Math.round((successes / allEvaluations.length) * 100);

    // Stats par type
    const byType = {};
    ['keno', 'loto', 'euromillions', 'football'].forEach(type => {
      const typeEvals = allEvaluations.filter(e => e.type === type);
      if (typeEvals.length > 0) {
        const typeSuccesses = typeEvals.filter(e => e.evaluation?.success).length;
        byType[type] = {
          total: typeEvals.length,
          successes: typeSuccesses,
          accuracy: Math.round((typeSuccesses / typeEvals.length) * 100),
          avgScore: Math.round(
            typeEvals.reduce((acc, e) => acc + (e.evaluation?.score || 0), 0) / typeEvals.length
          )
        };
      }
    });

    return {
      totalEvaluations: allEvaluations.length,
      successCount: successes,
      overallAccuracy,
      byType
    };

  } catch (error) {
    console.error('❌ getSystemAccuracy error:', error);
    return {
      totalEvaluations: 0,
      successCount: 0,
      overallAccuracy: 0,
      error: error.message
    };
  }
}

/**
 * Renvoit les prédictions actuelles sans résultats
 */
export function getActivePredictionsForDisplay() {
  try {
    const activePreds = storageManager.getActivePredictions();

    return activePreds.map(pred => ({
      id: pred.id,
      type: pred.type,
      createdAt: pred.createdAt,
      ...pred.prediction
    }));

  } catch (error) {
    console.error('❌ getActivePredictionsForDisplay error:', error);
    return [];
  }
}

/**
 * Renvoit l'historique des prédictions évaluées
 */
export function getPredictionHistory(typeFilter = null, limit = 20) {
  try {
    let evals = storageManager.getEvaluations();

    if (typeFilter) {
      evals = evals.filter(e => e.type === typeFilter);
    }

    return evals
      .sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt))
      .slice(0, limit)
      .map(eval => ({
        id: eval.id,
        type: eval.type,
        score: eval.evaluation?.score || 0,
        success: eval.evaluation?.success || false,
        matchedAt: eval.matchedAt,
        feedback: eval.evaluation?.feedback
      }));

  } catch (error) {
    console.error('❌ getPredictionHistory error:', error);
    return [];
  }
}

/**
 * Exporte toutes les données pour debug
 */
export function debugExportAll() {
  return {
    predictions: storageManager.getPredictions(),
    results: storageManager.getResults(),
    evaluations: storageManager.getEvaluations(),
    accuracy: getSystemAccuracy(),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Nettoie les données vieilles
 */
export function cleanupOldData(daysOld = 30) {
  try {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const predictions = storageManager.getPredictions();
    const results = storageManager.getResults();
    const evaluations = storageManager.getEvaluations();

    const newPredictions = predictions.filter(p => new Date(p.createdAt) > cutoff);
    const newResults = results.filter(r => new Date(r.recordedAt) > cutoff);
    const newEvaluations = evaluations.filter(e => new Date(e.evaluatedAt) > cutoff);

    localStorage.setItem('alsp_predictions', JSON.stringify(newPredictions));
    localStorage.setItem('alsp_results', JSON.stringify(newResults));
    localStorage.setItem('alsp_evaluations', JSON.stringify(newEvaluations));

    return {
      success: true,
      deleted: {
        predictions: predictions.length - newPredictions.length,
        results: results.length - newResults.length,
        evaluations: evaluations.length - newEvaluations.length
      }
    };

  } catch (error) {
    console.error('❌ cleanupOldData error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  generateAllPredictions,
  evaluateAllPredictions,
  getSystemAccuracy,
  getActivePredictionsForDisplay,
  getPredictionHistory,
  debugExportAll,
  cleanupOldData
};
