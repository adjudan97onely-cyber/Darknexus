/**
 * VALIDATEUR DE PRÉDICTIONS
 * 
 * Compare prédictions vs résultats réels
 * Calcule scores et accuracy
 */

/**
 * Évalue une prédiction LOTO/KENO
 * @param {Object} prediction - {type, numbers, bonus?, stars?}
 * @param {Object} result - {type, numbers, bonus?, stars?}
 * @returns {Object} {matched, score, accuracy, success}
 */
export function evaluateLotteryPrediction(prediction, result) {
  if (!prediction || !result || prediction.type !== result.type) {
    return {
      success: false,
      error: 'Type mismatch or invalid data',
      score: 0
    };
  }

  const type = prediction.type; // 'keno', 'loto', 'euromillions'

  // Comparer numéros principaux
  const matchedNumbers = (prediction.numbers || [])
    .filter(n => (result.numbers || []).includes(n));

  const totalPredicted = prediction.numbers?.length || 0;
  const accuracy = totalPredicted > 0 
    ? Math.round((matchedNumbers.length / totalPredicted) * 100)
    : 0;

  // Score brut (0-100)
  let score = Math.round((matchedNumbers.length / totalPredicted) * 100);

  // Bonus/Penalties
  let bonusPoints = 0;

  // --
 BONUS NUMÉROS BONUS (loto)
  if (type === 'loto' && prediction.bonus && result.bonus) {
    if (prediction.bonus === result.bonus) {
      bonusPoints += 15; // Bonus trouvé = +15 points
    }
  }

  // BONUS ÉTOILES (euromillions)
  if (type === 'euromillions' && prediction.stars && result.stars) {
    const matchedStars = prediction.stars.filter(s => result.stars.includes(s));
    bonusPoints += matchedStars.length * 10; // Chaque étoile = +10 points
  }

  // Calculer score final (0-100+)
  const finalScore = Math.min(100, score + bonusPoints);

  // Déterminer succès
  const successThreshold = type === 'keno' ? 40 : type === 'loto' ? 50 : 30;
  const success = accuracy >= successThreshold;

  return {
    type,
    predicted: prediction.numbers,
    real: result.numbers,
    matched: matchedNumbers,
    matchCount: matchedNumbers.length,
    totalPredicted,
    accuracy,
    score: finalScore,
    bonusPoints,
    success,
    feedback: generateLotteryFeedback(accuracy, type, matchCount),
    timestamp: new Date().toISOString()
  };
}

/**
 * Évalue une prédiction FOOTBALL
 */
export function evaluateFootballPrediction(prediction, matchResult) {
  // prediction.mainPrediction: '1', 'X', '2'
  // matchResult: { result: '1'|'X'|'2', score: '2-1' }

  if (!prediction || !matchResult) {
    return {
      success: false,
      error: 'Invalid data',
      score: 0
    };
  }

  const predictedResult = prediction.mainPrediction;
  const realResult = matchResult.result || determineResult(matchResult.score);

  const mainResultCorrect = predictedResult === realResult;
  let score = mainResultCorrect ? 100 : 50; // 100 si bon, 50 si partiel

  // Évaluer Over/Under si disponible
  let overUnderBonus = 0;
  if (prediction.secondaryPredictions && matchResult.totalGoals !== undefined) {
    const overUnderPred = prediction.secondaryPredictions.find(p => p.type === 'Over/Under');
    if (overUnderPred) {
      const isOver = matchResult.totalGoals > 2.5;
      const predictedOver = overUnderPred.prediction === 'Over 2.5';
      if (isOver === predictedOver) {
        overUnderBonus = 20;
      }
    }
  }

  score += overUnderBonus;

  // Évaluer BTTS si disponible
  let bttsBonus = 0;
  if (prediction.secondaryPredictions && matchResult.btts !== undefined) {
    const bttsPred = prediction.secondaryPredictions.find(p => p.type === 'BTTS');
    if (bttsPred) {
      const predictedBtts = bttsPred.prediction === 'Yes';
      if (matchResult.btts === predictedBtts) {
        bttsBonus = 15;
      }
    }
  }

  score += bttsBonus;

  // Score final (0-135, normaliser à 100)
  const finalScore = Math.min(100, Math.round((score / 135) * 100));

  return {
    match: prediction.match || `${prediction.homeTeam} vs ${prediction.awayTeam}`,
    predicted: predictedResult,
    real: realResult,
    mainResultCorrect,
    score: finalScore,
    overUnderBonus,
    bttsBonus,
    confidence: prediction.confidence,
    predictionProb: prediction.mainPredictionProb,
    success: mainResultCorrect,
    feedback: generateFootballFeedback(mainResultCorrect, score),
    timestamp: new Date().toISOString()
  };
}

/**
 * Batch evaluation: évaluer plusieurs prédictions à la fois
 */
export function evaluateBatchPredictions(predictions, results) {
  const evaluations = predictions.map(pred => {
    const result = results.find(r => 
      r.type === pred.type && 
      arraysEqual(r.numbers, pred.numbers)
    );

    if (!result) return null;

    return pred.type === 'football'
      ? evaluateFootballPrediction(pred, result)
      : evaluateLotteryPrediction(pred, result);
  }).filter(e => e !== null);

  // Calculer statistiques globales
  const totalPredictions = evaluations.length;
  const successCount = evaluations.filter(e => e.success).length;
  const avgScore = Math.round(
    evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / totalPredictions
  );

  return {
    totalEvaluated: totalPredictions,
    successCount,
    successRate: Math.round((successCount / totalPredictions) * 100),
    avgScore,
    evaluations,
    overallFeedback: generateOverallFeedback(successCount, totalPredictions),
    timestamp: new Date().toISOString()
  };
}

/**
 * Calcule des métriques d'accuracy sur du long terme
 */
export function calculateAccuracyMetrics(evaluationHistory) {
  if (!evaluationHistory || evaluationHistory.length === 0) {
    return {
      totalEvaluations: 0,
      successRate: 0,
      avgScore: 0,
      bestStreak: 0,
      worstStreak: 0
    };
  }

  const total = evaluationHistory.length;
  const successes = evaluationHistory.filter(e => e.success).length;
  const scores = evaluationHistory.map(e => e.score || 0);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);

  // Calculer streaks
  let currentStreak = 0;
  let maxStreak = 0;
  let minStreak = 0;

  for (let eval of evaluationHistory) {
    if (eval.success) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
      minStreak++;
    }
  }

  return {
    totalEvaluations: total,
    successCount: successes,
    successRate: Math.round((successes / total) * 100),
    avgScore,
    bestStreak: maxStreak,
    worstStreak: minStreak,
    trend: calculateTrend(evaluationHistory)
  };
}

// ============ HELPERS ============

function determineResult(scoreStr) {
  if (!scoreStr) return '?';
  const [home, away] = scoreStr.split('-').map(Number);
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

function generateLotteryFeedback(accuracy, type, matchCount) {
  if (accuracy > 60) return '🎯 Excellent! Prédiction très fiable';
  if (accuracy > 40) return '✅ Bon! Dans la bonne direction';
  if (accuracy > 20) return '⚠️ Moyen, à améliorer';
  return '❌ À revoir';
}

function generateFootballFeedback(correct, score) {
  if (correct) return '✅ Bonne prédiction!';
  if (score > 70) return '⚠️ Proche du bon résultat';
  if (score > 50) return '⚠️ Partiel';
  return '❌ À revisr';
}

function generateOverallFeedback(successes, total) {
  const rate = (successes / total) * 100;
  if (rate > 60) return '🚀 Excellente accuracy!';
  if (rate > 45) return '✅ Bonne performance';
  if (rate > 35) return '⚠️ Acceptable';
  return '📊 À améliorer - Calibrer les seuils';
}

function calculateTrend(evaluationHistory) {
  if (evaluationHistory.length < 3) return 'INSUFFICIENT_DATA';

  const recent = evaluationHistory.slice(-5); // Dernières 5
  const older = evaluationHistory.slice(-10, -5); // 5 avant

  const recentRate = recent.filter(e => e.success).length / recent.length;
  const olderRate = older.length > 0 ? older.filter(e => e.success).length / older.length : 0;

  if (recentRate > olderRate + 0.1) return 'IMPROVING';
  if (recentRate < olderRate - 0.1) return 'DECLINING';
  return 'STABLE';
}

function arraysEqual(a, b) {
  if (!a || !b) return false;
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

export default {
  evaluateLotteryPrediction,
  evaluateFootballPrediction,
  evaluateBatchPredictions,
  calculateAccuracyMetrics
};
