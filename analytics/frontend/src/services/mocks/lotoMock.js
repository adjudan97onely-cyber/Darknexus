// Mock Loto — 49 numéros, tirage de 6
// Données indépendantes du Keno et de l'EuroMillions

const buildScores = (hotNums, coldNums, pool) => {
  const scores = {};
  for (let i = 1; i <= pool; i++) {
    if (hotNums.includes(i))  scores[i] = +(0.72 + Math.random() * 0.18).toFixed(2);
    else if (coldNums.includes(i)) scores[i] = +(0.12 + Math.random() * 0.20).toFixed(2);
    else scores[i] = +(0.30 + Math.random() * 0.38).toFixed(2);
  }
  return scores;
};

const HOT  = [7, 14, 23, 29, 38, 42, 11, 3];
const COLD = [1, 17, 31, 45, 48, 6, 34, 49];

export const lotoMock = {
  analysis: {
    type: 'loto',
    total_draws: 1248,
    reliability_score: 71,
    volatility_score: 3.1,
    is_normal_distribution: true,
    chi_square: 47.2,
    hot_numbers: [7, 14, 23, 29, 38],
    cold_numbers: [1, 17, 31, 45, 48],
    scores: buildScores(HOT, COLD, 49),
    confidence: 0.71,
    status: 'mock',
  },

  recommendations: {
    data: [
      { prediction_id: 'loto-r1', numbers: [7],  reason: 'Fréquence élevée sur 200 tirages', target_draw_label: 'Prochain tirage',    confidence: 79, volatility: 2.1 },
      { prediction_id: 'loto-r2', numbers: [14], reason: 'Retard de 12 tirages',             target_draw_label: 'Dans 2 tirages',      confidence: 74, volatility: 1.8 },
      { prediction_id: 'loto-r3', numbers: [23], reason: 'Tendance haussière récente',        target_draw_label: 'Prochain tirage',    confidence: 68, volatility: 2.5 },
      { prediction_id: 'loto-r4', numbers: [29], reason: 'Pic de fréquence mensuel',          target_draw_label: 'Cette semaine',      confidence: 65, volatility: 3.0 },
      { prediction_id: 'loto-r5', numbers: [38], reason: 'Convergence fréquence + retard',    target_draw_label: 'Prochain tirage',    confidence: 72, volatility: 1.6 },
      { prediction_id: 'loto-r6', numbers: [42], reason: 'Numéro chaud sur 50 tirages',       target_draw_label: 'Dans 3 tirages',     confidence: 63, volatility: 2.9 },
    ],
  },

  grids: {
    data: [
      { prediction_id: 'loto-g1', numbers: [7, 14, 23, 29, 38, 42], confidence: 79, volatility: 2.1, reasoning: 'Combinaison optimisée fréquence + tendance récente' },
      { prediction_id: 'loto-g2', numbers: [3, 11, 23, 31, 38, 47], confidence: 74, volatility: 2.5, reasoning: 'Mix numéros chauds + numéros en retard' },
      { prediction_id: 'loto-g3', numbers: [7, 17, 24, 33, 40, 45], confidence: 68, volatility: 3.0, reasoning: 'Distribution équilibrée par décennie' },
      { prediction_id: 'loto-g4', numbers: [4, 14, 22, 35, 42, 48], confidence: 65, volatility: 3.2, reasoning: 'Stratégie retard — numéros absents 8+ tirages' },
      { prediction_id: 'loto-g5', numbers: [9, 18, 27, 36, 44, 49], confidence: 61, volatility: 3.8, reasoning: 'Couverture maximale — un numéro par décennie' },
    ],
  },

  latest: {
    numbers: [7, 14, 23, 31, 38, 42],
    draw_date: '29/03/2026',
    lottery_type: 'loto',
    complementaire: 11,
  },

  history: {
    data: [
      { id: 'loto-h1', draw_date: '29/03/2026', lottery_type: 'Loto', numbers: [7,  14, 23, 31, 38, 42] },
      { id: 'loto-h2', draw_date: '26/03/2026', lottery_type: 'Loto', numbers: [3,  11, 19, 27, 35, 47] },
      { id: 'loto-h3', draw_date: '22/03/2026', lottery_type: 'Loto', numbers: [8,  15, 24, 33, 40, 48] },
      { id: 'loto-h4', draw_date: '19/03/2026', lottery_type: 'Loto', numbers: [2,  10, 22, 30, 39, 45] },
      { id: 'loto-h5', draw_date: '15/03/2026', lottery_type: 'Loto', numbers: [6,  13, 25, 34, 41, 46] },
      { id: 'loto-h6', draw_date: '12/03/2026', lottery_type: 'Loto', numbers: [1,  9,  20, 28, 36, 44] },
      { id: 'loto-h7', draw_date: '08/03/2026', lottery_type: 'Loto', numbers: [5,  16, 26, 32, 37, 43] },
      { id: 'loto-h8', draw_date: '05/03/2026', lottery_type: 'Loto', numbers: [4,  12, 21, 29, 38, 49] },
    ],
  },

  autoSelect: {
    data: [
      { prediction_id: 'loto-auto1', numbers: [7, 14, 23, 29, 38, 42], confidence: 79, reliability: 71 },
      { prediction_id: 'loto-auto2', numbers: [3, 11, 23, 31, 38, 47], confidence: 74, reliability: 66 },
      { prediction_id: 'loto-auto3', numbers: [7, 17, 24, 33, 40, 45], confidence: 68, reliability: 61 },
    ],
  },
};
