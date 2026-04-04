/**
 * AnalysisPanel
 *
 * Props :
 *  - analysis : AnalysisResult | null
 *  - onFix    : () => void  — appelé quand l'utilisateur clique "Corriger"
 */
export default function AnalysisPanel({ analysis, onFix }) {
  if (!analysis) {
    return (
      <div className="analysis-panel analysis-empty">
        <span>⬡</span>
        <span>Assignez un script à un slot pour voir l'analyse.</span>
      </div>
    );
  }

  const noIssues   = analysis.errors.length === 0 && analysis.warnings.length === 0;
  // Seuls les E002 sont auto-corrigeables
  const hasFixable = analysis.issues?.some(i => i.code === 'E002');

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        Analyse GPC — {analysis.scriptName}
        <span className={`analysis-badge ${analysis.success ? 'success' : 'failure'}`}>
          {analysis.success ? '✓ SUCCÈS' : '✗ ÉCHEC'}
        </span>
        {hasFixable && onFix && (
          <button className="btn-fix" onClick={onFix} title="Corriger automatiquement les point-virgules manquants">
            🔧 Corriger
          </button>
        )}
      </div>

      {noIssues && (
        <div className="analysis-ok">✓ Aucun problème détecté.</div>
      )}

      {analysis.errors.map((msg, i) => (
        <div key={`e-${i}`} className="analysis-issue error">
          <span className="issue-icon">✗</span>
          <span>{msg}</span>
        </div>
      ))}

      {analysis.warnings.map((msg, i) => (
        <div key={`w-${i}`} className="analysis-issue warning">
          <span className="issue-icon">⚠</span>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}
