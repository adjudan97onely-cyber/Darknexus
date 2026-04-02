import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Play, Target, Brain } from 'lucide-react';
import { predictionsAPI } from '../services/predictionsAPI';
import { predictionsEnrichedService } from '../services/realDataService';

export default function HubPage() {
  const [mode, setMode] = useState('play');
  const [todayDate, setTodayDate] = useState('');
  const [savingPrediction, setSavingPrediction] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [predictionsError, setPredictionsError] = useState(null);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const now = new Date();
    setTodayDate(now.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    
    // Charger les prédictions enrichies (matchs + cotes + IA)
    loadEnrichedPredictions();
  }, []);

  const loadEnrichedPredictions = async () => {
    try {
      setPredictionsLoading(true);
      setPredictionsError(null);
      
      console.log('🧠 Chargement des prédictions enrichies (matchs + cotes + IA)...');
      
      const result = await predictionsEnrichedService.getEnrichedPredictions();
      
      if (result.success && result.predictions) {
        console.log(`✅ ${result.predictions.length} prédictions enrichies chargées`);
        
        // Formater les prédictions pour le composant
        const formatted = result.predictions.map((pred, idx) => ({
          id: idx,
          time: pred.prediction?.matchDateTime ? new Date(pred.prediction.matchDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
          team1: pred.homeTeam,
          team2: pred.awayTeam,
          league: pred.league || 'Unknown',
          prediction: pred.prediction?.outcome || 'En attente',
          confidence: Math.round((pred.prediction?.confidence || 0) * 100),
          homeTeam: pred.homeTeam,
          awayTeam: pred.awayTeam,
          signals: pred.signals || {}
        }));
        
        setPredictions(formatted.slice(0, 12)); // Top 12 prédictions
        setMetrics(result.metrics || {});
      } else {
        throw new Error('Pas de prédictions disponibles');
      }
    } catch (error) {
      console.error('❌ Erreur chargement prédictions:', error);
      setPredictionsError(error.message);
      setPredictions([]);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const handlePlayPrediction = async (type, data) => {
    setSavingPrediction(true);
    try {
      const response = await predictionsAPI.savePrediction({
        type,
        numbers: data.numbers,
        confidence: data.confidence,
        metadata: { timestamp: new Date().toISOString() }
      });
      
      // Afficher notification succès
      console.log(`✅ Prédiction ${type} enregistrée:`, response);
      alert(`✅ Prédiction ${type} enregistrée (#${response.id || 'local'})`);
    } catch (error) {
      console.error('❌ Erreur enregistrement:', error);
      alert("❌ Erreur lors de l'enregistrement de la prédiction");
    } finally {
      setSavingPrediction(false);
    }
  };

  return (
    <div className="premium-shell space-y-8 pb-12">
      {/* HEADER */}
      <section className="premium-hero">
        <div>
          <p className="premium-kicker">Tableau de bord intelligent</p>
          <h1 className="premium-title">Analyseur Loteries & Sports</h1>
          <p className="premium-subtitle">Prédictions + Suivi en temps réel + Apprentissage IA</p>
          <p className="text-sm text-slate-400 mt-2">{todayDate}</p>
        </div>
        <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_24px_60px_rgba(12,18,45,0.45)]" />
      </section>

      {/* MODE BUTTONS - LES 3 SECTIONS PRINCIPALES */}
      <section className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setMode('play')}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            mode === 'play'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'border-white/10 bg-white/5 hover:border-emerald-500/50'
          }`}
        >
          <Play className={`w-8 h-8 mb-2 ${mode === 'play' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <div className="font-bold text-white">Jouer Now</div>
          <div className="text-xs text-slate-400">Génère tes choix</div>
        </button>

        <button
          onClick={() => setMode('results')}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            mode === 'results'
              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'border-white/10 bg-white/5 hover:border-cyan-500/50'
          }`}
        >
          <BarChart3 className={`w-8 h-8 mb-2 ${mode === 'results' ? 'text-cyan-400' : 'text-slate-400'}`} />
          <div className="font-bold text-white">Mes Résultats</div>
          <div className="text-xs text-slate-400">Prédictions vs Réalité</div>
        </button>

        <button
          onClick={() => setMode('analysis')}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            mode === 'analysis'
              ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'border-white/10 bg-white/5 hover:border-violet-500/50'
          }`}
        >
          <Brain className={`w-8 h-8 mb-2 ${mode === 'analysis' ? 'text-violet-400' : 'text-slate-400'}`} />
          <div className="font-bold text-white">Analyse IA</div>
          <div className="text-xs text-slate-400">Tendances & Alertes</div>
        </button>
      </section>

      {/* CONTENT AREA */}
      <div className="min-h-[600px]">
        {mode === 'play' && <PlayMode onPlayPrediction={handlePlayPrediction} saving={savingPrediction} matches={predictions} matchesLoading={predictionsLoading} matchesError={predictionsError} />}
        {mode === 'results' && <ResultsMode />}
        {mode === 'analysis' && <AnalysisMode />}
      </div>
    </div>
  );
}

// MODE 1: JE VEUX JOUER
function PlayMode({ onPlayPrediction, saving, matches = [], matchesLoading = false, matchesError = null }) {
  return (
    <div className="space-y-8">
      {/* SECTION KENO/LOTO */}
      <section className="premium-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Loteries d'aujourd'hui</h2>
            <p className="text-sm text-slate-400">3 grilles proposées par type</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KENO */}
          <LotteryGridCard
            name="KENO"
            icon="🎲"
            color="cyan"
            gridNumber={1}
            proposal="5 12 18 27 33 44 52 61"
            score="78%"
            risk="Modéré"
            numbers={[5, 12, 18, 27, 33, 44, 52, 61]}
            confidence={78}
            type="keno"
            onPlay={onPlayPrediction}
            saving={saving}
          />
          
          {/* LOTO */}
          <LotteryGridCard
            name="LOTO"
            icon="✨"
            color="emerald"
            gridNumber={2}
            proposal="6 15 22 31 41 45"
            score="82%"
            risk="Faible"
            numbers={[6, 15, 22, 31, 41, 45]}
            confidence={82}
            type="loto"
            onPlay={onPlayPrediction}
            saving={saving}
          />

          {/* EUROMILLIONS */}
          <LotteryGridCard
            name="EUROMILLIONS"
            icon="💎"
            color="violet"
            gridNumber={3}
            proposal="7 18 25 37 43 +2 +11"
            score="71%"
            risk="Élevé"
            numbers={[7, 18, 25, 37, 43]}
            confidence={71}
            type="euromillions"
            onPlay={onPlayPrediction}
            saving={saving}
          />
        </div>
      </section>

      {/* SECTION FOOTBALL */}
      <section className="premium-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Top 10 Matchs du Jour</h2>
            <p className="text-sm text-slate-400">Classés par fiabilité • Les meilleures prédictions</p>
          </div>
        </div>

        <div className="space-y-3">
          {matchesLoading ? (
            <div className="text-center py-8 text-slate-400">
              ⏳ Chargement des matchs réels...
            </div>
          ) : matchesError ? (
            <div className="text-center py-8 text-slate-400">
              ℹ️ Matchs temporairement indisponibles — réessaie dans quelques instants
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              ℹ️ Aucun match disponible
            </div>
          ) : (
            matches.map((match, idx) => (
              <SportsMatchCard key={idx} match={match} onPlay={onPlayPrediction} saving={saving} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// MODE 2: MES RÉSULTATS
function ResultsMode() {
  const results = [];
  const systemAccuracy = {};
  return (
    <div className="space-y-8">
      <section className="premium-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Comparaison Prédictions vs Résultats</h2>
            <p className="text-sm text-slate-400">Hier : Résultats du tirage Keno de 20h</p>
          </div>
        </div>

        {/* KENO COMPARISON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">MA PRÉDICTION</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 12, 18, 27, 33, 44, 52, 61].map(n => (
                <div key={n} className="bg-emerald-500/20 border border-emerald-400 rounded-lg py-2 text-center font-bold text-emerald-300">
                  {n}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-6 bg-white/5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">RÉSULTAT RÉEL</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 18, 42, 60, 7, 15, 23, 9].map((n, idx) => {
                const matched = [5, 12, 18, 27, 33, 44, 52, 61].includes(n);
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-lg py-2 text-center font-bold ${
                      matched 
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' 
                        : 'bg-slate-500/20 border-slate-400 text-slate-400'
                    }`}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SCORE */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-xl p-6 text-center">
          <div className="text-5xl font-bold text-cyan-300 mb-2">2 / 8</div>
          <div className="text-slate-300">Bons numéros trouvés</div>
          <div className="text-2xl font-bold text-white mt-3">Précision: 25%</div>
        </div>
      </section>

      {/* FOOTBALL TICKETS */}
      <section className="premium-panel p-8">
        <h2 className="text-xl font-bold text-white mb-6">Ticket Football d'hier</h2>
        <div className="space-y-3 mb-6">
          {results.length === 0 ? (
            <div className="text-center py-4 text-slate-400">
              📊 Aucun résultat enregistré
            </div>
          ) : (
            results.map((result, idx) => (
              <SportsResultCard key={idx} result={result} />
            ))
          )}
        </div>
        <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-300">
            {systemAccuracy?.football?.successes || 0} / {systemAccuracy?.football?.total || 0}
          </div>
          <div className="text-slate-400">Prédictions correctes</div>
          <div className="text-xl font-bold text-white mt-2">
            Précision: {systemAccuracy?.football?.accuracy || 0}%
          </div>
        </div>
      </section>
    </div>
  );
}

// MODE 3: ANALYSE IA
function AnalysisMode() {
  return (
    <div className="space-y-8">
      <section className="premium-panel p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Analyse Intelligente</h2>

        {/* HOT/COLD NUMBERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5">
            <h3 className="text-lg font-bold text-red-300 mb-4">🔥 NUMÉROS CHAUDS</h3>
            <div className="text-sm text-slate-300 mb-4">Apparus {`>`} 15% plus que normal</div>
            <div className="flex flex-wrap gap-2">
              {[12, 27, 33, 5, 44].map(n => (
                <div key={n} className="bg-red-500/30 border border-red-400 rounded-full px-4 py-2 text-red-300 font-bold text-sm">
                  #{n}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-4">Apparitions: +3.2% cette semaine</div>
          </div>

          <div className="border border-blue-500/30 rounded-xl p-6 bg-blue-500/5">
            <h3 className="text-lg font-bold text-blue-300 mb-4">❄️ NUMÉROS FROIDS</h3>
            <div className="text-sm text-slate-300 mb-4">N'ont pas sorti depuis longtemps</div>
            <div className="flex flex-wrap gap-2">
              {[2, 7, 15, 22, 61].map(n => (
                <div key={n} className="bg-blue-500/30 border border-blue-400 rounded-full px-4 py-2 text-blue-300 font-bold text-sm">
                  #{n}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-4">Absent depuis: 28, 42, 34, 29, 51 jours</div>
          </div>
        </div>

        {/* ALERTS */}
        <div className="border border-amber-500/30 rounded-xl p-6 bg-amber-500/5">
          <h3 className="text-lg font-bold text-amber-300 mb-4">⚠️ ALERTES IA</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">⚠️</div>
              <div>
                <div className="font-semibold text-white">Anomalie détectée</div>
                <div className="text-sm text-slate-400">Le numéro 12 est surreprésenté: +3.2% vs moyenne historique</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">📈</div>
              <div>
                <div className="font-semibold text-white">Tendance à la hausse</div>
                <div className="text-sm text-slate-400">Numéros pairs: +1.8% cette semaine (tend vers 55%)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">🎯</div>
              <div>
                <div className="font-semibold text-white">Recommandation</div>
                <div className="text-sm text-slate-400">Privilégier les pairs chauds + froids pour équilibre</div>
              </div>
            </div>
          </div>
        </div>

        {/* PERFORMANCE SCORE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="border border-white/10 rounded-xl p-6 bg-white/5 text-center">
            <div className="text-sm text-slate-400 mb-2">Précision Keno</div>
            <div className="text-4xl font-bold text-emerald-400">72%</div>
            <div className="text-xs text-slate-500 mt-2">7 j: +2.5%</div>
          </div>
          <div className="border border-white/10 rounded-xl p-6 bg-white/5 text-center">
            <div className="text-sm text-slate-400 mb-2">Précision Foot</div>
            <div className="text-4xl font-bold text-blue-400">68%</div>
            <div className="text-xs text-slate-500 mt-2">7 j: -1.2%</div>
          </div>
          <div className="border border-white/10 rounded-xl p-6 bg-white/5 text-center">
            <div className="text-sm text-slate-400 mb-2">Score Global</div>
            <div className="text-4xl font-bold text-cyan-400">70%</div>
            <div className="text-xs text-slate-500 mt-2">En amélioration ✓</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// COMPONENTS

function LotteryGridCard({ name, icon, color, gridNumber, proposal, score, risk, numbers, confidence, type, onPlay, saving }) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'from-violet-500 to-purple-500',
  };

  const handleSave = () => {
    onPlay(type, { numbers, confidence });
  };

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-white/5 hover:border-white/20 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl mb-1">{icon}</div>
          <div className="font-bold text-white">{name}</div>
        </div>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors[color]} bg-opacity-20 text-sm font-semibold`}>
          {score}
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3 mb-4">
        <div className="text-xs text-slate-400 mb-2">Grille proposée:</div>
        <div className="text-lg font-mono font-bold text-white break-all">{proposal}</div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-400">Risque: <span className="text-white font-semibold">{risk}</span></div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 rounded-lg text-emerald-300 font-semibold transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Jouer'}
        </button>
      </div>
    </div>
  );
}

function SportsMatchCard({ match, onPlay, saving }) {
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-emerald-400';
    if (conf >= 70) return 'text-cyan-400';
    if (conf >= 60) return 'text-amber-400';
    return 'text-slate-400';
  };

  const handleAddPrediction = () => {
    onPlay('football', { 
      match: `${match.team1} vs ${match.team2}`,
      prediction: match.prediction,
      confidence: match.confidence 
    });
  };

  return (
    <div className="border border-white/10 rounded-xl p-4 bg-white/5 hover:border-white/20 transition-all flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">{match.time}</div>
          <div className="flex-1">
            <div className="font-bold text-white">{match.team1} vs {match.team2}</div>
            <div className="text-xs text-slate-500">{match.league}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className={`text-xl font-bold ${getConfidenceColor(match.confidence)}`}>{match.prediction}</div>
          <div className="text-xs text-slate-400">{match.confidence}%</div>
        </div>
        <button 
          onClick={handleAddPrediction}
          disabled={saving}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 rounded-lg text-cyan-300 font-semibold text-sm transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Jouer'}
        </button>
      </div>
    </div>
  );
}

function SportsResultCard({ result }) {
  const bgColor = result.correct ? 'bg-emerald-500/20 border-emerald-400' : 'bg-red-500/20 border-red-400';
  const textColor = result.correct ? 'text-emerald-300' : 'text-red-300';
  const icon = result.correct ? '✅' : '❌';

  return (
    <div className={`border rounded-lg p-3 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-xl">{icon}</div>
          <div className="flex-1">
            <div className={`font-semibold ${textColor}`}>{result.team1} vs {result.team2}</div>
            <div className="text-xs text-slate-400">{result.league}</div>
          </div>
        </div>
        <div className={`font-bold text-sm ${textColor}`}>
          Prédit: {result.prediction} | Résultat: {result.actual}
        </div>
      </div>
    </div>
  );
}

// MOCK DATA
// MOCK_MATCHES supprimé - maintenant généré par aiPredictionEngine

// MOCK_RESULTS supprimé - maintenant généré par aiPredictionEngine
