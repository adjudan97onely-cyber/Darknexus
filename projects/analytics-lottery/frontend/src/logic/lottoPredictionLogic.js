/**
 * LOGIQUE DE PRÉDICTION LOTO/KENO
 * 
 * Analyse:
 * - Fréquence numéros (chauds/froids)
 * - Équilibre pair/impair
 * - Éviter répétitions récentes
 * - Espacer les numéros (spread)
 */

import { frequencyAnalyzer } from '../utils/statisticsHelpers';

/**
 * Génère une prédiction KENO
 * @param {Array} recentDraws - Derniers tirages: [{date, numbers: [...]}, ...]
 * @param {Object} options - {spreadFactor: 0-1, balancePairOdd: true, confidence: 0-1}
 * @returns {Object} {numbers, confidence, reasoning}
 */
export function generateKenoP rediction(recentDraws = [], options = {}) {
  const {
    spreadFactor = 0.7,
    balancePairOdd = true,
    confidenceBoost = 0.6
  } = options;

  if (!recentDraws || recentDraws.length === 0) {
    return generateRandomKeno(confidenceBoost);
  }

  // Analyser fréquences
  const analysis = frequencyAnalyzer(recentDraws, 70); // Keno: 1-70
  const hotNumbers = analysis.hot;     // Numéros chauds (apparus ++++)
  const coldNumbers = analysis.cold;   // Numéros froids (apparus ----)
  const normalNumbers = analysis.normal; // Numéros normaux

  // Stratégie: 50% chauds + 50% froids
  const selectedCount = 10; // Keno standard: 10 numéros
  const hotCount = Math.ceil(selectedCount * 0.5);
  const coldCount = Math.floor(selectedCount * 0.5);

  // Sélectionner mix
  let prediction = [
    ...hotNumbers.slice(0, hotCount),
    ...coldNumbers.slice(0, coldCount)
  ];

  // Compléter si besoin
  while (prediction.length < selectedCount) {
    const missing = normalNumbers.find(n => !prediction.includes(n));
    if (missing) {
      prediction.push(missing);
    } else {
      break;
    }
  }

  // Appliquer équilibre pair/impair
  if (balancePairOdd) {
    prediction = balancePairOddNumbers(prediction);
  }

  // Trier pour présentation
  prediction = prediction.slice(0, selectedCount).sort((a, b) => a - b);

  // Calculer confidence
  const confidence = calculateKenoConfidence(analysis, prediction);

  return {
    numbers: prediction,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `${hotCount} chauds + ${coldCount} froids, équilibre pair/impair`,
    analysis,
    type: 'keno'
  };
}

/**
 * Génère une prédiction LOTO (6 numéros + bonus)
 */
export function generateLotoPrediction(recentDraws = [], options = {}) {
  const {
    balancePairOdd = true,
    confidenceBoost = 0.6
  } = options;

  if (!recentDraws || recentDraws.length === 0) {
    return generateRandomLoto(confidenceBoost);
  }

  // Analyser fréquences (Loto: 1-49)
  const analysis = frequencyAnalyzer(recentDraws, 49);
  const hotNumbers = analysis.hot;
  const coldNumbers = analysis.cold;
  const normalNumbers = analysis.normal;

  // Stratégie Loto: 3 chauds + 2 froids + 1 normal
  let prediction = [
    ...hotNumbers.slice(0, 3),
    ...coldNumbers.slice(0, 2),
    ...normalNumbers.slice(0, 1)
  ];

  // Appliquer équilibre pair/impair
  if (balancePairOdd) {
    prediction = balancePairOddNumbers(prediction, 49);
  }

  // Trier et limiter à 6
  prediction = prediction.slice(0, 6).sort((a, b) => a - b);

  // Complément (numéro bonus: 1-10)
  const bonus = generateBonusNumber(recentDraws);

  // Calculer confidence
  const confidence = calculateLotoConfidence(analysis, prediction);

  return {
    numbers: prediction,
    bonus,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `3 chauds + 2 froids + 1 normal, bonus: ${bonus}`,
    analysis,
    type: 'loto'
  };
}

/**
 * Génère une prédiction EUROMILLIONS (5 + 2 étoiles)
 */
export function generateEuroMillionsPrediction(recentDraws = [], options = {}) {
  const { balancePairOdd = true, confidenceBoost = 0.6 } = options;

  if (!recentDraws || recentDraws.length === 0) {
    return generateRandomEuroMillions(confidenceBoost);
  }

  // Analyser fréquences (EuroMillions: 1-50)
  const analysis = frequencyAnalyzer(recentDraws, 50);
  const hotNumbers = analysis.hot;
  const coldNumbers = analysis.cold;
  const normalNumbers = analysis.normal;

  // Stratégie: 3 chauds + 2 froids
  let prediction = [
    ...hotNumbers.slice(0, 3),
    ...coldNumbers.slice(0, 2)
  ];

  if (balancePairOdd) {
    prediction = balancePairOddNumbers(prediction, 50);
  }

  prediction = prediction.slice(0, 5).sort((a, b) => a - b);

  // Étoiles (1-12)
  const stars = generateStars(recentDraws);

  // Calculer confidence
  const confidence = calculateEuroMillionsConfidence(analysis, prediction);

  return {
    numbers: prediction,
    stars,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `3 chauds + 2 froids, étoiles: ${stars.join(',')}`,
    analysis,
    type: 'euromillions'
  };
}

/**
 * Analyse d'amélioration: quels numéros additionner/soustraire
 */
export function analyzeImprovement(prediction, realResult, max_number = 70) {
  const matched = prediction.filter(n => realResult.includes(n));
  const missed = prediction.filter(n => !realResult.includes(n));
  const notPredicted = realResult.filter(n => !prediction.includes(n));

  const accuracy = matched.length / prediction.length;

  return {
    matched,
    missed,
    notPredicted,
    accuracy: Math.round(accuracy * 100),
    suggestions: {
      replace: missed.length > 0 ? `Remplacer ${missed.slice(0, 2).join(',')} par d'autres` : undefined,
      addHots: notPredicted.length > 0 ? `Ajouter ${notPredicted.slice(0, 1).join(',')} (apparus)` : undefined
    }
  };
}

// ============ HELPERS ============

/**
 * Génère prédiction KENO aléatoire fiable
 */
function generateRandomKeno(confidence = 0.6) {
  const numbers = [];
  while (numbers.length < 10) {
    const n = Math.floor(Math.random() * 70) + 1;
    if (!numbers.includes(n)) numbers.push(n);
  }
  return {
    numbers: numbers.sort((a, b) => a - b),
    confidence,
    reasoning: "Mode aléatoire (données insuffisantes)",
    type: 'keno'
  };
}

/**
 * Génère prédiction LOTO aléatoire fiable
 */
function generateRandomLoto(confidence = 0.6) {
  const numbers = [];
  while (numbers.length < 6) {
    const n = Math.floor(Math.random() * 49) + 1;
    if (!numbers.includes(n)) numbers.push(n);
  }
  const bonus = Math.floor(Math.random() * 10) + 1;
  return {
    numbers: numbers.sort((a, b) => a - b),
    bonus,
    confidence,
    reasoning: "Mode aléatoire (données insuffisantes)",
    type: 'loto'
  };
}

/**
 * Génère prédiction EUROMILLIONS aléatoire fiable
 */
function generateRandomEuroMillions(confidence = 0.6) {
  const numbers = [];
  while (numbers.length < 5) {
    const n = Math.floor(Math.random() * 50) + 1;
    if (!numbers.includes(n)) numbers.push(n);
  }
  const stars = [];
  while (stars.length < 2) {
    const s = Math.floor(Math.random() * 12) + 1;
    if (!stars.includes(s)) stars.push(s);
  }
  return {
    numbers: numbers.sort((a, b) => a - b),
    stars: stars.sort((a, b) => a - b),
    confidence,
    reasoning: "Mode aléatoire (données insuffisantes)",
    type: 'euromillions'
  };
}

/**
 * Équilibre pair/impair
 */
function balancePairOddNumbers(numbers, maxNumber = 70) {
  const pairs = numbers.filter(n => n % 2 === 0);
  const odds = numbers.filter(n => n % 2 !== 0);

  // Si déséquilibre fort, troquer avec disponibles
  if (pairs.length > odds.length + 1) {
    // Trop de pairs: remplacer un pair par impair disponible
    for (let i = 1; i <= maxNumber; i++) {
      if (i % 2 !== 0 && !numbers.includes(i)) {
        const pairIdx = numbers.findIndex(n => n % 2 === 0);
        if (pairIdx !== -1) {
          numbers[pairIdx] = i;
          break;
        }
      }
    }
  }

  return numbers;
}

/**
 * Génère numéro bonus (1-10)
 */
function generateBonusNumber(recentDraws) {
  if (!recentDraws || recentDraws.length === 0) {
    return Math.floor(Math.random() * 10) + 1;
  }
  // Bonus: 1-10, analyser fréquence
  const bonuses = recentDraws.map(d => d.bonus).filter(b => b);
  if (bonuses.length === 0) return Math.floor(Math.random() * 10) + 1;

  const freqMap = {};
  bonuses.forEach(b => freqMap[b] = (freqMap[b] || 0) + 1);
  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  return parseInt(sorted[0]?.[0] || Math.random() * 10 + 1);
}

/**
 * Génère 2 étoiles (1-12)
 */
function generateStars(recentDraws) {
  if (!recentDraws || recentDraws.length === 0) {
    const s1 = Math.floor(Math.random() * 12) + 1;
    let s2 = Math.floor(Math.random() * 12) + 1;
    while (s2 === s1) s2 = Math.floor(Math.random() * 12) + 1;
    return [s1, s2].sort((a, b) => a - b);
  }

  // Analyser fréquence étoiles
  const starsFlat = [];
  recentDraws.forEach(d => {
    if (d.stars) starsFlat.push(...d.stars);
  });

  const freqMap = {};
  starsFlat.forEach(s => freqMap[s] = (freqMap[s] || 0) + 1);
  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);

  const top = sorted.slice(0, 2).map(e => parseInt(e[0]));
  if (top.length < 2) {
    const s1 = top[0] || (Math.floor(Math.random() * 12) + 1);
    const s2 = Math.floor(Math.random() * 12) + 1;
    return [s1, s2].sort((a, b) => a - b);
  }
  return top.sort((a, b) => a - b);
}

/**
 * Calculate confidence for keno prediction
 */
function calculateKenoConfidence(analysis, prediction) {
  let confidence = 0.6; // Base 60%

  // Bonus si beaucoup de chauds
  if (analysis.hotCount > 6) confidence += 0.1;
  if (analysis.hotCount > 8) confidence += 0.05;

  // Bonus si balance historique claire
  if (analysis.spread > 30) confidence += 0.05;

  return Math.min(confidence, 0.85); // Cap at 85%
}

function calculateLotoConfidence(analysis, prediction) {
  let confidence = 0.62;
  if (analysis.hotCount > 5) confidence += 0.1;
  if (analysis.spread > 25) confidence += 0.05;
  return Math.min(confidence, 0.80);
}

function calculateEuroMillionsConfidence(analysis, prediction) {
  let confidence = 0.65;
  if (analysis.hotCount > 4) confidence += 0.08;
  if (analysis.spread > 20) confidence += 0.05;
  return Math.min(confidence, 0.78);
}

export default {
  generateKenoPredicition,
  generateLotoPrediction,
  generateEuroMillionsPrediction,
  analyzeImprovement
};
