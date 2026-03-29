/**
 * STATISTIQUES HELPERS
 * 
 * Analyse de fréquences, patterns, etc.
 */

/**
 * Analyse la fréquence des numéros dans les tirages historiques
 * @param {Array} draws - [{date, numbers: [...]}, ...]
 * @param {Number} maxNumber - Valeur max (70 pour Keno, 49 pour Loto)
 * @returns {Object} { hot, cold, normal, hotCount, coldCount, spread }
 */
export function frequencyAnalyzer(draws, maxNumber = 70) {
  if (!draws || draws.length === 0) {
    return {
      hot: [],
      cold: Array.from({ length: maxNumber }, (_, i) => i + 1).slice(0, 10),
      normal: Array.from({ length: maxNumber }, (_, i) => i + 1).slice(10),
      hotCount: 0,
      coldCount: 10,
      spread: 0,
      confidence: 0.4
    };
  }

  // Compter fréquence de chaque numéro
  const freqMap = {};
  for (let i = 1; i <= maxNumber; i++) {
    freqMap[i] = 0;
  }

  draws.forEach(draw => {
    if (draw.numbers && Array.isArray(draw.numbers)) {
      draw.numbers.forEach(n => {
        if (n >= 1 && n <= maxNumber) {
          freqMap[n] = (freqMap[n] || 0) + 1;
        }
      });
    }
  });

  // Calculer moyenne et écart-type
  const frequencies = Object.values(freqMap);
  const average = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
  const variance = frequencies.reduce((a, b) => a + Math.pow(b - average, 2), 0) / frequencies.length;
  const stdDev = Math.sqrt(variance);

  // Threshold: hot si > average + 0.8*stdDev, cold si < average - 0.5*stdDev
  const hotThreshold = average + 0.8 * stdDev;
  const coldThreshold = average - 0.5 * stdDev;

  const hot = Object.entries(freqMap)
    .filter(([num, freq]) => freq > hotThreshold)
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => parseInt(num));

  const cold = Object.entries(freqMap)
    .filter(([num, freq]) => freq < coldThreshold)
    .sort((a, b) => a[1] - b[1]) // Froids: trier par fréquence croissante
    .map(([num]) => parseInt(num));

  const normal = Object.entries(freqMap)
    .filter(([num, freq]) => freq <= hotThreshold && freq >= coldThreshold)
    .sort((a, b) => b[1] - a[1]) // Sortir par fréquence décroissante
    .map(([num]) => parseInt(num));

  // Spread: écart entre max et min
  const maxFreq = Math.max(...frequencies);
  const minFreq = Math.min(...frequencies);
  const spread = maxFreq - minFreq;

  return {
    hot,
    cold,
    normal,
    hotCount: hot.length,
    coldCount: cold.length,
    normalCount: normal.length,
    spread,
    average: Math.round(average * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    totalDraws: draws.length,
    freqMap,
    confidence: hot.length > cold.length ? 0.65 : 0.55
  };
}

/**
 * Analyse les patterns pair/impair
 */
export function pairOddAnalyzer(draws) {
  let pairCount = 0;
  let oddCount = 0;

  draws.forEach(draw => {
    if (draw.numbers) {
      draw.numbers.forEach(n => {
        if (n % 2 === 0) pairCount++;
        else oddCount++;
      });
    }
  });

  const total = pairCount + oddCount;
  return {
    pairCount,
    oddCount,
    pairPercentage: Math.round((pairCount / total) * 100),
    oddPercentage: Math.round((oddCount / total) * 100),
    isBalanced: Math.abs(pairCount - oddCount) < Math.round(total * 0.1)
  };
}

/**
 * Analyse les numéros consécutifs
 */
export function consecutiveAnalyzer(draws) {
  const consecutivePairs = {};

  draws.forEach(draw => {
    if (draw.numbers) {
      const sorted = [...draw.numbers].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1] - sorted[i] === 1) {
          const key = `${sorted[i]}-${sorted[i + 1]}`;
          consecutivePairs[key] = (consecutivePairs[key] || 0) + 1;
        }
      }
    }
  });

  return {
    consecutivePairs,
    frequency: Object.values(consecutivePairs).reduce((a, b) => a + b, 0) || 0,
    recommendation: Object.values(consecutivePairs).length > 0 ? 'Éviter trop de consécutifs' : 'OK'
  };
}

/**
 * Analyse la distribution des numéros par plages
 * Ex: 1-10, 11-20, 21-30, etc.
 */
export function rangeAnalyzer(draws, rangeSize = 10) {
  const maxNumber = Math.max(
    ...draws.flatMap(d => d.numbers || [])
  );
  const rangeCount = Math.ceil(maxNumber / rangeSize);
  const ranges = {};

  for (let i = 0; i < rangeCount; i++) {
    ranges[`${i * rangeSize + 1}-${(i + 1) * rangeSize}`] = 0;
  }

  draws.forEach(draw => {
    if (draw.numbers) {
      draw.numbers.forEach(n => {
        const rangeKey = `${Math.floor((n - 1) / rangeSize) * rangeSize + 1}-${(Math.floor((n - 1) / rangeSize) + 1) * rangeSize}`;
        if (ranges[rangeKey] !== undefined) {
          ranges[rangeKey]++;
        }
      });
    }
  });

  return ranges;
}

/**
 * Récente décalé: comparaison entre prédictions et résultats
 */
export function comparisonMetrics(predictions, realResults) {
  const matched = predictions.filter(n => realResults.includes(n));
  const correct = matched.length;
  const total = predictions.length;
  const accuracy = Math.round((correct / total) * 100);

  return {
    predicted: predictions,
    real: realResults,
    matched,
    correctCount: correct,
    totalPredicted: total,
    accuracy,
    feedback: accuracy > 50 ? 'Excellence!' : accuracy > 30 ? 'Bon' : 'À améliorer'
  };
}

/**
 * Calcule une tendance: si les numéros vont vers le haut ou le bas en fréquence
 */
export function trendAnalyzer(draws, timeWindow = 10) {
  if (!draws || draws.length < 2) return null;

  const recentDraws = draws.slice(-timeWindow);
  const olderDraws = draws.slice(-timeWindow * 2, -timeWindow);

  if (olderDraws.length === 0 || recentDraws.length === 0) return null;

  const recentFreq = frequencyAnalyzer(recentDraws, 70);
  const olderFreq = frequencyAnalyzer(olderDraws, 70);

  // Comparer les top 5 numéros
  const recentTop5 = recentFreq.hot.slice(0, 5);
  const olderTop5 = olderFreq.hot.slice(0, 5);

  const commonInBoth = recentTop5.filter(n => olderTop5.includes(n));

  return {
    stabilityScore: Math.round((commonInBoth.length / 5) * 100),
    trend: commonInBoth.length > 2 ? 'STABLE' : 'VOLATILE',
    recommendation: commonInBoth.length > 2 
      ? 'Continuer stratégie similaire'
      : 'Adapter prédictions aux nouvelles tendances'
  };
}

export default {
  frequencyAnalyzer,
  pairOddAnalyzer,
  consecutiveAnalyzer,
  rangeAnalyzer,
  comparisonMetrics,
  trendAnalyzer
};
