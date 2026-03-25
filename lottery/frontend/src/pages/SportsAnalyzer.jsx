import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sportsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import QuickActionBar from '../components/QuickActionBar';
import TopMatchesSection from '../components/TopMatchesSection';

export default function SportsAnalyzer() {
  const [leagues, setLeagues] = useState([]);
  const [matches, setMatches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [minConfidence, setMinConfidence] = useState(70);
  const [take, setTake] = useState(8);

  useEffect(() => {
    async function loadBase() {
      const [leagueRes, statsRes] = await Promise.all([
        sportsAPI.getLeagues(),
        sportsAPI.getSportsStatistics(),
      ]);
      setLeagues(leagueRes.data || []);
      setStatistics(statsRes.data || {});
    }
    loadBase();
  }, []);

  useEffect(() => {
    async function loadByFilter() {
      const params = {
        status: 'scheduled',
        country: selectedCountry || undefined,
        league: selectedLeague || undefined,
        limit: 30,
      };
      const [matchRes, recRes] = await Promise.all([
        sportsAPI.getUpcomingMatches(params),
        sportsAPI.getSportsRecommendations({ ...params, min_confidence: minConfidence, take }),
      ]);
      setMatches(matchRes.data || []);
      setRecommendations(recRes.data || []);
    }
    loadByFilter();
  }, [selectedCountry, selectedLeague, minConfidence, take]);

  const countries = useMemo(() => [...new Set(leagues.map((item) => item.country))], [leagues]);
  const availableLeagues = useMemo(() => leagues.filter((item) => !selectedCountry || item.country === selectedCountry), [leagues, selectedCountry]);

  async function handleSelectMatch(match) {
    setSelectedMatch(match);
    const response = await sportsAPI.predictMatch(match.home_team, match.away_team);
    setPrediction({ ...response.data, league: match.league, country: match.country });
  }

  const chartData = [
    { name: 'Home', value: Number(((statistics?.home_win_rate || 0) * 100).toFixed(1)) },
    { name: 'Draw', value: Number(((statistics?.draw_rate || 0) * 100).toFixed(1)) },
    { name: 'Away', value: Number(((statistics?.away_win_rate || 0) * 100).toFixed(1)) },
    { name: 'BTTS', value: Number(((statistics?.btts_rate || 0) * 100).toFixed(1)) },
  ];

  return (
    <div className="premium-shell space-y-8">
      <QuickActionBar />
      
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Sports trading desk</p>
          <h1 className="premium-title">Football Predictor</h1>
          <p className="premium-subtitle">Filtres par pays et ligue, match selection, probabilités détaillées et auto-curation des signaux les plus fiables.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Matchs analysés" value={statistics?.total_matches || 0} tone="cyan" />
        <StatCard label="Goals / match" value={statistics?.average_goals || 0} tone="emerald" />
        <StatCard label="Over 2.5" value={`${Math.round((statistics?.over_2_5_rate || 0) * 100)}%`} tone="amber" />
        <StatCard label="BTTS" value={`${Math.round((statistics?.btts_rate || 0) * 100)}%`} tone="violet" />
      </section>

      <section className="premium-panel grid gap-4 p-6 lg:grid-cols-4">
        <label className="premium-field">
          <span>Pays</span>
          <select value={selectedCountry} onChange={(event) => { setSelectedCountry(event.target.value); setSelectedLeague(''); }}>
            <option value="">Tous</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </label>
        <label className="premium-field">
          <span>Ligue</span>
          <select value={selectedLeague} onChange={(event) => setSelectedLeague(event.target.value)}>
            <option value="">Toutes</option>
            {availableLeagues.map((league) => <option key={league.league} value={league.league}>{league.league}</option>)}
          </select>
        </label>
        <label className="premium-field">
          <span>Confiance min.</span>
          <input type="number" min="50" max="99" value={minConfidence} onChange={(event) => setMinConfidence(Number(event.target.value))} />
        </label>
        <label className="premium-field">
          <span>Signals</span>
          <input type="number" min="1" max="20" value={take} onChange={(event) => setTake(Number(event.target.value))} />
        </label>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-panel p-6">
          <p className="premium-kicker">Market baseline</p>
          <h2 className="text-2xl font-bold text-white">Distribution ligue</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16 }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="premium-kicker">Auto-selection</p>
              <h2 className="text-2xl font-bold text-white">Top matchs {'>'} confiance cible</h2>
            </div>
            <span className="premium-badge">{recommendations.length} signaux</span>
          </div>
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.prediction_id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{item.match}</div>
                    <div className="text-xs text-slate-500">{item.country} · {item.league}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-300">{item.confidence}%</div>
                    <div className="text-xs text-slate-500">BTTS {Math.round(item.btts * 100)}%</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
                  <div>Best bet: <span className="font-semibold text-white">{item.best_bet}</span></div>
                  <div>Prob.: <span className="font-semibold text-white">{Math.round(item.probability * 100)}%</span></div>
                  <div>Over 2.5: <span className="font-semibold text-white">{Math.round(item.over_2_5 * 100)}%</span></div>
                  <div>Reliab.: <span className="font-semibold text-white">{item.reliability}</span></div>
                </div>
                <p className="mt-3 text-sm text-slate-400">{item.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="premium-panel p-6">
          <div className="mb-5">
            <p className="premium-kicker">Matches by league</p>
            <h2 className="text-2xl font-bold text-white">Liste des matchs</h2>
          </div>
          <div className="space-y-3">
            {matches.map((match) => (
              <button key={match.id} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10" onClick={() => handleSelectMatch(match)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-white">{match.home_team} vs {match.away_team}</div>
                    <div className="text-xs text-slate-500">{match.country} · {match.league}</div>
                  </div>
                  <div className="text-xs text-slate-400">{new Date(match.match_date).toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="premium-panel p-6">
          <div className="mb-5">
            <p className="premium-kicker">Detailed probabilities</p>
            <h2 className="text-2xl font-bold text-white">{selectedMatch ? `${selectedMatch.home_team} vs ${selectedMatch.away_team}` : 'Sélectionne un match'}</h2>
          </div>
          {prediction ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Victoire</div><div className="mt-2 text-3xl font-bold text-white">{Math.round(prediction.home_probability * 100)}%</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Nul</div><div className="mt-2 text-3xl font-bold text-white">{Math.round(prediction.draw_probability * 100)}%</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Extérieur</div><div className="mt-2 text-3xl font-bold text-white">{Math.round(prediction.away_probability * 100)}%</div></div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Over 2.5</div><div className="mt-2 text-xl font-bold text-cyan-300">{Math.round(prediction.over_2_5 * 100)}%</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Under 2.5</div><div className="mt-2 text-xl font-bold text-violet-300">{Math.round(prediction.under_2_5 * 100)}%</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">BTTS</div><div className="mt-2 text-xl font-bold text-emerald-300">{Math.round(prediction.btts_probability * 100)}%</div></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">Confiance</div><div className="mt-2 text-xl font-bold text-amber-300">{prediction.confidence}%</div></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Score attendu</div>
                  <div className="mt-2 text-3xl font-bold text-white">{prediction.expected_score_home} - {prediction.expected_score_away}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Fiabilité / Volatilité</div>
                  <div className="mt-2 text-lg font-bold text-white">{prediction.reliability_score} / {prediction.volatility_score}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-slate-200">{prediction.recommendation}</div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">Choisis un match pour afficher les probabilités détaillées.</div>
          )}
        </div>
      </section>

      <TopMatchesSection matches={recommendations} />
    </div>
  );
}
