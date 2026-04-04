/**
 * ExplanationPanel
 *
 * Affiche l'explication intelligente d'un script produite par ScriptExplainer.
 *
 * Props :
 *  - result   : ExplanationResult | null
 *  - loading  : boolean
 *  - onClose  : () => void
 */

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="ep-spinner" aria-label="Chargement en cours">
      <div className="ep-spinner__ring" />
      <span className="ep-spinner__label">Consultation de l'IA…</span>
    </div>
  );
}

// ── Bloc de section ───────────────────────────────────────────────────────────

function EpSection({ icon, title, children }) {
  return (
    <div className="ep-section">
      <div className="ep-section__header">
        <span className="ep-section__icon">{icon}</span>
        <span className="ep-section__title">{title}</span>
      </div>
      <div className="ep-section__body">{children}</div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ExplanationPanel({ result, loading, onClose }) {
  if (!result && !loading) return null;

  return (
    <div className="explanation-panel">

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <div className="ep-header">
        <span className="ep-title">⬡ Explication IA</span>
        {result?.model && (
          <span className="ep-model">{result.model}</span>
        )}
        {result?.tokensUsed > 0 && (
          <span className="ep-tokens">{result.tokensUsed} tokens</span>
        )}
        <button
          className="sp-close"
          onClick={onClose}
          title="Fermer"
          aria-label="Fermer le panneau"
        >
          ✕
        </button>
      </div>

      {/* ── Loader ─────────────────────────────────────────────────────── */}
      {loading && <Spinner />}

      {/* ── Erreur ─────────────────────────────────────────────────────── */}
      {!loading && result && !result.ok && (
        <div className="ep-error">
          <span className="ep-error__icon">✗</span>
          <span className="ep-error__msg">{result.error}</span>
          {result.error?.includes('.env') && (
            <div className="ep-error__hint">
              Créez un fichier <code>.env</code> à la racine de l'IDE avec :<br />
              <code>OPENAI_API_KEY=sk-...</code>
            </div>
          )}
        </div>
      )}

      {/* ── Contenu ────────────────────────────────────────────────────── */}
      {!loading && result?.ok && (
        <div className="ep-content">

          {/* Résumé */}
          {result.summary && (
            <div className="ep-summary">
              {result.summary}
            </div>
          )}

          {/* Type de jeu + Complexité — côte à côte */}
          <div className="ep-tags">
            {result.gameType && (
              <div className="ep-tag ep-tag--game">
                <span className="ep-tag__label">🎮 Type de jeu</span>
                <span className="ep-tag__value">{result.gameType}</span>
              </div>
            )}
            {result.complexity && (
              <div className="ep-tag ep-tag--complexity">
                <span className="ep-tag__label">⊙ Complexité</span>
                <span className="ep-tag__value">{result.complexity}</span>
              </div>
            )}
          </div>

          {/* Fonctionnalités */}
          {result.featuresExplanation && (
            <EpSection icon="⚡" title="Fonctionnalités">
              {result.featuresExplanation}
            </EpSection>
          )}

          {/* Logique */}
          {result.logicExplanation && (
            <EpSection icon="⬡" title="Logique du script">
              {result.logicExplanation}
            </EpSection>
          )}
        </div>
      )}
    </div>
  );
}
