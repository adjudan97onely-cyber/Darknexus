import React, { useEffect, useState } from 'react';
import { lotteryAPI } from '../services/api';

/**
 * RecentResultsWidget - Affiche derniers résultats avec comparaison simple
 * À ajouter dans les pages de loteries (Keno, Loto, EuroMillions)
 */
export default function RecentResultsWidget({ lotteryType }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await lotteryAPI.getLatestResults(lotteryType);
        setResults(data.data);
      } catch (err) {
        console.log('Impossible de charger les résultats');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lotteryType]);

  if (loading) return <div className="text-slate-400 text-sm">Chargement résultats...</div>;
  if (!results) return null;

  // Mock data pour démo - remplacer par vraies données
  const proposedNumbers = [5, 12, 18, 27, 33, 44];
  const drawnNumbers = results.numbers || [5, 18, 42, 60, 70];
  const matched = proposedNumbers.filter(n => drawnNumbers.includes(n)).length;
  const accuracy = Math.round((matched / proposedNumbers.length) * 100);

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-white/5 mt-8">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Derniers Résultats</h3>
        <p className="text-xs text-slate-500 mt-1">{results.date || 'Aujourd\'hui'}</p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-slate-400 mb-2">Ma Prédiction</div>
          <div className="flex flex-wrap gap-2">
            {proposedNumbers.map(n => (
              <div key={n} className="bg-emerald-500/20 border border-emerald-400 rounded px-2 py-1 text-xs font-bold text-emerald-300">
                {n}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-2">Résultat Réel</div>
          <div className="flex flex-wrap gap-2">
            {drawnNumbers.map((n, idx) => {
              const isMatch = proposedNumbers.includes(n);
              return (
                <div 
                  key={idx} 
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    isMatch 
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300' 
                      : 'bg-slate-500/20 border border-slate-400 text-slate-400'
                  }`}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-cyan-300">{matched}/{proposedNumbers.length}</div>
        <div className="text-xs text-slate-400 mt-1">Bons numéros trouvés</div>
        <div className="text-sm font-bold text-white mt-2">Précision: {accuracy}%</div>
      </div>
    </div>
  );
}
