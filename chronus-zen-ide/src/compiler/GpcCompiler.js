/**
 * GpcCompiler — Simulateur d'analyse GPC
 *
 * Analyse le contenu d'un script Chronus Zen et retourne un résultat
 * structuré standard : { success, errors, warnings }.
 *
 * Codes :
 *   E001 — Script vide
 *   E002 — Point-virgule manquant en fin de ligne d'instruction
 *   E003 — Accolades déséquilibrées
 *   E004 — Aucun bloc combo/init trouvé (structure incohérente)
 *   W001 — TODO détecté
 *   W002 — Identifiant suspect détecté (undefined, null, NaN, error…)
 *   W003 — Bloc combo vide détecté
 *
 * Ce module ne connaît que la forme { id, name, content }.
 * Il reste indépendant du reste de l'application.
 */

/** Mots suspects dans un script GPC (probables erreurs de copié-collé) */
const SUSPECT_WORDS = ['undefined', 'null', 'nan', 'error', 'exception', 'traceback', 'console.log'];

/**
 * @typedef {object} AnalysisIssue
 * @property {number|null}        line
 * @property {string}             code
 * @property {'error'|'warning'}  severity
 * @property {string}             message
 */

/**
 * @typedef {object} AnalysisResult
 * @property {string}   scriptId
 * @property {string}   scriptName
 * @property {boolean}  success    - true si aucune erreur bloquante
 * @property {string[]} errors     - messages d'erreurs (bloquants)
 * @property {string[]} warnings   - messages d'avertissements (non bloquants)
 * @property {AnalysisIssue[]} issues  - détail complet (code, ligne, sévérité)
 */

class GpcCompiler {
  /**
   * Analyse le contenu d'un script GPC.
   * @param {{ id: string, name: string, content: string }} script
   * @returns {AnalysisResult}
   */
  analyze(script) {
    const { id, name, content } = script;
    /** @type {AnalysisIssue[]} */
    const issues = [];

    // ── E001 : Script vide ─────────────────────────────────────────────────
    if (!content || content.trim() === '') {
      issues.push({
        line:     null,
        code:     'E001',
        severity: 'error',
        message:  'Le script est vide.',
      });
      return this._buildResult(id, name, issues);
    }

    const lines = content.split('\n');
    let braceDepth   = 0;
    let hasBlock     = false;   // au moins un combo/init trouvé
    let inEmptyCombo = false;
    let emptyComboLine = null;
    let comboBodyLines = 0;

    lines.forEach((rawLine, index) => {
      const lineNum = index + 1;
      const line    = rawLine.trim();

      // Ignorer les lignes vides et les commentaires
      if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        if (inEmptyCombo) comboBodyLines++;
        return;
      }

      // ── Détection de blocs combo/init ─────────────────────────────────────
      if (/^(combo|init)\s+\w+\s*\{/.test(line)) {
        hasBlock = true;
        inEmptyCombo   = true;
        emptyComboLine = lineNum;
        comboBodyLines = 0;
      }

      // ── Fermeture de bloc ─────────────────────────────────────────────────
      if (line === '}' && inEmptyCombo) {
        // W003 : bloc combo vide (aucune instruction dedans)
        if (comboBodyLines === 0) {
          issues.push({
            line:     emptyComboLine,
            code:     'W003',
            severity: 'warning',
            message:  `Ligne ${emptyComboLine} : bloc combo/init vide détecté.`,
          });
        }
        inEmptyCombo = false;
      } else if (inEmptyCombo && line !== '{') {
        comboBodyLines++;
      }

      // ── Comptage des accolades ─────────────────────────────────────────────
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // ── E002 : Point-virgule manquant ─────────────────────────────────────
      const isBlockDelimiter = line.endsWith('{') || line === '}';
      const isPreprocessor   = line.startsWith('#');

      if (!isBlockDelimiter && !isPreprocessor && !line.endsWith(';')) {
        issues.push({
          line:     lineNum,
          code:     'E002',
          severity: 'error',
          message:  `Ligne ${lineNum} : point-virgule manquant — "${this._truncate(line)}"`,
        });
      }

      // ── W001 : TODO ────────────────────────────────────────────────────────
      if (line.toUpperCase().includes('TODO')) {
        issues.push({
          line:     lineNum,
          code:     'W001',
          severity: 'warning',
          message:  `Ligne ${lineNum} : TODO détecté — à compléter avant compilation.`,
        });
      }

      // ── W002 : Identifiants suspects ───────────────────────────────────────
      const lineLower = line.toLowerCase();
      for (const suspect of SUSPECT_WORDS) {
        if (lineLower.includes(suspect)) {
          issues.push({
            line:     lineNum,
            code:     'W002',
            severity: 'warning',
            message:  `Ligne ${lineNum} : identifiant suspect "${suspect}" — probablement une erreur de saisie.`,
          });
          break; // Un seul avertissement par ligne
        }
      }
    });

    // ── E003 : Accolades déséquilibrées ───────────────────────────────────
    if (braceDepth !== 0) {
      issues.push({
        line:     null,
        code:     'E003',
        severity: 'error',
        message:  `Accolades déséquilibrées (différence : ${braceDepth > 0 ? '+' : ''}${braceDepth}).`,
      });
    }

    // ── E004 : Aucun bloc combo/init ──────────────────────────────────────
    if (!hasBlock) {
      issues.push({
        line:     null,
        code:     'E004',
        severity: 'error',
        message:  'Structure incohérente : aucun bloc "combo" ou "init" trouvé dans le script.',
      });
    }

    return this._buildResult(id, name, issues);
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  /**
   * Construit le résultat standardisé.
   * @param {string}          scriptId
   * @param {string}          scriptName
   * @param {AnalysisIssue[]} issues
   * @returns {AnalysisResult}
   */
  _buildResult(scriptId, scriptName, issues) {
    const hasError = issues.some(i => i.severity === 'error');
    return {
      scriptId,
      scriptName,
      success:  !hasError,
      errors:   issues.filter(i => i.severity === 'error')  .map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      issues,   // détail complet (code + ligne) pour usage avancé
    };
  }

  _truncate(str, max = 50) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
}

/** Singleton partagé */
export const compiler = new GpcCompiler();
