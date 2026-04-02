// Mock Performance — Métriques globales et par jeu

export const performanceMock = {
  overview: {
    kpis: {
      active_predictions: 42,
      validated_predictions: 28,
      global_accuracy: 69,
      avg_model_weight: 0.74,
    },
    models: [
      { name: 'Frequency', weight: 0.40, accuracy: 0.72 },
      { name: 'Overdue',   weight: 0.35, accuracy: 0.68 },
      { name: 'Trend',     weight: 0.25, accuracy: 0.65 },
    ],
    recent_results: [
      { id: 'r1', lottery_type: 'Keno',         draw_date: '01/04/2026', numbers: [5, 12, 18, 27, 33, 44] },
      { id: 'r2', lottery_type: 'EuroMillions',  draw_date: '29/03/2026', numbers: [7, 15, 22, 38, 45] },
      { id: 'r3', lottery_type: 'Loto',          draw_date: '28/03/2026', numbers: [3, 11, 24, 36, 42, 49] },
    ],
    recent_predictions: [
      { id: 'p1', subtype: 'keno',         status: 'validée',    confidence: 78, score: 3 },
      { id: 'p2', subtype: 'football',     status: 'validée',    confidence: 82, score: 1 },
      { id: 'p3', subtype: 'euromillions', status: 'en attente', confidence: 65, score: 0 },
      { id: 'p4', subtype: 'loto',         status: 'validée',    confidence: 71, score: 2 },
    ],
    sports_statistics: {
      total_matches: 150,
      btts_rate: 0.48,
      over_2_5_rate: 0.54,
    },
  },

  byType: {
    overview: {
      kpis: {
        global_accuracy: 69,
        active_predictions: 42,
        validated_predictions: 28,
        avg_model_weight: 0.74,
      },
      models: [
        { name: 'Frequency', weight: 0.40, accuracy: 0.72 },
        { name: 'Overdue',   weight: 0.35, accuracy: 0.68 },
        { name: 'Trend',     weight: 0.25, accuracy: 0.65 },
      ],
    },
    by_type: {
      keno:         { accuracy: 72, total: 45, pending: 3 },
      loto:         { accuracy: 68, total: 32, pending: 2 },
      euromillions: { accuracy: 65, total: 28, pending: 1 },
      football:     { accuracy: 70, total: 120, pending: 8 },
    },
  },

  notifications: [
    { id: 'n1', type: 'info',       message: 'Moteur Keno : 4165 tirages FDJ chargés',       created_at: '2026-04-02T08:00:00', read: true  },
    { id: 'n2', type: 'prediction', message: 'Nouvelle grille Keno générée avec 81% confiance', created_at: '2026-04-02T10:30:00', read: false },
    { id: 'n3', type: 'success',    message: 'Backtest Keno : +8.9% vs hasard pur',            created_at: '2026-04-01T18:00:00', read: true  },
    { id: 'n4', type: 'info',       message: 'Prochains matchs : 8 rencontres analysées',      created_at: '2026-04-02T09:00:00', read: false },
  ],
};
