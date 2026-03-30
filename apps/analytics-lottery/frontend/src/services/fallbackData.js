/**
 * 🔥 FALLBACK DATA - Données par défaut si API échoue
 * Utilisé par safeFetch() comme dernier recours
 */

export const FALLBACK_SPORTS = {
  leagues: [
    { id: 1, name: "Premier League", country: "England", logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: 2, name: "Ligue 1", country: "France", logo: "🇫🇷" },
    { id: 3, name: "La Liga", country: "Spain", logo: "🇪🇸" },
    { id: 4, name: "Serie A", country: "Italy", logo: "🇮🇹" },
    { id: 5, name: "Bundesliga", country: "Germany", logo: "🇩🇪" }
  ],
  
  matches: [
    {
      id: 1,
      homeTeam: "PSG",
      awayTeam: "Manchester United",
      date: new Date().toISOString(),
      prediction: "PSG",
      confidence: 78,
      odds: 1.95
    },
    {
      id: 2,
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      date: new Date().toISOString(),
      prediction: "Real Madrid",
      confidence: 72,
      odds: 2.10
    },
    {
      id: 3,
      homeTeam: "Liverpool",
      awayTeam: "Manchester City",
      date: new Date().toISOString(),
      prediction: "Manchester City",
      confidence: 65,
      odds: 2.30
    }
  ],
  
  statistics: {
    totalMatches: 42,
    correctPredictions: 28,
    accuracy: 66.7,
    avgConfidence: 72,
    lastUpdated: new Date().toISOString()
  },
  
  recommendations: [
    {
      id: 1,
      match: "PSG vs Man United",
      prediction: "PSG Win",
      confidence: 78,
      odds: 1.95,
      status: "HIGH"
    },
    {
      id: 2,
      match: "Real Madrid vs Barcelona",
      prediction: "Real Madrid Win",
      confidence: 72,
      odds: 2.10,
      status: "HIGH"
    }
  ]
};

export const FALLBACK_LOTTERIES = {
  keno: {
    numbers: [3, 8, 14, 22, 29, 31, 37, 42, 55, 60],
    date: new Date().toISOString(),
    confidence: 45,
    grids: [
      { id: 1, numbers: [5, 12, 23, 34, 45, 52, 61, 70], confidence: 48 },
      { id: 2, numbers: [7, 14, 25, 38, 48, 58, 65, 68], confidence: 46 },
      { id: 3, numbers: [2, 11, 24, 36, 47, 55, 62, 69], confidence: 44 }
    ]
  },
  
  loto: {
    numbers: [7, 14, 21, 28, 35, 42],
    bonus: 5,
    date: new Date().toISOString(),
    confidence: 42,
    jackpot: "€2.5M"
  },
  
  euromillions: {
    numbers: [5, 12, 23, 34, 45],
    stars: [2, 7],
    date: new Date().toISOString(),
    confidence: 40,
    jackpot: "€120M"
  },
  
  results: {
    latest: {
      keno: { numbers: [3, 8, 14, 22, 29, 31, 37, 42, 55, 60], date: new Date().toISOString() },
      loto: { numbers: [7, 14, 21, 28, 35, 42], bonus: 5, date: new Date().toISOString() },
      euromillions: { numbers: [5, 12, 23, 34, 45], stars: [2, 7], date: new Date().toISOString() }
    },
    history: [
      { numbers: [1, 8, 15, 22, 29, 36], date: new Date(Date.now() - 86400000).toISOString() },
      { numbers: [2, 9, 16, 23, 30, 37], date: new Date(Date.now() - 172800000).toISOString() },
      { numbers: [3, 10, 17, 24, 31, 38], date: new Date(Date.now() - 259200000).toISOString() }
    ]
  }
};

export const FALLBACK_ADMIN = {
  stats: {
    total_predictions: 1247,
    correct_predictions: 842,
    accuracy_rate: 67.5,
    high_confidence_accuracy: 72.3,
    low_confidence_accuracy: 58.9,
    timestamp: new Date().toISOString()
  },
  
  performance: {
    accuracy: 0.675,
    correct: 842,
    total: 1247,
    high_confidence_accuracy: 0.723,
    low_confidence_accuracy: 0.589,
    last_updated: new Date().toISOString()
  },
  
  predictions: [
    { id: 1, type: "keno", prediction: "[5,12,23,34,45]", confidence: 65, date: new Date().toISOString() },
    { id: 2, type: "loto", prediction: "[7,14,21,28,35,42]", confidence: 58, date: new Date().toISOString() },
    { id: 3, type: "sports", prediction: "PSG Win", confidence: 78, date: new Date().toISOString() }
  ],
  
  database: {
    total_tables: 5,
    total_records: 8934,
    predictions_count: 1247,
    results_count: 3421,
    users_count: 156
  }
};

export const FALLBACK_COMMON = {
  error: {
    message: "Les données n'ont pas pu être chargées. Affichage des données par défaut.",
    retryable: true
  },
  empty: [],
  emptyObject: {}
};
