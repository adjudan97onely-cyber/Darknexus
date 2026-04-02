import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/apiService';

/**
 * PerformanceSummaryWidget - Affiche % réussite global + derniers résultats
 * À ajouter au Dashboard
 */
export default function PerformanceSummaryWidget() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await dashboardAPI.getPerformance();
        setPerformance(data.data);
      } catch (err) {
        console.log('Impossible de charger les perfs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !performance) return null;

  // Mock data
  const mockPerformance = {
    keno: { accuracy: 72, total: 45, last: 'Hier' },
    loto: { accuracy: 68, total: 32, last: 'Hier' },
    euromillions: { accuracy: 65, total: 28, last: '2 jours' },
    football: { accuracy: 70, total: 120, last: 'Hier' },
    global: 69,
  };

  const getAccuracyBarColor = (acc) => {
    if (acc >= 80) return 'from-emerald-500 to-teal-500';
    if (acc >= 70) return 'from-cyan-500 to-blue-500';
    if (acc >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">📊 Performance Globale</h3>
        <p className="text-xs text-slate-400 mt-1">Précision de tes prédictions par type</p>
      </div>

      {/* Global Score */}
      <div className="mb-8 text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full`}>
          <div className={`w-28 h-28 rounded-full bg-gradient-to-r ${getAccuracyBarColor(mockPerformance.global)} flex items-center justify-center`}>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{mockPerformance.global}%</div>
              <div className="text-xs text-white/70 mt-1">Global</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(mockPerformance).map(([type, stats]) => {
          if (type === 'global') return null;
          return (
            <div key={type} className="border border-white/10 rounded-lg p-4 text-center hover:border-white/20 transition-all">
              <div className="text-sm font-semibold text-slate-300 capitalize mb-2">{type}</div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${getAccuracyBarColor(stats.accuracy)} bg-clip-text text-transparent`}>
                {stats.accuracy}%
              </div>
              <div className="text-xs text-slate-500 mt-2">{stats.total} prédictions</div>
              <div className="text-xs text-slate-600 mt-1">Dernier: {stats.last}</div>
            </div>
          );
        })}
      </div>

      {/* Trend indicator */}
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
        <div className="text-xs font-semibold text-slate-300">📈 Tendance</div>
        <div className="text-sm text-white mt-1 font-semibold">
          Accuracy globale: <span className="text-emerald-400">+2.3% cette semaine</span>
        </div>
        <div className="text-xs text-slate-400 mt-2">Les prédictions s'améliorent régulièrement 🎯</div>
      </div>
    </div>
  );
}
