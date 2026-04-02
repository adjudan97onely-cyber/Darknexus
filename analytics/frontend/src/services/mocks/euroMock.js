// Mock EuroMillions — 50 numéros principaux + 12 étoiles, tirage 5+2
// Données indépendantes du Loto et du Keno

const buildScores = (hotNums, coldNums, pool) => {
  const scores = {};
  for (let i = 1; i <= pool; i++) {
    if (hotNums.includes(i))  scores[i] = +(0.70 + Math.random() * 0.20).toFixed(2);
    else if (coldNums.includes(i)) scores[i] = +(0.10 + Math.random() * 0.22).toFixed(2);
    else scores[i] = +(0.28 + Math.random() * 0.38).toFixed(2);
  }
  return scores;
};

const HOT  = [17, 23, 31, 38, 44, 6, 50, 12];
const COLD = [2,  8,  15, 27, 40, 46, 3, 33];

export const euroMock = {
  analysis: {
    type: 'euromillions',
    total_draws: 2156,
    reliability_score: 68,
    volatility_score: 2.8,
    is_normal_distribution: true,
    chi_square: 49.8,
    hot_numbers: [17, 23, 31, 38, 44],
    cold_numbers: [2, 8, 15, 27, 40],
    scores: buildScores(HOT, COLD, 50),
    confidence: 0.68,
    status: 'mock',
  },

  recommendations: {
    data: [
      { prediction_id: 'euro-r1', numbers: [17], reason: 'Plus fréquent sur 300 tirages', target_draw_label: 'Prochain tirage',  confidence: 77, volatility: 1.9 },
      { prediction_id: 'euro-r2', numbers: [23], reason: 'Retard significatif : 15 tirages', target_draw_label: 'Dans 2 tirages', confidence: 71, volatility: 2.3 },
      { prediction_id: 'euro-r3', numbers: [31], reason: 'Tendance haussière — +18% mois',   target_draw_label: 'Prochain tirage', confidence: 66, volatility: 2.7 },
      { prediction_id: 'euro-r4', numbers: [38], reason: 'Convergence multi-signaux',         target_draw_label: 'Cette semaine',  confidence: 63, volatility: 3.1 },
      { prediction_id: 'euro-r5', numbers: [44], reason: 'Fréquence stable long terme',       target_draw_label: 'Prochain tirage', confidence: 60, volatility: 2.0 },
      { prediction_id: 'euro-r6', numbers: [6],  reason: 'Numéro bas surreprésenté',          target_draw_label: 'Dans 3 tirages',  confidence: 58, volatility: 3.4 },
    ],
  },

  grids: {
    data: [
      { prediction_id: 'euro-g1', numbers: [17, 23, 31, 38, 44], confidence: 77, volatility: 1.9, reasoning: 'Top 5 fréquences long terme + tendance récente' },
      { prediction_id: 'euro-g2', numbers: [6,  17, 29, 38, 50], confidence: 72, volatility: 2.4, reasoning: 'Distribution basse/haute + numéros chauds' },
      { prediction_id: 'euro-g3', numbers: [12, 23, 34, 41, 47], confidence: 67, volatility: 2.9, reasoning: 'Numéros en retard — absents 10+ tirages' },
      { prediction_id: 'euro-g4', numbers: [7,  19, 28, 35, 44], confidence: 63, volatility: 3.3, reasoning: 'Stratégie équilibrée par décennie' },
      { prediction_id: 'euro-g5', numbers: [3,  15, 26, 39, 48], confidence: 59, volatility: 3.7, reasoning: 'Couverture maximale 50 numéros' },
    ],
  },

  latest: {
    numbers: [17, 23, 31, 38, 44],
    draw_date: '01/04/2026',
    lottery_type: 'euromillions',
    stars: [3, 9],
  },

  history: {
    data: [
      { id: 'euro-h1', draw_date: '01/04/2026', lottery_type: 'EuroMillions', numbers: [17, 23, 31, 38, 44] },
      { id: 'euro-h2', draw_date: '29/03/2026', lottery_type: 'EuroMillions', numbers: [5,  14, 27, 36, 49] },
      { id: 'euro-h3', draw_date: '25/03/2026', lottery_type: 'EuroMillions', numbers: [9,  18, 26, 39, 47] },
      { id: 'euro-h4', draw_date: '22/03/2026', lottery_type: 'EuroMillions', numbers: [2,  13, 22, 34, 43] },
      { id: 'euro-h5', draw_date: '18/03/2026', lottery_type: 'EuroMillions', numbers: [7,  16, 25, 37, 46] },
      { id: 'euro-h6', draw_date: '15/03/2026', lottery_type: 'EuroMillions', numbers: [11, 20, 29, 40, 48] },
      { id: 'euro-h7', draw_date: '11/03/2026', lottery_type: 'EuroMillions', numbers: [4,  12, 24, 33, 45] },
      { id: 'euro-h8', draw_date: '08/03/2026', lottery_type: 'EuroMillions', numbers: [8,  19, 28, 36, 50] },
    ],
  },

  autoSelect: {
    data: [
      { prediction_id: 'euro-auto1', numbers: [17, 23, 31, 38, 44], confidence: 77, reliability: 69 },
      { prediction_id: 'euro-auto2', numbers: [6,  17, 29, 38, 50], confidence: 72, reliability: 64 },
      { prediction_id: 'euro-auto3', numbers: [12, 23, 34, 41, 47], confidence: 67, reliability: 60 },
    ],
  },
};
