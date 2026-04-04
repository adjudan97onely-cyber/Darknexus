/**
 * StructurePanel
 *
 * Affiche le résultat de l'analyse structurelle d'un script GPC,
 * produit par ScriptParser via IPC parser:parse.
 *
 * Props :
 *  - result  : ParseResult | null
 *  - onClose : () => void
 */

const COMPLEXITY_META = {
  simple:   { label: 'Simple',   color: 'var(--success)',  icon: '○' },
  moderate: { label: 'Modéré',  color: 'var(--warning)',  icon: '◐' },
  complex:  { label: 'Complexe', color: 'var(--error)',    icon: '●' },
};

// ── Sous-composants ────────────────────────────────────────────────────────────

function SpSection({ title, children }) {
  return (
    <div className="sp-section">
      <div className="sp-section__title">{title}</div>
      {children}
    </div>
  );
}

function SpItem({ icon, name, meta, variant = '' }) {
  return (
    <div className={`sp-item ${variant ? `sp-item--${variant}` : ''}`}>
      {icon && <span className="sp-item__icon">{icon}</span>}
      <span className="sp-item__name">{name}</span>
      {meta  && <span className="sp-item__meta">{meta}</span>}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function StructurePanel({ result, onClose }) {
  if (!result) return null;

  // Cas erreur
  if (!result.ok) {
    return (
      <div className="structure-panel structure-panel--error">
        <span className="sp-error-icon">⚠</span>
        <span>{result.error}</span>
        <button className="sp-close" onClick={onClose} title="Fermer">✕</button>
      </div>
    );
  }

  const { blocks, functions, variables, combos, main, init, structure, directives } = result;
  const cmeta = COMPLEXITY_META[structure.complexity] ?? COMPLEXITY_META.simple;
  const isEmpty = blocks.length === 0 && variables.length === 0 && directives.length === 0;

  return (
    <div className="structure-panel">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="sp-header">
        <span className="sp-title">⬡ Structure</span>

        <span className="sp-complexity" style={{ color: cmeta.color }}>
          {cmeta.icon} {cmeta.label}
        </span>

        <button
          className="sp-close"
          onClick={onClose}
          title="Fermer le panneau"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {/* ── Métriques ──────────────────────────────────────────────────────── */}
      <div className="sp-metrics">
        <Metric val={structure.lineCount}      lbl="lignes"    />
        <Metric val={structure.comboCount}     lbl="combos"    />
        <Metric val={structure.functionCount}  lbl="fonctions" />
        <Metric val={structure.globalVarCount} lbl="variables" />
        {structure.directiveCount > 0 && (
          <Metric val={structure.directiveCount} lbl="directives" />
        )}
      </div>

      {/* ── Blocs principaux ──────────────────────────────────────────────── */}
      <SpSection title="Blocs principaux">
        <div className="sp-flags">
          <span className={`sp-flag ${main ? 'sp-flag--on' : 'sp-flag--off'}`}>
            {main ? '✓' : '✗'} main
          </span>
          <span className={`sp-flag ${init ? 'sp-flag--on' : 'sp-flag--off'}`}>
            {init ? '✓' : '✗'} init
          </span>
        </div>
      </SpSection>

      {/* ── Combos ────────────────────────────────────────────────────────── */}
      {combos.length > 0 && (
        <SpSection title={`Combos (${combos.length})`}>
          <div className="sp-list">
            {combos.map((c, i) => (
              <SpItem
                key={i}
                icon="▷"
                name={c.name}
                meta={`ligne ${c.startLine} · ${c.lineCount} lignes`}
                variant="combo"
              />
            ))}
          </div>
        </SpSection>
      )}

      {/* ── Fonctions ─────────────────────────────────────────────────────── */}
      {functions.length > 0 && (
        <SpSection title={`Fonctions (${functions.length})`}>
          <div className="sp-list">
            {functions.map((f, i) => (
              <SpItem
                key={i}
                icon="ƒ"
                name={f.name}
                meta={`ligne ${f.startLine} · ${f.lineCount} lignes`}
                variant="function"
              />
            ))}
          </div>
        </SpSection>
      )}

      {/* ── Variables globales ────────────────────────────────────────────── */}
      {variables.length > 0 && (
        <SpSection title={`Variables globales (${variables.length})`}>
          <div className="sp-list">
            {variables.map((v, i) => (
              <div key={i} className="sp-item sp-item--var">
                <span className="sp-item__type">{v.type}</span>
                <span className="sp-item__name">{v.name}</span>
                {v.initialValue !== null && (
                  <span className="sp-item__meta">= {v.initialValue}</span>
                )}
                <span className="sp-item__line">ligne {v.line}</span>
              </div>
            ))}
          </div>
        </SpSection>
      )}

      {/* ── Directives ───────────────────────────────────────────────────── */}
      {directives.length > 0 && (
        <SpSection title={`Directives (${directives.length})`}>
          <div className="sp-list">
            {directives.map((d, i) => (
              <div key={i} className="sp-item sp-item--directive">
                <span className="sp-item__icon">#</span>
                <span className="sp-item__name">{d.kind}</span>
                <span className="sp-item__meta">
                  {d.kind === 'define' ? `${d.name}${d.value ? ` = ${d.value}` : ''}` : d.value}
                </span>
                <span className="sp-item__line">ligne {d.line}</span>
              </div>
            ))}
          </div>
        </SpSection>
      )}

      {/* ── État vide ────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="sp-empty">
          Aucune structure reconnue dans ce script.
        </div>
      )}
    </div>
  );
}

// ── Métrique individuelle ──────────────────────────────────────────────────────

function Metric({ val, lbl }) {
  return (
    <div className="sp-metric">
      <span className="sp-metric__val">{val}</span>
      <span className="sp-metric__lbl">{lbl}</span>
    </div>
  );
}
