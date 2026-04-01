import React from 'react';

/**
 * TopMatchesSection - Top 10 matchs du jour triés par fiabilité
 * À ajouter au SportsAnalyzer
 */
export default function TopMatchesSection({ matches = [] }) {
  // Transformer les recommandations reçues en format d'affichage
  const topMatches = matches.slice(0, 10).map((m, idx) => {
    const parts = (m.match || '').split(' vs ');
    return {
      id: m.prediction_id || idx,
      time: '',
      team1: parts[0] || '?',
      team2: parts[1] || '?',
      league: m.league || '',
      prediction: m.best_bet || m.prediction || '?',
      confidence: m.confidence || 0,
    };
  });

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-emerald-400 bg-emerald-500/10';
    if (conf >= 70) return 'text-cyan-400 bg-cyan-500/10';
    if (conf >= 60) return 'text-amber-400 bg-amber-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  if (topMatches.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Top Matchs — Signaux Fiables</h2>
        <p className="text-sm text-slate-400 mt-1">Classés par fiabilité • Les meilleures prédictions</p>
      </div>

      <div className="space-y-3">
        {topMatches.map((match, idx) => (
          <div key={match.id} className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-400 w-8">{idx + 1}.</div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{match.team1} vs {match.team2}</div>
                  <div className="text-xs text-slate-500">{match.league}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-3 py-2 rounded-lg text-sm font-bold ${getConfidenceColor(match.confidence)}`}>
                {match.prediction}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Confiance</div>
                <div className="font-bold text-white">{match.confidence}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold text-sm transition-colors w-full">
        Voir tous les matchs
      </button>
    </div>
  );
}
