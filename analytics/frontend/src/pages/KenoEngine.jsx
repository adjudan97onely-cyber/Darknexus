import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import apiClient from '../services/api';
import StatCard from '../components/StatCard';

const api = {
  analysis:     () => apiClient.get('/api/keno/analysis'),
  generateGrid: (size, n) => apiClient.get('/api/keno/generate-grid', { params: { grid_size: size, n_grids: n } }),
  heatmap:      (window) => apiClient.get('/api/keno/heatmap', { params: { window } }),
  draws:        (limit) => apiClient.get('/api/keno/draws', { params: { limit } }),
  backtest:     () => apiClient.get('/api/keno/backtest', { params: { grid_size: 10, test_size: 200 } }),
};

// ── Palette couleurs ──────────────────────────────────────────────────────────

function heatColor(deviation) {
  if (deviation > 1.5)  return 'bg-red-500    text-white';
  if (deviation > 0.5)  return 'bg-orange-400 text-white';
  if (deviation < -1.5) return 'bg-blue-600   text-white';
  if (deviation < -0.5) return 'bg-blue-400   text-white';
  return 'bg-slate-600 text-slate-200';
}

function statusColor(status) {
  if (status === 'hot')  return 'text-red-400';
  if (status === 'cold') return 'text-blue-400';
  return 'text-slate-300';
}

function strategyLabel(s) {
  return { conservative: 'Conservative', balanced: 'Balancée', aggressive: 'Agressive' }[s] || s;
}

function strategyColor(s) {
  return {
    conservative: 'border-emerald-500/40 bg-emerald-500/10',
    balanced:     'border-cyan-500/40    bg-cyan-500/10',
    aggressive:   'border-amber-500/40   bg-amber-500/10',
  }[s] || 'border-white/10 bg-white/5';
}

function strategyTextColor(s) {
  return { conservative: 'text-emerald-300', balanced: 'text-cyan-300', aggressive: 'text-amber-300' }[s] || 'text-white';
}

// ── Section loader / erreur ───────────────────────────────────────────────────

function Loader({ label = 'Chargement...' }) {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label}
    </div>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
      <p className="text-sm font-semibold text-red-300">Erreur API</p>
      <p className="mt-1 text-xs text-slate-400">{msg}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition-colors">
          Réessayer
        </button>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function KenoEngine() {
  const [analysis,  setAnalysis]  = useState(null);
  const [grids,     setGrids]     = useState(null);
  const [heatmap,   setHeatmap]   = useState(null);
  const [draws,     setDraws]     = useState([]);
  const [backtest,  setBacktest]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [gridSize,  setGridSize]  = useState(10);
  const [heatWindow, setHeatWindow] = useState(100);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analysisRes, gridsRes, heatmapRes, drawsRes, backtestRes] = await Promise.all([
        api.analysis(),
        api.generateGrid(gridSize, 3),
        api.heatmap(heatWindow),
        api.draws(20),
        api.backtest(),
      ]);
      setAnalysis(analysisRes.data);
      setGrids(gridsRes.data.grids);
      setHeatmap(heatmapRes.data);
      setDraws(drawsRes.data.data?.slice(-10).reverse() || []);
      setBacktest(backtestRes.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Impossible de joindre le backend.');
    } finally {
      setLoading(false);
    }
  }, [gridSize, heatWindow]);

  useEffect(() => { load(); }, [load]);

  // Données transformées pour les graphiques
  const topNumbers = useMemo(() => {
    if (!analysis?.scores) return [];
    return (analysis.top10 || []).map((n) => ({
      number: n,
      score: Math.round(analysis.scores[n].score * 100),
      status: analysis.scores[n].status,
      delay: analysis.scores[n].delay,
      freq: Math.round(analysis.scores[n].freq_medium * 100),
    }));
  }, [analysis]);

  const barData = useMemo(() => {
    if (!analysis?.scores) return [];
    return Object.entries(analysis.scores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 20)
      .map(([n, s]) => ({ name: n, score: Math.round(s.score * 100), status: s.status }));
  }, [analysis]);

  const perfScore = useMemo(() => {
    if (!backtest || !backtest.gain_pct) return null;
    const pct = backtest.gain_pct;
    if (pct > 10) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (pct > 4)  return { label: 'Bon',       color: 'text-cyan-400',    bg: 'bg-cyan-500/10    border-cyan-500/30'    };
    if (pct > 0)  return { label: 'Légère tendance', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return              { label: 'Proche du hasard', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
  }, [backtest]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="premium-shell space-y-8 pb-12">

      {/* HERO */}
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Moteur statistique</p>
          <h1 className="premium-title">Keno Engine</h1>
          <p className="premium-subtitle">
            Analyse sur {analysis?.total_draws?.toLocaleString() || '…'} tirages réels FDJ.
            Scores composites, grilles IA et backtesting honnête.
          </p>
          <p className="mt-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-300 inline-block">
            Le Keno est un jeu aléatoire. Ce moteur optimise des probabilités mais ne garantit aucun gain.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rafraîchir
        </button>
      </section>

      {error && <ErrorBox msg={error} onRetry={load} />}

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Tirages analysés"
          value={analysis?.total_draws?.toLocaleString() ?? '…'}
          tone="cyan"
        />
        <StatCard
          label="Modèle vs hasard"
          value={backtest ? `+${backtest.gain_pct}%` : '…'}
          hint={backtest ? `${backtest.test_draws} tests` : ''}
          tone="emerald"
        />
        <StatCard
          label="Hits moyens / grille"
          value={backtest ? backtest.model?.mean_hits : '…'}
          hint={`attendu: ${backtest?.expected_random ?? '…'}`}
          tone="amber"
        />
        <StatCard
          label="Score modèle"
          value={perfScore?.label ?? '…'}
          tone="violet"
        />
      </section>

      {loading ? <Loader label="Calcul des scores en cours…" /> : (
        <>
          {/* TOP 10 + BARRE */}
          <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">

            {/* Top 10 numéros */}
            <div className="premium-panel p-6">
              <p className="premium-kicker">Score composite</p>
              <h2 className="text-2xl font-bold text-white mb-5">Top 10 numéros</h2>
              <div className="space-y-2">
                {topNumbers.map((item, i) => (
                  <div key={item.number} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                    <span className="w-5 text-xs text-slate-500">{i + 1}</span>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-sm font-extrabold ${statusColor(item.status)}`}>
                      {item.number}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-white/10 flex-1">
                          <div
                            className={`h-2 rounded-full ${item.status === 'hot' ? 'bg-red-400' : item.status === 'cold' ? 'bg-blue-400' : 'bg-cyan-400'}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white w-10 text-right">{item.score}</span>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-slate-500">
                        <span>Freq {item.freq}%</span>
                        <span>Retard {item.delay}</span>
                        <span className={statusColor(item.status)}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histogramme top 20 */}
            <div className="premium-panel p-6">
              <p className="premium-kicker">Distribution</p>
              <h2 className="text-2xl font-bold text-white mb-5">Score composite — Top 20</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }}
                      formatter={(v, _, { payload }) => [`Score ${v}`, `N°${payload.name} (${payload.status})`]}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.status === 'hot' ? '#f87171' : entry.status === 'cold' ? '#60a5fa' : '#38bdf8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Hot (surreprésenté)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Cold (en retard)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Neutre</span>
              </div>
            </div>
          </section>

          {/* GRILLES IA */}
          <section className="premium-panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="premium-kicker">Génération IA</p>
                <h2 className="text-2xl font-bold text-white">Grilles statistiques</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span>Taille grille</span>
                <input
                  type="number" min={2} max={20} value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-16 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center text-white focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {grids && ['conservative', 'balanced', 'aggressive'].map((strategy) => {
                const gridList = grids[strategy] || [];
                return (
                  <div key={strategy} className={`rounded-2xl border p-5 ${strategyColor(strategy)}`}>
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`text-sm font-bold ${strategyTextColor(strategy)}`}>
                        {strategyLabel(strategy)}
                      </span>
                      <span className="text-xs text-slate-500">{gridList.length} grille(s)</span>
                    </div>
                    <div className="space-y-4">
                      {gridList.map((grid, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {grid.numbers.map((n) => (
                              <span
                                key={n}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold
                                  ${analysis?.scores?.[n]?.status === 'hot'  ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                                    analysis?.scores?.[n]?.status === 'cold' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' :
                                    'bg-white/10 text-white border border-white/10'}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            <span>Score moy. <strong className="text-white">{Math.round(grid.avg_score * 100)}</strong></span>
                            <span className="text-red-400">🔥 {grid.hot} hot</span>
                            <span className="text-blue-400">❄️ {grid.cold} cold</span>
                            <span>{grid.neutral} neutre</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* HEATMAP */}
          <section className="premium-panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="premium-kicker">Fréquence par numéro</p>
                <h2 className="text-2xl font-bold text-white">Heatmap</h2>
                <p className="text-xs text-slate-500 mt-1">Chaud = surreprésenté · Froid = en retard · Gris = normal</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span>Fenêtre</span>
                <select
                  value={heatWindow}
                  onChange={(e) => setHeatWindow(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white focus:outline-none"
                >
                  {[50, 100, 200, 500].map((v) => <option key={v} value={v}>{v} tirages</option>)}
                </select>
              </label>
            </div>

            {heatmap && (
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                {heatmap.data.map((cell) => (
                  <div
                    key={cell.number}
                    className={`relative flex flex-col items-center justify-center rounded-lg py-2 transition-all hover:scale-105 ${heatColor(cell.deviation)}`}
                    title={`N°${cell.number} — ${cell.count} fois (dév. ${cell.deviation > 0 ? '+' : ''}${cell.deviation}σ)`}
                  >
                    <span className="text-xs font-extrabold">{cell.number}</span>
                    <span className="text-[10px] opacity-70">{cell.count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" /> &gt;+1.5σ</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-400" /> +0.5–1.5σ</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-600" /> Normal</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-400" /> -0.5–-1.5σ</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-600" /> &lt;-1.5σ</span>
            </div>
          </section>

          {/* BACKTEST + HISTORIQUE */}
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">

            {/* Backtest */}
            <div className="premium-panel p-6">
              <p className="premium-kicker">Validité du modèle</p>
              <h2 className="text-2xl font-bold text-white mb-5">Backtest</h2>
              {backtest && (
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 text-center ${perfScore?.bg}`}>
                    <div className={`text-4xl font-extrabold ${perfScore?.color}`}>
                      {backtest.gain_pct > 0 ? '+' : ''}{backtest.gain_pct}%
                    </div>
                    <div className="mt-1 text-sm text-slate-300">{perfScore?.label} vs hasard pur</div>
                    <div className="text-xs text-slate-500 mt-1">sur {backtest.test_draws} tirages testés</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Modèle',  val: backtest.model?.mean_hits,           color: 'text-cyan-300' },
                      { label: 'Aléatoire', val: backtest.random_baseline?.mean_hits, color: 'text-slate-400' },
                      { label: 'Attendu',  val: backtest.expected_random,            color: 'text-slate-500' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <div className={`text-xl font-bold ${color}`}>{val}</div>
                        <div className="text-xs text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Distribution des hits */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Distribution des hits</p>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(backtest.model?.distribution || {}).map(([hits, count]) => (
                        <div key={hits} className="flex flex-col items-center gap-0.5">
                          <div
                            className="w-7 rounded-t bg-cyan-500/60"
                            style={{ height: `${Math.round((count / backtest.test_draws) * 60)}px`, minHeight: 2 }}
                          />
                          <span className="text-[10px] text-slate-500">{hits}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic">{backtest.disclaimer}</p>
                </div>
              )}
            </div>

            {/* Historique récent */}
            <div className="premium-panel p-6">
              <p className="premium-kicker">Données réelles FDJ</p>
              <h2 className="text-2xl font-bold text-white mb-5">10 derniers tirages</h2>
              <div className="space-y-2">
                {draws.map((draw, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">{draw.date}</span>
                      <span className="text-xs text-slate-600">{draw.numbers?.length} numéros</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(draw.numbers || []).map((n) => (
                        <span
                          key={n}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold
                            ${analysis?.scores?.[n]?.status === 'hot'  ? 'bg-red-500/20 text-red-300' :
                              analysis?.scores?.[n]?.status === 'cold' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-white/10 text-slate-300'}`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
