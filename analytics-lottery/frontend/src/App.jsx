import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, NavLink, Routes, Route } from 'react-router-dom';

const HubPage = lazy(() => import('./pages/HubPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const KenoAnalyzer = lazy(() => import('./pages/KenoAnalyzer'));
const EuroMillionsAnalyzer = lazy(() => import('./pages/EuroMillionsAnalyzer'));
const LotoAnalyzer = lazy(() => import('./pages/LotoAnalyzer'));
const SportsAnalyzer = lazy(() => import('./pages/SportsAnalyzer'));
const RecentResults = lazy(() => import('./pages/RecentResults'));
const PredictionHistory = lazy(() => import('./pages/PredictionHistory'));
const Performance = lazy(() => import('./pages/Performance'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const BilanIA = lazy(() => import('./pages/BilanIA'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const NAV_ITEMS = [
  { to: '/hub', label: '🎯 Hub', icon: '★' },
  { to: '/', label: 'Dashboard', icon: '◫' },
  { to: '/bilan', label: '🏆 Bilan IA', icon: '🏆' },
  { to: '/results', label: 'Résultats', icon: '◎' },
  { to: '/history', label: 'Historique', icon: '◌' },
  { to: '/performance', label: 'Performance', icon: '△' },
  { to: '/auth', label: 'Compte', icon: 'U' },
  { to: '/billing', label: 'Abonnement', icon: '$' },
  { to: '/admin', label: '🔐 Admin', icon: '🔑' },
  { to: '/keno', label: 'Keno', icon: 'K' },
  { to: '/euromillions', label: 'EuroMillions', icon: 'E' },
  { to: '/loto', label: 'Loto', icon: 'L' },
  { to: '/sports', label: 'Sports', icon: 'S' },
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-shell">
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} app-sidebar md:flex`}>
          <div className="p-7">
            <div className="premium-logo">AL</div>
            <h1 className="mt-5 text-2xl font-extrabold text-white">Analytics Lottery</h1>
            <p className="mt-2 text-sm text-slate-400">Predictive Intelligence Suite</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
            {NAV_ITEMS.map((item) => (
              <SideNavLink key={item.to} {...item} />
            ))}
          </nav>

          <div className="m-4 rounded-3xl border border-cyan-400/10 bg-white/5 p-4 text-xs text-slate-400">
            <div className="premium-kicker">Mode</div>
            <div className="mt-2 text-sm font-semibold text-slate-100">Adaptive V5 Ready</div>
            <div className="mt-2">Architecture préparée pour auth, abonnement et monitoring.</div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <header className="app-topbar">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 md:hidden"
            >
              ☰
            </button>
            <div>
              <p className="premium-kicker">Premium SaaS Dashboard</p>
              <h2 className="text-lg font-bold text-white">Analyseur Intelligent Multi-Loteries & Sports Predictor</h2>
            </div>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <div className="premium-status-dot" />
              <span className="text-sm text-slate-300">Live Engine</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Suspense fallback={<div className="premium-shell"><div className="premium-panel p-8 text-slate-300">Chargement module...</div></div>}>
              <Routes>
                <Route path="/hub" element={<HubPage />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/results" element={<RecentResults />} />
                <Route path="/history" element={<PredictionHistory />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/bilan" element={<BilanIA />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/keno" element={<KenoAnalyzer />} />
                <Route path="/euromillions" element={<EuroMillionsAnalyzer />} />
                <Route path="/loto" element={<LotoAnalyzer />} />
                <Route path="/sports" element={<SportsAnalyzer />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
}

function SideNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isActive ? 'bg-cyan-500/15 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}
