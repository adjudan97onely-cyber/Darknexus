/**
 * AnalysisPanel
 *
 * Affiche le résultat de l'analyse GPC d'un script.
 * Mis à jour automatiquement après :
 *  - assignation d'un script à un slot
 *  - sauvegarde du script
 *
 * Props :
 *  - analysis : AnalysisResult | null
 *    {
 *      scriptName: string,
 *      success:    boolean,
 *      errors:     string[],
 *      warnings:   string[]
 *    }
 */
export default function AnalysisPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="analysis-panel analysis-empty">
        <span>⬡</span>
        <span>Assignez un script à un slot pour voir l'analyse.</span>
      </div>
    );
  }

  const noIssues = analysis.errors.length === 0 && analysis.warnings.length === 0;

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        Analyse GPC — {analysis.scriptName}
        <span className={`analysis-badge ${analysis.success ? 'success' : 'failure'}`}>
          {analysis.success ? '✓ SUCCÈS' : '✗ ÉCHEC'}
        </span>
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
