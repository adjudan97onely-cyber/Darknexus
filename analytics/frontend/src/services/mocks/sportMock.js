// Mock Sport — Football, matchs à venir + prédictions IA
// Données indépendantes des jeux de loterie

const future = (daysFromNow, hour = '20:45') => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10) + `T${hour}:00`;
};

export const sportMock = {
  leagues: {
    data: [
      { id: 1, name: 'Ligue 1',       country: 'France',    logo: '🇫🇷', season: '2025-2026', active: true },
      { id: 2, name: 'Premier League', country: 'England',   logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', season: '2025-2026', active: true },
      { id: 3, name: 'La Liga',        country: 'Spain',     logo: '🇪🇸', season: '2025-2026', active: true },
      { id: 4, name: 'Serie A',        country: 'Italy',     logo: '🇮🇹', season: '2025-2026', active: true },
      { id: 5, name: 'Bundesliga',     country: 'Germany',   logo: '🇩🇪', season: '2025-2026', active: true },
      { id: 6, name: 'Champions League', country: 'Europe', logo: '🏆', season: '2025-2026', active: true },
    ],
    count: 6,
  },

  matches: {
    data: [
      {
        id: 'm1', home_team: 'Paris Saint-Germain', away_team: 'Olympique de Marseille',
        league: 'Ligue 1', country: 'France', match_date: future(1),
        status: 'scheduled', home_logo: '🔵', away_logo: '⚪',
        prediction: { home_win: 58, draw: 24, away_win: 18, btts: 45, over_2_5: 62 },
        confidence: 81,
      },
      {
        id: 'm2', home_team: 'Arsenal', away_team: 'Manchester City',
        league: 'Premier League', country: 'England', match_date: future(1, '17:30'),
        status: 'scheduled', home_logo: '🔴', away_logo: '🔵',
        prediction: { home_win: 35, draw: 26, away_win: 39, btts: 55, over_2_5: 70 },
        confidence: 74,
      },
      {
        id: 'm3', home_team: 'Real Madrid', away_team: 'FC Barcelone',
        league: 'La Liga', country: 'Spain', match_date: future(2),
        status: 'scheduled', home_logo: '⚪', away_logo: '🔵',
        prediction: { home_win: 44, draw: 28, away_win: 28, btts: 60, over_2_5: 72 },
        confidence: 78,
      },
      {
        id: 'm4', home_team: 'Juventus', away_team: 'AC Milan',
        league: 'Serie A', country: 'Italy', match_date: future(2, '18:00'),
        status: 'scheduled', home_logo: '⚫', away_logo: '🔴',
        prediction: { home_win: 42, draw: 30, away_win: 28, btts: 48, over_2_5: 55 },
        confidence: 69,
      },
      {
        id: 'm5', home_team: 'Bayern Munich', away_team: 'Borussia Dortmund',
        league: 'Bundesliga', country: 'Germany', match_date: future(3, '18:30'),
        status: 'scheduled', home_logo: '🔴', away_logo: '🟡',
        prediction: { home_win: 52, draw: 24, away_win: 24, btts: 58, over_2_5: 74 },
        confidence: 76,
      },
      {
        id: 'm6', home_team: 'Olympique Lyonnais', away_team: 'AS Monaco',
        league: 'Ligue 1', country: 'France', match_date: future(3),
        status: 'scheduled', home_logo: '🔴', away_logo: '🔴',
        prediction: { home_win: 38, draw: 32, away_win: 30, btts: 52, over_2_5: 60 },
        confidence: 65,
      },
      {
        id: 'm7', home_team: 'Liverpool', away_team: 'Chelsea',
        league: 'Premier League', country: 'England', match_date: future(4, '16:00'),
        status: 'scheduled', home_logo: '🔴', away_logo: '🔵',
        prediction: { home_win: 46, draw: 26, away_win: 28, btts: 58, over_2_5: 68 },
        confidence: 73,
      },
      {
        id: 'm8', home_team: 'Atletico Madrid', away_team: 'Sevilla FC',
        league: 'La Liga', country: 'Spain', match_date: future(4, '21:00'),
        status: 'scheduled', home_logo: '🔴', away_logo: '⚪',
        prediction: { home_win: 49, draw: 27, away_win: 24, btts: 44, over_2_5: 52 },
        confidence: 70,
      },
    ],
    count: 8,
  },

  statistics: {
    total_matches_analyzed: 1847,
    leagues_covered: 6,
    avg_accuracy: 68.4,
    home_win_rate: 0.447,
    draw_rate: 0.261,
    away_win_rate: 0.292,
    btts_rate: 0.521,
    over_2_5_rate: 0.587,
    best_league: 'Premier League',
    best_league_accuracy: 72.1,
    model_version: 'FootballBrain v2.3',
    last_updated: '2026-04-02T08:00:00',
  },

  recommendations: {
    data: [
      {
        id: 'sport-rec1', home_team: 'Arsenal', away_team: 'Manchester City',
        league: 'Premier League', country: 'England',
        match_date: future(1, '17:30'), bet_type: 'BTTS',
        prediction: { home_win: 35, draw: 26, away_win: 39, btts: 55, over_2_5: 70 },
        confidence: 82, odds_estimate: 1.72,
        reasoning: 'Les deux équipes scorent dans 78% de leurs matchs récents.',
      },
      {
        id: 'sport-rec2', home_team: 'Real Madrid', away_team: 'FC Barcelone',
        league: 'La Liga', country: 'Spain',
        match_date: future(2), bet_type: 'Plus de 2.5 buts',
        prediction: { home_win: 44, draw: 28, away_win: 28, btts: 60, over_2_5: 72 },
        confidence: 78, odds_estimate: 1.58,
        reasoning: 'El Clásico dépasse 2.5 buts dans 74% des cas historiques.',
      },
      {
        id: 'sport-rec3', home_team: 'Paris Saint-Germain', away_team: 'Olympique de Marseille',
        league: 'Ligue 1', country: 'France',
        match_date: future(1), bet_type: 'Victoire domicile',
        prediction: { home_win: 58, draw: 24, away_win: 18, btts: 45, over_2_5: 62 },
        confidence: 81, odds_estimate: 1.45,
        reasoning: 'PSG remporte 71% de ses matchs à domicile cette saison.',
      },
      {
        id: 'sport-rec4', home_team: 'Bayern Munich', away_team: 'Borussia Dortmund',
        league: 'Bundesliga', country: 'Germany',
        match_date: future(3, '18:30'), bet_type: 'Plus de 2.5 buts',
        prediction: { home_win: 52, draw: 24, away_win: 24, btts: 58, over_2_5: 74 },
        confidence: 76, odds_estimate: 1.48,
        reasoning: 'Der Klassiker produit en moyenne 3.8 buts par match.',
      },
    ],
    count: 4,
  },

  matchPrediction: (homeTeam, awayTeam) => ({
    predictions: [{
      home_team: homeTeam,
      away_team: awayTeam,
      home_win_probability: 42,
      draw_probability: 28,
      away_win_probability: 30,
      btts_probability: 52,
      over_2_5_probability: 61,
      recommended_bet: 'Victoire domicile',
      confidence: 72,
      reasoning: `Analyse basée sur forme récente, historique H2H et statistiques de la ligue.`,
      key_factors: ['Forme domicile', 'Buts marqués', 'Défense récente'],
    }],
  }),
};
