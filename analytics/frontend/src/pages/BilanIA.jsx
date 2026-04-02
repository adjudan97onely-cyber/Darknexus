import React, { useCallback, useEffect, useState } from 'react';
import { bilanAPI } from '../services/apiService';

const LOTTERY_OPTIONS = [
  { value: 'keno', label: 'Keno', icon: 'K', color: 'from-cyan-500 to-blue-600' },
  { value: 'euromillions', label: 'EuroMillions', icon: 'E', color: 'from-amber-500 to-orange-600' },
  { value: 'loto', label: 'Loto', icon: 'L', color: 'from-emerald-500 to-green-600' },
];

function ScoreBadge({ score }) {
  const color =
    score >= 40 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
    score >= 25 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
    'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}%
    </span>
  );
}

function NumberChip({ number, isMatched }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
        ${isMatched
          ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
          : 'bg-slate-800 text-slate-400 border border-white/10'
        }`}
    >
      {number}
    </span>
  );
}

export default function BilanIA() {
  const [lottery, setLottery] = useState('keno');
  const [bilan, setBilan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (type) => {
    setLoading(true);
    setError('');
    try {
      const res = await bilanAPI.getLotteryBilan(type, 20);
      setBilan(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Impossible de charger le bilan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(lottery);
  }, [lottery, load]);

  const selectedOption = LOTTERY_OPTIONS.find((o) => o.value === lottery);

  return (
    <div className="premium-shell space-y-8">
      {/* ── En-tête ─────────────────────────────────────────────── */}
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Analyse comparative</p>
          <h1 className="premium-title">Bilan IA</h1>
          <p className="premium-subtitle">
            Est-ce que l'IA prédit mieux que le hasard pur ?
            Pour chaque tirage validé, on compare ce que l'IA a proposé avec les numéros réellement sortis.
          </p>
        </div>
        <div className={`h-28 w-28 rounded-[2rem] bg-gradient-to-br ${selectedOption?.color} shadow-[0_24px_60px_rgba(12,18,45,0.45)] flex items-center justify-center text-4xl font-black text-white`}>
          {selectedOption?.icon}
        </div>
      </section>

      {/* ── Sélecteur de loterie ────────────────────────────────── */}
      <section className="flex flex-wrap gap-3">
        {LOTTERY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLottery(opt.value)}
            className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all
              ${lottery === opt.value
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </section>

      {error ? <div className="premium-error">{error}</div> : null}
      {loading ? (
        <div className="premium-panel p-10 text-center text-slate-400">Chargement du bilan...</div>
      ) : bilan ? (
        <>
          {/* ── Verdict global ───────────────────────────────────── */}
          <section className="premium-panel p-6">
            <p className="premium-kicker">Verdict IA</p>
            <h2 className="text-2xl font-bold text-white mb-4">Résumé en un coup d'œil</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm leading-relaxed text-slate-300">{bilan.verdict}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-3xl font-extrabold text-cyan-300">{bilan.total_evaluated}</div>
                <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">Tirages évalués</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className={`text-3xl font-extrabold ${bilan.ai_better_than_random ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {bilan.avg_score_pct}%
                </div>
                <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">Score moyen IA</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-3xl font-extrabold text-slate-400">{bilan.random_baseline_pct}%</div>
                <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">Hasard pur</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className={`text-3xl font-extrabold ${bilan.gain_vs_random_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {bilan.gain_vs_random_pct >= 0 ? '+' : ''}{bilan.gain_vs_random_pct}%
                </div>
                <div className="mt-1 text-xs text-slate-500 uppercase tracking-wider">vs hasard</div>
              </div>
            </div>

            {bilan.total_evaluated === 0 ? (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-300">
                  <strong>Pas encore de données validées.</strong> L'IA génère des prédictions à chaque tirage.
                  Reviens après le prochain tirage {lottery} — le comparatif apparaîtra ici.
                </p>
              </div>
            ) : null}
          </section>

          {/* ── Tableau détaillé ─────────────────────────────────── */}
          {bilan.rows.length > 0 ? (
            <section className="premium-panel p-6">
              <p className="premium-kicker">Détail par tirage</p>
              <h2 className="text-2xl font-bold text-white mb-5">Prédictions vs Réalité</h2>

              <div className="space-y-4">
                {bilan.rows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                    {/* En-tête de la ligne */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Prédiction du </span>
                        <span className="text-sm font-semibold text-slate-200">{row.prediction_date || '—'}</span>
                        {row.draw_date && row.draw_date !== row.prediction_date ? (
                          <span className="ml-2 text-xs text-slate-500">→ Tirage {row.draw_date}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={row.score} />
                        <span className={`text-xs font-semibold ${row.status === 'won' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {row.matched_count}/{row.predicted_count} trouvés
                        </span>
                      </div>
                    </div>

                    {/* Numéros proposés par l'IA */}
                    <div className="mb-3">
                      <p className="mb-2 text-xs text-slate-500 uppercase tracking-wider">Proposition IA</p>
                      <div className="flex flex-wrap gap-1.5">
                        {row.predicted.map((n) => (
                          <NumberChip
                            key={`pred-${row.id}-${n}`}
                            number={n}
                            isMatched={row.matched.includes(n)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Numéros réellement sortis */}
                    {row.actual.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs text-slate-500 uppercase tracking-wider">Numéros sortis</p>
                        <div className="flex flex-wrap gap-1.5">
                          {row.actual.map((n) => (
                            <NumberChip
                              key={`actual-${row.id}-${n}`}
                              number={n}
                              isMatched={row.matched.includes(n)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Tirage réel non disponible pour cette date.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Explication ─────────────────────────────────────── */}
          <section className="premium-panel p-6">
            <p className="premium-kicker">Comment lire ce bilan ?</p>
            <h2 className="text-2xl font-bold text-white mb-4">Guide rapide</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">7</span>
                  <span className="text-sm font-semibold text-white">Numéro vert = trouvé</span>
                </div>
                <p className="text-xs text-slate-400">L'IA avait proposé ce numéro ET il est sorti au tirage. C'est un bon résultat.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-xs font-bold text-slate-400">7</span>
                  <span className="text-sm font-semibold text-white">Numéro gris = manqué</span>
                </div>
                <p className="text-xs text-slate-400">Proposé par l'IA mais pas sorti ce tirage-là. Ça arrive — la loterie reste du hasard.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">Score</span>
                </div>
                <p className="text-xs text-slate-400">
                  Score = % de numéros trouvés parmi ceux proposés. Le hasard pur donne environ{' '}
                  <strong className="text-slate-300">{bilan.random_baseline_pct}%</strong> sur ce jeu.
                  L'IA vise mieux.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
