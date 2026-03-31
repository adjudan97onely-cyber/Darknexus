/**
 * LOGIQUE DE PRÉDICTION FOOTBALL
 * 
 * Analyse:
 * - Forme des équipes (derniers matches)
 * - Buts marqués/encaissés
 * - Historique confrontations
 * - Home/Away advantage
 */

/**
 * Prédit le résultat d'un match de football
 * @param {Object} match - { homeTeam, awayTeam, league }
 * @param {Object} teamStats - { [teamName]: {form, goalsFor, goalsAgainst, ...} }
 * @param {Array} headToHead - Résultats confrontations précédentes
 * @returns {Object} {match, prediction, confidence, reasoning}
 */
export function predictFootballMatch(match, teamStats = {}, headToHead = []) {
  const { homeTeam, awayTeam, league } = match;

  // Récupérer stats équipes
  const homeStat = teamStats[homeTeam] || getDefaultTeamStat();
  const awayStat = teamStats[awayTeam] || getDefaultTeamStat();

  // Calculer power ratings
  const homeRating = calculatePowerRating(homeStat, 'home');
  const awayRating = calculatePowerRating(awayStat, 'away');

  // Analyser historique H2H
  const h2hAnalysis = analyzeHeadToHead(headToHead);

  // Calculer probabilités
  const probs = calculateMatchProbabilities(homeRating, awayRating, h2hAnalysis);

  // Génér prédiction principale
  const mainPrediction = probs.homeWinProb > probs.awayWinProb 
    ? (probs.homeWinProb > probs.drawProb ? '1' : 'X')
    : (probs.awayWinProb > probs.drawProb ? '2' : 'X');

  // Prédictions secondaires (Over/Under, BTTS)
  const avgGoals = (homeStat.avgGoalsFor + awayStat.avgGoalsAgainst) / 2 +
                   (awayStat.avgGoalsFor + homeStat.avgGoalsAgainst) / 2;
  
  const overUnderProb = avgGoals > 2.5 ? 'Over 2.5' : 'Under 2.5';
  const bttsProb = (homeStat.bttsPercentage + awayStat.bttsPercentage) / 2 > 50;

  // Calculer confidence globale
  const confidence = calculateFootballConfidence(
    probs,
    h2hAnalysis,
    { homeRating, awayRating }
  );

  return {
    match: `${homeTeam} vs ${awayTeam}`,
    homeTeam,
    awayTeam,
    league,
    mainPrediction,
    mainPredictionName: getPredictionName(mainPrediction),
    mainPredictionProb: probs[getPredictionProbKey(mainPrediction)],
    secondaryPredictions: [
      {
        type: 'Over/Under',
        prediction: overUnderProb,
        probability: Math.max(probs.over2_5, probs.under2_5)
      },
      {
        type: 'BTTS',
        prediction: bttsProb ? 'Yes' : 'No',
        probability: bttsProb ? 0.55 : 0.45
      }
    ],
    confidence: Math.round(confidence * 100) / 100,
    probabilities: probs,
    homeRating: Math.round(homeRating * 100) / 100,
    awayRating: Math.round(awayRating * 100) / 100,
    reasoning: generateFootballReasoning(homeTeam, awaTeam, homeStat, awayStat, h2hAnalysis),
    homeForm: homeStat.recentForm || 'N/A',
    awayForm: awayStat.recentForm || 'N/A'
  };
}

/**
 * Prédictions multiples pour une journée
 */
export function predictMultipleMatches(matches, allTeamStats = {}, allHeadToHead = {}) {
  return matches.map((match, idx) => {
    const h2hKey = `${match.homeTeam}-${match.awayTeam}`;
    const h2h = allHeadToHead[h2hKey] || [];
    
    return {
      ...predictFootballMatch(match, allTeamStats, h2h),
      order: idx + 1
    };
  }).sort((a, b) => b.confidence - a.confidence); // Trier par confidence
}

// ============ CALCULATIONS ============

/**
 * Calcule un "power rating" pour une équipe
 * Score basé sur forme, buts, défense
 */
function calculatePowerRating(stat, context = 'neutral') {
  let rating = 50; // Base 50

  // Facteurs:
  const formFactor = getFormFactor(stat.recentForm); // 0-20 points
  const goalsFactor = (stat.avgGoalsFor || 1.5) * 5; // Points basés sur buts
  const defenseFactor = Math.max(0, 10 - (stat.avgGoalsAgainst || 1.5) * 3); // Défense
  const winPercentage = (stat.winPercentage || 40) * 0.2; // Win %

  rating += formFactor + goalsFactor + defenseFactor + winPercentage;

  // Home advantage ou away disadvantage
  if (context === 'home') rating += 5; // +5 home
  if (context === 'away') rating -= 3; // -3 away

  return Math.min(Math.max(rating, 20), 100); // Cap 20-100
}

/**
 * Convertit forme (ex: "WWDWL") en factor (0-20)
 */
function getFormFactor(recentForm) {
  if (!recentForm) return 10;

  let score = 0;
  const weights = [3, 2.5, 2, 1.5, 1]; // Poids décroissants

  for (let i = 0; i < Math.min(recentForm.length, 5); i++) {
    if (recentForm[i] === 'W') score += 3 * weights[i];
    else if (recentForm[i] === 'D') score += 1 * weights[i];
    else if (recentForm[i] === 'L') score -= 1.5 * weights[i];
  }

  return Math.max(0, Math.min(20, score));
}

/**
 * Calcule probabilités: 1, X, 2
 */
function calculateMatchProbabilities(homeRating, awayRating, h2hAnalysis) {
  const ratingDiff = homeRating - awayRating;

  // Formule simple basée sur rating diff
  let homeWinProb = 0.45 + (ratingDiff / 100) * 0.3; // Plus home est fort, + proba gagne
  let drawProb = 0.25;
  let awayWinProb = 0.30 - (ratingDiff / 100) * 0.3;

  // Ajuster avec historique H2H
  if (h2hAnalysis.homeWinPercentage > 50) homeWinProb += 0.05;
  if (h2hAnalysis.drawPercentage > 50) drawProb += 0.05;
  if (h2hAnalysis.awayWinPercentage > 50) awayWinProb += 0.05;

  // Normaliser à 100%
  const total = homeWinProb + drawProb + awayWinProb;
  homeWinProb /= total;
  drawProb /= total;
  awayWinProb /= total;

  // Over/Under 2.5
  const avgGoals = 2.4; // Average global
  const over2_5 = Math.min(0.7, Math.max(0.3, avgGoals / 4));
  const under2_5 = 1 - over2_5;

  return {
    '1': homeWinProb,
    'X': drawProb,
    '2': awayWinProb,
    homeWinProb,
    drawProb,
    awayWinProb,
    over2_5,
    under2_5
  };
}

/**
 * Analyse historique confrontations
 */
function analyzeHeadToHead(matches) {
  let homeWins = 0, draws = 0, awayWins = 0;
  let homeGoals = 0, awayGoals = 0;

  matches.forEach(m => {
    if (m.result === '1' || m.homeTeamGoals > m.awayTeamGoals) homeWins++;
    else if (m.result === 'X' || m.homeTeamGoals === m.awayTeamGoals) draws++;
    else awayWins++;

    homeGoals += m.homeTeamGoals || 0;
    awayGoals += m.awayTeamGoals || 0;
  });

  const total = homeWins + draws + awayWins || 1;

  return {
    totalMatches: matches.length,
    homeWins,
    draws,
    awayWins,
    homeWinPercentage: (homeWins / total) * 100,
    drawPercentage: (draws / total) * 100,
    awayWinPercentage: (awayWins / total) * 100,
    avgHomeGoals: Math.round((homeGoals / Math.max(1, matches.length)) * 10) / 10,
    avgAwayGoals: Math.round((awayGoals / Math.max(1, matches.length)) * 10) / 10
  };
}

/**
 * Calcule confidence globale
 */
function calculateFootballConfidence(probs, h2hAnalysis, ratings) {
  let confidence = 0.6; // Base 60%

  // Bonus si proba claire (une équipe domine nettement)
  const maxProb = Math.max(probs.homeWinProb, probs.drawProb, probs.awayWinProb);
  if (maxProb > 0.55) confidence += 0.08;
  if (maxProb > 0.65) confidence += 0.05;

  // Bonus si historique H2H favorable
  if (h2hAnalysis.totalMatches > 3) confidence += 0.05;

  // Bonus si rating diff clair
  const ratingDiff = Math.abs(ratings.homeRating - ratings.awayRating);
  if (ratingDiff > 10) confidence += 0.05;
  if (ratingDiff > 20) confidence += 0.03;

  return Math.min(confidence, 0.85); // Cap at 85%
}

/**
 * Génère explication textuelle
 */
function generateFootballReasoning(homeTeam, awayTeam, homeStat, awayStat, h2hAnalysis) {
  let reasons = [];

  if ((homeStat.recentForm || '').includes('W')) reasons.push(`${homeTeam} en bonne forme`);
  if ((awayStat.recentForm || '').includes('W')) reasons.push(`${awayTeam} en bonne forme`);

  if (h2hAnalysis.homeWins > h2hAnalysis.awayWins) {
    reasons.push(`${homeTeam} domine historiquement (${h2hAnalysis.homeWins}v${h2hAnalysis.awayWins})`);
  }

  if (homeStat.avgGoalsFor > 2) reasons.push(`${homeTeam} offensif (${homeStat.avgGoalsFor} buts/match)`);
  if (awayStat.avgGoalsAgainst > 1.5) reasons.push(`Défense de ${awayTeam} fragile`);

  return reasons.join(' • ') || 'Match équilibré';
}

function getPredictionName(pred) {
  if (pred === '1') return 'Home Win';
  if (pred === 'X') return 'Draw';
  if (pred === '2') return 'Away Win';
  return pred;
}

function getPredictionProbKey(pred) {
  if (pred === '1') return 'homeWinProb';
  if (pred === 'X') return 'drawProb';
  if (pred === '2') return 'awayWinProb';
  return 'homeWinProb';
}

/**
 * Stats équipe par défaut (si données manquantes)
 */
function getDefaultTeamStat() {
  return {
    avgGoalsFor: 1.5,
    avgGoalsAgainst: 1.3,
    winPercentage: 40,
    bttsPercentage: 45,
    recentForm: 'DDDDD',
    homeWinPercentage: 50,
    awayWinPercentage: 30
  };
}

export default {
  predictFootballMatch,
  predictMultipleMatches,
  calculatePowerRating,
  analyzeHeadToHead
};
