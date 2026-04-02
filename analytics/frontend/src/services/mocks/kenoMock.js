// Mock Keno — 70 numéros, tirage de 20
// Utilisé uniquement quand le backend Keno réel est inaccessible

export const kenoMock = {
  analysis: {
    type: 'keno',
    total_draws: 4165,
    reliability_score: 72,
    volatility_score: 3.1,
    is_normal_distribution: true,
    chi_square: 68.4,
    hot_numbers: [7, 13, 24, 31, 42, 55, 61, 68],
    cold_numbers: [3, 10, 19, 38, 47, 58, 64, 70],
    scores: Object.fromEntries(
      Array.from({ length: 70 }, (_, i) => {
        const n = i + 1;
        const hot = [7, 13, 24, 31, 42, 55, 61, 68].includes(n);
        const cold = [3, 10, 19, 38, 47, 58, 64, 70].includes(n);
        const base = hot ? 0.72 : cold ? 0.18 : 0.42;
        const seed = ((n * 17 + 3) % 100) / 100;
        return [n, +(base + seed * 0.2).toFixed(2)];
      })
    ),
    confidence: 0.72,
    status: 'mock',
  },

  recommendations: {
    data: [
      { prediction_id: 'keno-r1', numbers: [7],  reason: 'Top fréquence court terme (20 tirages)', target_draw_label: 'Prochain tirage', confidence: 81, volatility: 2.3 },
      { prediction_id: 'keno-r2', numbers: [13], reason: 'Retard de 8 tirages vs fréquence attendue', target_draw_label: 'Dans 2 tirages',  confidence: 76, volatility: 2.1 },
      { prediction_id: 'keno-r3', numbers: [24], reason: 'Tendance haussière — +22% sur 100 tirages',  target_draw_label: 'Prochain tirage', confidence: 72, volatility: 2.8 },
      { prediction_id: 'keno-r4', numbers: [31], reason: 'Score composite élevé (freq + retard)',      target_draw_label: 'Cette semaine',  confidence: 69, volatility: 3.2 },
      { prediction_id: 'keno-r5', numbers: [42], reason: 'Stabilité long terme — variance faible',    target_draw_label: 'Prochain tirage', confidence: 74, volatility: 1.9 },
      { prediction_id: 'keno-r6', numbers: [55], reason: 'Numéro chaud moyen terme (500 tirages)',    target_draw_label: 'Dans 3 tirages',  confidence: 67, volatility: 3.5 },
    ],
  },

  grids: {
    data: [
      { prediction_id: 'keno-g1', numbers: [7, 13, 18, 24, 31, 38, 42, 49, 55, 61], confidence: 81, volatility: 2.1, reasoning: 'Stratégie conservative — top fréquences multi-fenêtres' },
      { prediction_id: 'keno-g2', numbers: [5, 11, 22, 29, 34, 41, 48, 57, 63, 68], confidence: 74, volatility: 2.7, reasoning: 'Stratégie équilibrée — mix fréquence + retard' },
      { prediction_id: 'keno-g3', numbers: [3, 10, 19, 28, 35, 44, 53, 58, 64, 70], confidence: 68, volatility: 3.3, reasoning: 'Stratégie agressive — numéros en retard maximum' },
    ],
  },

  latest: {
    numbers: [5, 12, 18, 24, 31, 33, 42, 44, 49, 53, 55, 57, 61, 63, 65, 67, 68, 69, 7, 13],
    draw_date: '02/04/2026',
    lottery_type: 'keno',
  },

  history: {
    data: [
      { id: 'keno-h1', draw_date: '02/04/2026', lottery_type: 'Keno', numbers: [5, 12, 18, 24, 31, 33, 42, 44] },
      { id: 'keno-h2', draw_date: '02/04/2026', lottery_type: 'Keno', numbers: [3, 9, 17, 23, 30, 36, 41, 50] },
      { id: 'keno-h3', draw_date: '01/04/2026', lottery_type: 'Keno', numbers: [7, 14, 22, 29, 35, 43, 51, 58] },
      { id: 'keno-h4', draw_date: '01/04/2026', lottery_type: 'Keno', numbers: [2, 11, 20, 28, 37, 45, 54, 62] },
      { id: 'keno-h5', draw_date: '31/03/2026', lottery_type: 'Keno', numbers: [6, 13, 21, 27, 34, 40, 48, 56] },
      { id: 'keno-h6', draw_date: '31/03/2026', lottery_type: 'Keno', numbers: [1, 8, 16, 25, 32, 39, 47, 55] },
      { id: 'keno-h7', draw_date: '30/03/2026', lottery_type: 'Keno', numbers: [4, 10, 19, 26, 33, 42, 50, 60] },
      { id: 'keno-h8', draw_date: '30/03/2026', lottery_type: 'Keno', numbers: [7, 15, 23, 31, 38, 44, 52, 61] },
    ],
  },

  autoSelect: {
    data: [
      { prediction_id: 'keno-auto1', numbers: [7, 13, 18, 24, 31, 38, 42, 49, 55, 61], confidence: 81, reliability: 73 },
      { prediction_id: 'keno-auto2', numbers: [5, 11, 22, 29, 34, 41, 48, 57, 63, 68], confidence: 74, reliability: 66 },
      { prediction_id: 'keno-auto3', numbers: [3, 10, 19, 28, 35, 44, 53, 58, 64, 70], confidence: 68, reliability: 61 },
    ],
  },
};
