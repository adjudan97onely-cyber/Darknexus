import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardAPI } from '../services/api';
import { activePredictionsService } from '../services/realDataService';
import StatCard from '../components/StatCard';
import PerformanceSummaryWidget from '../components/PerformanceSummaryWidget';
import QuickActionBar from '../components/QuickActionBar';
import PredictionsList from '../components/PredictionsList';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [overviewRes, predictionsRes] = await Promise.all([
          dashboardAPI.getOverview(),
          activePredictionsService.getActivePredictions()
        ]);
        setOverview(overviewRes.data);
        setPredictions(predictionsRes.data || []);
      } catch (loadError) {
        setError(loadError.response?.data?.detail || loadError.message || 'Chargement impossible');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const performanceData = useMemo(() => Object.entries(overview?.performance || {}).map(([type, item]) => ({
    type,
    accuracy: item.accuracy,
    total: item.total,
    pending: item.pending,
  })), [overview]);

  const modelData = useMemo(() => (overview?.models || []).map((item) => ({
    name: item.name,
    weight: Number(item.weight.toFixed ? item.weight.toFixed(2) : item.weight),
    accuracy: Number((item.accuracy * 100).toFixed(1)),
  })), [overview]);

  if (loading) {
    return <div className="premium-shell"><div className="premium-panel p-10 text-slate-300">Initialisation du dashboard décisionnel...</div></div>;
  }

  return (
    <div className="premium-shell space-y-8">
      <QuickActionBar />
      
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Platform intelligence</p>
          <h1 className="premium-title">Control Center</h1>
          <p className="premium-subtitle">KPIs dynamiques, poids modèles adaptatifs, historique de résultats et suivi opérationnel centralisé.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="premium-button" onClick={() => dashboardAPI.refreshSystem()}>Refresh data</button>
          <button className="premium-button-secondary" onClick={() => dashboardAPI.reconcilePredictions()}>Reconcile</button>
        </div>
      </section>

      {error ? <div className="premium-error">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Prédictions actives" value={overview?.kpis?.active_predictions || 0} tone="cyan" />
        <StatCard label="Validées" value={overview?.kpis?.validated_predictions || 0} tone="emerald" />
        <StatCard label="Accuracy globale" value={`${overview?.kpis?.global_accuracy || 0}%`} tone="amber" />
        <StatCard label="Poids moyen" value={overview?.kpis?.avg_model_weight || 0} tone="violet" />
      </section>

      <PerformanceSummaryWidget />

      {/* ACTIVE PREDICTIONS DISPLAY */}
      <section>
        <PredictionsList predictions={predictions} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="premium-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="premium-kicker">Accuracy engine</p>
              <h2 className="text-2xl font-bold text-white">Performance par type</h2>
            </div>
            <span className="premium-badge">Live</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Bar dataKey="accuracy" fill="#22d3ee" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-panel p-6">
          <div className="mb-5">
            <p className="premium-kicker">Recent draws</p>
            <h2 className="text-2xl font-bold text-white">Signal de marché</h2>
          </div>
          <div className="space-y-4">
            {(overview?.recent_results || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.lottery_type}</div>
                    <div className="text-xs text-slate-500">{item.draw_date}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {item.numbers.slice(0, 6).map((number) => <span key={`${item.id}-${number}`} className="premium-tag">{number}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="premium-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="premium-kicker">Adaptive models</p>
              <h2 className="text-2xl font-bold text-white">Réglage dynamique</h2>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-22} textAnchor="end" height={90} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Line type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={3} />
                <Line type="monotone" dataKey="accuracy" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-panel p-6">
          <div className="mb-5">
            <p className="premium-kicker">Sports pulse</p>
            <h2 className="text-2xl font-bold text-white">KPIs football</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Matchs</div>
              <div className="mt-2 text-4xl font-extrabold text-white">{overview?.sports_statistics?.total_matches || 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">BTTS / Over 2.5</div>
              <div className="mt-2 text-2xl font-bold text-cyan-300">{Math.round((overview?.sports_statistics?.btts_rate || 0) * 100)}% / {Math.round((overview?.sports_statistics?.over_2_5_rate || 0) * 100)}%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Dernières prédictions</div>
              <div className="mt-4 space-y-3">
                {(overview?.recent_predictions || []).slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-white">#{item.id} · {item.subtype}</div>
                      <div className="text-xs text-slate-500">{item.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-300">{item.confidence}%</div>
                      <div className="text-xs text-slate-500">score {item.score}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
