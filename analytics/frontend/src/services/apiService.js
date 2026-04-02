/**
 * apiService.js — Couche de service centrale avec fallback automatique
 *
 * Architecture :
 *   1. Tente l'appel API réel
 *   2. Si erreur (404, réseau, 500) → retourne le mock correspondant
 *   3. Chaque produit a ses propres mocks (jamais mélangés)
 *
 * Re-exporte tous les utilitaires de api.js pour compatibilité totale.
 */

import apiClient, {
  lotteryAPI as _lotteryAPI,
  sportsAPI   as _sportsAPI,
  dashboardAPI as _dashboardAPI,
  bilanAPI    as _bilanAPI,
  authAPI     as _authAPI,
  subscriptionAPI as _subscriptionAPI,
  getApiErrorMessage,
} from './api';

import { kenoMock }         from './mocks/kenoMock';
import { lotoMock }         from './mocks/lotoMock';
import { euroMock }         from './mocks/euroMock';
import { sportMock }        from './mocks/sportMock';
import { performanceMock }  from './mocks/performanceMock';
import { authMock }         from './mocks/authMock';
import { subscriptionMock } from './mocks/subscriptionMock';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Enveloppe un appel API avec fallback automatique.
 * @param {Function} apiFn   — Fonction qui retourne une Promise axios
 * @param {*}        fallback — Données mock ou fonction (args) => mock
 */
const withFallback = (apiFn, fallback) => async (...args) => {
  try {
    const result = await apiFn(...args);
    return result;
  } catch (err) {
    const isNetworkOrNotFound =
      !err.response ||
      err.response.status === 404 ||
      err.response.status >= 500;

    if (isNetworkOrNotFound) {
      const data = typeof fallback === 'function' ? fallback(...args) : fallback;
      console.warn(
        `[apiService] Fallback mock activé pour ${apiFn.name || 'appel inconnu'} — ${err.message}`
      );
      return { data };
    }
    throw err;
  }
};

// ── Mock sélecteur Lotterie ────────────────────────────────────────────────────

const lotoFallbackByType = (type) => {
  switch (String(type).toLowerCase()) {
    case 'keno':         return kenoMock;
    case 'euromillions': return euroMock;
    case 'loto':         return lotoMock;
    default:             return lotoMock;
  }
};

// ── lotteryAPI (avec fallback par jeu) ────────────────────────────────────────

export const lotteryAPI = {
  // Analyses spécifiques — Keno préfère le backend réel (4165 tirages FDJ)
  kenoAnalysis: withFallback(
    _lotteryAPI.kenoAnalysis,
    {
      type: 'keno', total_draws: 0, reliability_score: 70, volatility_score: 15,
      is_normal_distribution: true, chi_square: 2.5, confidence: 0.70, status: 'offline',
      hot_numbers: [7, 13, 24, 31, 42, 55, 61, 68], cold_numbers: [3, 10, 19, 38, 47, 58, 64, 70],
      scores: Object.fromEntries(Array.from({ length: 70 }, (_, i) => [i + 1, +(Math.random() * 0.8 + 0.1).toFixed(2)])),
    }
  ),
  lotoAnalysis: withFallback(
    _lotteryAPI.lotoAnalysis,
    lotoMock.analysis
  ),
  euromillionsAnalysis: withFallback(
    _lotteryAPI.euromillionsAnalysis,
    euroMock.analysis
  ),

  // Analyse générique par type
  analyzeLottery: withFallback(
    _lotteryAPI.analyzeLottery,
    (type) => lotoFallbackByType(type).analysis
  ),

  getStatistics: withFallback(
    _lotteryAPI.getStatistics,
    (type) => ({ type, total_draws: lotoFallbackByType(type).analysis.total_draws })
  ),

  getLatestResults: withFallback(
    _lotteryAPI.getLatestResults,
    (lottery) => lotoFallbackByType(lottery).latest
  ),

  getHistory: withFallback(
    _lotteryAPI.getHistory,
    (lottery) => lotoFallbackByType(lottery).history
  ),

  getRecommendations: withFallback(
    _lotteryAPI.getRecommendations,
    (type) => lotoFallbackByType(type).recommendations
  ),

  generateGrids: withFallback(
    _lotteryAPI.generateGrids,
    (type) => lotoFallbackByType(type).grids
  ),

  autoSelect: withFallback(
    _lotteryAPI.autoSelect,
    (lottery) => lotoFallbackByType(lottery).autoSelect
  ),
};

// ── sportsAPI (avec fallback) ──────────────────────────────────────────────────

export const sportsAPI = {
  getLeagues: withFallback(
    _sportsAPI.getLeagues,
    sportMock.leagues
  ),

  getUpcomingMatches: withFallback(
    _sportsAPI.getUpcomingMatches,
    sportMock.matches
  ),

  predictMatch: withFallback(
    _sportsAPI.predictMatch,
    (homeTeam, awayTeam) => sportMock.matchPrediction(homeTeam, awayTeam)
  ),

  predictMultiple: withFallback(
    _sportsAPI.predictMultiple,
    (matches) => ({
      predictions: matches.map((m) => sportMock.matchPrediction(m.home_team, m.away_team).predictions[0]),
    })
  ),

  getTeamForm: withFallback(
    _sportsAPI.getTeamForm,
    (teamName) => ({
      team: teamName,
      last_5: ['W', 'W', 'D', 'W', 'L'],
      goals_scored: 12,
      goals_conceded: 5,
    })
  ),

  getSportsStatistics: withFallback(
    _sportsAPI.getSportsStatistics,
    sportMock.statistics
  ),

  getSportsRecommendations: withFallback(
    _sportsAPI.getSportsRecommendations,
    sportMock.recommendations
  ),

  autoSelectSports: withFallback(
    _sportsAPI.autoSelectSports,
    sportMock.recommendations
  ),

  footballAnalysis: withFallback(
    _sportsAPI.footballAnalysis,
    sportMock.statistics
  ),
};

// ── dashboardAPI (avec fallback) ──────────────────────────────────────────────

export const dashboardAPI = {
  getOverview: withFallback(
    _dashboardAPI.getOverview,
    performanceMock.overview
  ),

  getPerformance: withFallback(
    _dashboardAPI.getPerformance,
    performanceMock.byType
  ),

  getPredictionHistory: withFallback(
    _dashboardAPI.getPredictionHistory,
    { data: [], count: 0 }
  ),

  getPredictionHistoryPaginated: withFallback(
    _dashboardAPI.getPredictionHistoryPaginated,
    { items: [], total: 0, page: 1, per_page: 25 }
  ),

  getRecentResults: withFallback(
    _dashboardAPI.getRecentResults,
    { data: [], count: 0 }
  ),

  getRecentResultsPaginated: withFallback(
    _dashboardAPI.getRecentResultsPaginated,
    { items: [], total: 0, page: 1, per_page: 25 }
  ),

  getNotifications: withFallback(
    _dashboardAPI.getNotifications,
    { data: performanceMock.notifications, count: performanceMock.notifications.length }
  ),

  markNotificationsRead: withFallback(
    _dashboardAPI.markNotificationsRead,
    { status: 'ok' }
  ),

  refreshSystem: withFallback(
    _dashboardAPI.refreshSystem,
    { status: 'refreshed' }
  ),

  reconcilePredictions: withFallback(
    _dashboardAPI.reconcilePredictions,
    { status: 'reconciled', matched: 0 }
  ),

  getSchedulerStatus: withFallback(
    _dashboardAPI.getSchedulerStatus,
    { tasks: [], count: 0 }
  ),
};

// ── bilanAPI (avec fallback) ───────────────────────────────────────────────────

export const bilanAPI = {
  getLotteryBilan: withFallback(
    _bilanAPI.getLotteryBilan,
    (subtype) => {
      const configs = {
        keno:         { baseline: 20, numbers: 20, pool: 70, label: 'Keno' },
        euromillions: { baseline: 10, numbers: 5,  pool: 50, label: 'EuroMillions' },
        loto:         { baseline: 10, numbers: 6,  pool: 49, label: 'Loto' },
      };
      const cfg = configs[subtype] || configs.loto;
      const rows = Array.from({ length: 5 }, (_, i) => {
        const predicted = Array.from({ length: cfg.numbers }, (__, j) => ((i * cfg.numbers + j * 7 + 3) % cfg.pool) + 1);
        const actual    = Array.from({ length: cfg.numbers }, (__, j) => ((i * cfg.numbers + j * 5 + 1) % cfg.pool) + 1);
        const matched   = predicted.filter((n) => actual.includes(n));
        const score     = Math.round((matched.length / cfg.numbers) * 100);
        return {
          id: `${subtype}_bilan_${i + 1}`,
          prediction_date: `${28 - i * 3}/03/2026`,
          draw_date:       `${31 - i * 3}/03/2026`,
          status: matched.length >= 2 ? 'won' : 'lost',
          score,
          matched_count: matched.length,
          predicted_count: cfg.numbers,
          predicted,
          actual,
          matched,
        };
      });
      const avgScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
      const gain = avgScore - cfg.baseline;
      return {
        subtype,
        verdict: `Sur ${rows.length} tirages analysés, l'IA obtient en moyenne ${avgScore}% de numéros corrects contre ${cfg.baseline}% pour le hasard pur. ${gain > 0 ? "L'IA est meilleure que le hasard." : "Performance proche du hasard — données insuffisantes."}`,
        total_evaluated: rows.length,
        avg_score_pct: avgScore,
        random_baseline_pct: cfg.baseline,
        ai_better_than_random: gain > 0,
        gain_vs_random_pct: gain,
        rows,
      };
    }
  ),
};

// ── authAPI (avec fallback en mode démo) ──────────────────────────────────────

export const authAPI = {
  register: withFallback(
    _authAPI.register,
    authMock.loginSuccess
  ),

  login: withFallback(
    _authAPI.login,
    authMock.loginSuccess
  ),

  me: withFallback(
    _authAPI.me,
    authMock.user
  ),

  logout: withFallback(
    _authAPI.logout,
    { status: 'logged_out' }
  ),
};

// ── subscriptionAPI (avec fallback) ───────────────────────────────────────────

export const subscriptionAPI = {
  getPlans: withFallback(
    _subscriptionAPI.getPlans,
    { data: subscriptionMock.plans }
  ),

  getCurrent: withFallback(
    _subscriptionAPI.getCurrent,
    subscriptionMock.current
  ),

  upgrade: withFallback(
    _subscriptionAPI.upgrade,
    (plan) => ({ success: true, plan, message: 'Mise à niveau simulée (mode démo)' })
  ),
};

// ── Re-exports utilitaires ────────────────────────────────────────────────────

export { getApiErrorMessage };
export default apiClient;
