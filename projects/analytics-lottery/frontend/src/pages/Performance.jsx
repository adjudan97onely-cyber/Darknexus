import React, { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';

export default function Performance() {
  const [performance, setPerformance] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [perfRes, notificationsRes] = await Promise.all([
          dashboardAPI.getPerformance(),
          dashboardAPI.getNotifications(false, 12),
        ]);
        setPerformance(perfRes.data);
        setNotifications(Array.isArray(notificationsRes.data?.data) ? notificationsRes.data.data : notificationsRes.data || []);
      } catch (err) {
        console.log('Performance load error:', err.message);
      }
    }
    load();
  }, []);

  const byType = Object.entries(performance?.by_type || {}).map(([type, value]) => ({
    type,
    accuracy: value.accuracy,
    total: value.total,
    pending: value.pending,
  }));

  const modelData = (performance?.overview?.models || []).map((item) => ({
    name: item.name,
    weight: item.weight,
    accuracy: Number((item.accuracy * 100).toFixed(1)),
  }));

  return (
    <div className="premium-shell space-y-8">
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Adaptive intelligence</p>
          <h1 className="premium-title">Performance</h1>
          <p className="premium-subtitle">Mesure consolidée des performances, poids modèles adaptatifs et signal opérationnel de la plateforme.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Précision globale" value={`${performance?.overview?.kpis?.global_accuracy || 0}%`} tone="emerald" />
        <StatCard label="Prédictions actives" value={performance?.overview?.kpis?.active_predictions || 0} tone="cyan" />
        <StatCard label="Validées" value={performance?.overview?.kpis?.validated_predictions || 0} tone="amber" />
        <StatCard label="Poids moyens" value={performance?.overview?.kpis?.avg_model_weight || 0} tone="violet" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="premium-panel p-6">
          <p className="premium-kicker">Accuracy by type</p>
          <h2 className="text-2xl font-bold text-white">Historique de précision</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Bar dataKey="accuracy" fill="#34d399" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="premium-panel p-6">
          <p className="premium-kicker">Model adaptation</p>
          <h2 className="text-2xl font-bold text-white">Pondération dynamique</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-20} textAnchor="end" height={90} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Line type="monotone" dataKey="weight" stroke="#38bdf8" strokeWidth={3} />
                <Line type="monotone" dataKey="accuracy" stroke="#f472b6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="premium-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="premium-kicker">Operational feed</p>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <button className="premium-button-secondary" onClick={() => dashboardAPI.markNotificationsRead()}>Tout marquer lu</button>
        </div>
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="premium-badge">{item.type}</span>
                <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
