import React, { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { lotteryAPI } from '../services/api';
import StatCard from './StatCard';

const ANALYSIS_LOADERS = {
  keno: lotteryAPI.kenoAnalysis,
  euromillions: lotteryAPI.euromillionsAnalysis,
  loto: lotteryAPI.lotoAnalysis,
};

export default function LotteryWorkbench({ lottery, title, description, accent }) {
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [grids, setGrids] = useState([]);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [autoSelected, setAutoSelected] = useState([]);
  const [minConfidence, setMinConfidence] = useState(80);
  const [take, setTake] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const [analysisRes, recsRes, gridsRes, latestRes, historyRes] = await Promise.all([
          ANALYSIS_LOADERS[lottery](),
          lotteryAPI.getRecommendations(lottery, 10),
          lotteryAPI.generateGrids(lottery, 5),
          lotteryAPI.getLatestResults(lottery),
          lotteryAPI.getHistory(lottery, 24),
        ]);
        setAnalysis(analysisRes.data);
        setRecommendations(recsRes.data);
        setGrids(gridsRes.data);
        setLatest(latestRes.data);
        setHistory(historyRes.data);
      } catch (loadError) {
        setError(loadError.response?.data?.detail || loadError.message || 'Chargement impossible');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lottery]);

  async function handleAutoSelect() {
    try {
      const response = await lotteryAPI.autoSelect(lottery, take, minConfidence);
      setAutoSelected(response.data);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || loadError.message || 'Auto-sélection impossible');
    }
  }

  const chartData = Object.entries(analysis?.scores || {})
    .map(([number, score]) => ({ number, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

  if (loading) {
    return <div className="premium-shell"><div className="premium-panel p-10 text-slate-300">Chargement {title}...</div></div>;
  }

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Lottery Engine</p>
          <h1 className="premium-title">{title}</h1>
          <p className="premium-subtitle">{description}</p>
        </div>
        <div className={`h-28 w-28 rounded-[2rem] bg-gradient-to-br ${accent} shadow-[0_24px_60px_rgba(12,18,45,0.45)]`} />
      </section>

      {error ? <div className="premium-error">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tirages" value={analysis?.total_draws || 0} tone="cyan" />
        <StatCard label="Fiabilité" value={`${analysis?.reliability_score || 0}%`} tone="emerald" />
        <StatCard label="Volatilité" value={`${analysis?.volatility_score || 0}`} tone="amber" />
        <StatCard label="Distribution" value={analysis?.is_normal_distribution ? 'Stable' : 'Alerte'} tone="violet" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="premium-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="premium-kicker">Top scoring numbers</p>
              <h2 className="text-2xl font-bold text-white">Modèle pondéré</h2>
            </div>
            <span className="premium-badge">Chi² {analysis?.chi_square}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="number" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Bar dataKey="score" fill="url(#lotteryBar)" radius={[10, 10, 0, 0]} />
                <defs>
                  <linearGradient id="lotteryBar" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-panel p-6">
          <p className="premium-kicker">Latest official result</p>
          <h2 className="text-2xl font-bold text-white">Dernier tirage</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {(latest?.numbers || []).map((number) => (
              <div key={number} className="premium-number-chip">{number}</div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Hot</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analysis?.hot_numbers || []).slice(0, 5).map((number) => <span key={number} className="premium-tag premium-tag-hot">{number}</span>)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Cold</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analysis?.cold_numbers || []).slice(0, 5).map((number) => <span key={number} className="premium-tag premium-tag-cold">{number}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="premium-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="premium-kicker">Auto-selection</p>
              <h2 className="text-2xl font-bold text-white">Choisir les meilleurs signaux</h2>
            </div>
            <button className="premium-button" onClick={handleAutoSelect}>Lancer</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="premium-field">
              <span>Nombre de grilles</span>
              <input type="number" min="1" max="10" value={take} onChange={(event) => setTake(Number(event.target.value))} />
            </label>
            <label className="premium-field">
              <span>Confiance minimum</span>
              <input type="number" min="30" max="99" value={minConfidence} onChange={(event) => setMinConfidence(Number(event.target.value))} />
            </label>
          </div>
          <div className="mt-5 space-y-3">
            {autoSelected.length === 0 ? <div className="text-sm text-slate-400">Aucune auto-sélection lancée pour le moment.</div> : null}
            {autoSelected.map((grid) => (
              <div key={grid.prediction_id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {grid.numbers.map((number) => <span key={number} className="premium-number-chip premium-number-chip-sm">{number}</span>)}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{grid.confidence}%</div>
                    <div className="text-xs text-slate-400">fiabilité {grid.reliability}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-panel p-6">
          <p className="premium-kicker">Recent history</p>
          <h2 className="text-2xl font-bold text-white">Historique récent</h2>
          <div className="mt-5 space-y-3">
            {history.slice(0, 8).map((draw) => (
              <div key={draw.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{draw.draw_date}</div>
                  <div className="text-xs text-slate-500">{draw.lottery_type}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {draw.numbers.slice(0, 8).map((number) => <span key={`${draw.id}-${number}`} className="premium-tag">{number}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="premium-panel p-6">
          <p className="premium-kicker">Recommendations</p>
          <h2 className="text-2xl font-bold text-white">Numéros à surveiller</h2>
          <div className="mt-5 grid gap-3">
            {recommendations.slice(0, 6).map((item) => (
              <div key={item.prediction_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-lg font-semibold text-white">#{item.numbers[0]}</div>
                  <div className="text-xs text-slate-400">{item.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-cyan-300">{item.confidence}%</div>
                  <div className="text-xs text-slate-500">volatilité {item.volatility}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-panel p-6">
          <p className="premium-kicker">Premium grids</p>
          <h2 className="text-2xl font-bold text-white">Grilles générées</h2>
          <div className="mt-5 space-y-4">
            {grids.map((grid) => (
              <div key={grid.prediction_id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">Confiance {grid.confidence}%</div>
                  <div className="premium-badge">Vol. {grid.volatility}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {grid.numbers.map((number) => <span key={`${grid.prediction_id}-${number}`} className="premium-number-chip premium-number-chip-sm">{number}</span>)}
                </div>
                <p className="mt-3 text-sm text-slate-400">{grid.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
