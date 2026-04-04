/**
 * FeaturesPanel
 *
 * Affiche les fonctionnalités détectées par FeatureDetector.
 *
 * Props :
 *  - result  : DetectionResult | null
 *  - onClose : () => void
 */

const LEVEL_META = {
  high:   { label: 'Élevé',  color: 'var(--success)',  bar: '#44ff88' },
  medium: { label: 'Moyen',  color: 'var(--warning)',  bar: '#ffaa00' },
  low:    { label: 'Faible', color: 'var(--text-dim)', bar: '#5a5a88' },
};

const COMPLEXITY_LABELS = {
  simple:   { label: 'Simple',   color: 'var(--success)' },
  moderate: { label: 'Modéré',   color: 'var(--warning)' },
  complex:  { label: 'Complexe', color: 'var(--error)' },
};

// ── Barre de confiance ────────────────────────────────────────────────────────

function ConfidenceBar({ confidence, level }) {
  const meta = LEVEL_META[level] ?? LEVEL_META.low;
  return (
    <div className="fp-bar-wrap">
      <div
        className="fp-bar-fill"
        style={{ width: `${confidence}%`, background: meta.bar }}
        aria-label={`Confiance : ${confidence}%`}
      />
    </div>
  );
}

// ── Ligne de fonctionnalité ───────────────────────────────────────────────────

function FeatureRow({ feature }) {
  const meta = LEVEL_META[feature.level] ?? LEVEL_META.low;
  return (
    <div className="fp-feature">
      <span className="fp-feature__icon">{feature.icon}</span>

      <div className="fp-feature__info">
        <div className="fp-feature__top">
          <span className="fp-feature__name">{feature.name}</span>
          <span className="fp-feature__score" style={{ color: meta.color }}>
            {feature.confidence}%
          </span>
        </div>
        <ConfidenceBar confidence={feature.confidence} level={feature.level} />
      </div>

      <span className="fp-feature__level" style={{ color: meta.color }}>
        {meta.label}
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function FeaturesPanel({ result, onClose }) {
  if (!result) return null;

  const { features, summary } = result;
  const cplx = COMPLEXITY_LABELS[summary.complexity] ?? COMPLEXITY_LABELS.simple;

  return (
    <div className="features-panel">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="fp-header">
        <span className="fp-title">⊕ Fonctionnalités</span>

        <div className="fp-header-stats">
          {summary.total > 0 ? (
            <>
              {summary.high   > 0 && <span className="fp-stat fp-stat--high">{summary.high} élevé</span>}
              {summary.medium > 0 && <span className="fp-stat fp-stat--medium">{summary.medium} moyen</span>}
              {summary.low    > 0 && <span className="fp-stat fp-stat--low">{summary.low} faible</span>}
            </>
          ) : (
            <span className="fp-stat fp-stat--none">Aucune détectée</span>
          )}
        </div>

        <button
          className="sp-close"
          onClick={onClose}
          title="Fermer le panneau"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {/* ── Métriques script ─────────────────────────────────────────────── */}
      <div className="fp-metrics">
        <div className="fp-metric">
          <span className="fp-metric__val" style={{ color: cplx.color }}>
            {cplx.label}
          </span>
          <span className="fp-metric__lbl">Complexité</span>
        </div>
        <div className="fp-metric">
          <span className="fp-metric__val">{summary.comboCount}</span>
          <span className="fp-metric__lbl">Combos</span>
        </div>
        <div className="fp-metric">
          <span className="fp-metric__val">{summary.functionCount}</span>
          <span className="fp-metric__lbl">Fonctions</span>
        </div>
        <div className="fp-metric">
          <span className="fp-metric__val">{summary.total}</span>
          <span className="fp-metric__lbl">Features</span>
        </div>
      </div>

      {/* ── Liste des features ───────────────────────────────────────────── */}
      <div className="fp-list">
        {features.length === 0 ? (
          <div className="fp-empty">
            <span className="fp-empty__icon">○</span>
            <span>Aucune fonctionnalité reconnue.</span>
            <span className="fp-empty__hint">Vérifiez les noms de combos et de variables.</span>
          </div>
        ) : (
          features.map(f => <FeatureRow key={f.id} feature={f} />)
        )}
      </div>
    </div>
  );
}
