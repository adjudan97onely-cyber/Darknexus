import React from 'react';

/**
 * TopMatchesSection - Top 10 matchs du jour triés par fiabilité
 * À ajouter au SportsAnalyzer
 */
export default function TopMatchesSection({ matches = [] }) {
  // Mock data - remplacer par vraies données
  const topMatches = [
    { id: 1, time: '20h', team1: 'PSG', team2: 'OM', league: 'Ligue 1', prediction: 'PSG', confidence: 82 },
    { id: 2, time: '21h', team1: 'Monaco', team2: 'Rennes', league: 'Ligue 1', prediction: 'Nul', confidence: 65 },
    { id: 3, time: '19h', team1: 'Real Madrid', team2: 'Barcelona', league: 'La Liga', prediction: 'Real', confidence: 78 },
    { id: 4, time: '20h30', team1: 'Liverpool', team2: 'Man City', league: 'Premier', prediction: 'Man City', confidence: 72 },
    { id: 5, time: '21h', team1: 'Bayern', team2: 'Dortmund', league: 'Bundesliga', prediction: 'Bayern', confidence: 88 },
    { id: 6, time: '20h', team1: 'Juventus', team2: 'AC Milan', league: 'Série A', prediction: 'Juve', confidence: 71 },
    { id: 7, time: '20h30', team1: 'Rangers', team2: 'Celtic', league: 'Écosse', prediction: 'Nul', confidence: 68 },
    { id: 8, time: '19h30', team1: 'Ajax', team2: 'PSV', league: 'Pays-Bas', prediction: 'PSV', confidence: 75 },
    { id: 9, time: '21h', team1: 'Lyon', team2: 'Marseille', league: 'Ligue 1', prediction: 'Lyon', confidence: 69 },
    { id: 10, time: '20h', team1: 'Lille', team2: 'Lens', league: 'Ligue 1', prediction: 'Lens', confidence: 64 },
  ];

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-emerald-400 bg-emerald-500/10';
    if (conf >= 70) return 'text-cyan-400 bg-cyan-500/10';
    if (conf >= 60) return 'text-amber-400 bg-amber-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">🔥 Top 10 Matchs du Jour</h2>
        <p className="text-sm text-slate-400 mt-1">Classés par fiabilité • Les meilleures prédictions</p>
      </div>

      <div className="space-y-3">
        {topMatches.map((match, idx) => (
          <div key={match.id} className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-400 w-8">{idx + 1}.</div>
                <div className="text-xs text-slate-500 w-12">{match.time}</div>
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
