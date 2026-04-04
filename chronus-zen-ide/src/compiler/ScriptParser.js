/**
 * ScriptParser — Analyse structurelle d'un script GPC
 *
 * Module INDÉPENDANT du GpcCompiler : il ne valide pas, il comprend.
 * Aucune dépendance Node.js — JS pur, utilisable dans le renderer ou le main.
 *
 * Algorithme (3 passes) :
 *   1. Annotation  — strip commentaires // et /* *\/, tag chaque ligne
 *   2. Scan blocs  — profondeur d'accolades pour extraire main/init/combo/function
 *   3. Globaux     — variables + directives avant le premier bloc
 *
 * Retourne :
 * {
 *   ok        : boolean,
 *   error     : string|null,
 *   blocks    : Block[],
 *   functions : Block[],
 *   variables : Variable[],
 *   combos    : Block[],
 *   directives: Directive[],
 *   main      : Block|null,
 *   init      : Block|null,
 *   structure : StructureSummary,
 * }
 *
 * Block    : { type, name, startLine, endLine, lineCount, content, raw }
 * Variable : { type, name, initialValue, line }
 * Directive: { kind:'pragma'|'define', value, name?, line }
 * StructureSummary : { hasMain, hasInit, comboCount, functionCount,
 *                      globalVarCount, directiveCount, lineCount, complexity }
 */

// ── Patterns de blocs ─────────────────────────────────────────────────────────

const BLOCK_PATTERNS = [
  {
    type:  'main',
    regex: /^main\s*\{/,
    named: false,
  },
  {
    type:  'init',
    regex: /^init\s*\{/,
    named: false,
  },
  {
    type:  'combo',
    regex: /^combo\s+(\w+)\s*\{/,
    named: true,
    group: 1,
  },
  {
    // Fonctions typées GPC : void|int|bool|fix1-3|uint8|int8|uint16|int16|uint32|int32
    type:  'function',
    regex: /^(?:void|int|bool|fix[123]|u?int(?:8|16|32))\s+(\w+)\s*\([^)]*\)\s*\{/,
    named: true,
    group: 1,
  },
];

// ── Patterns de déclarations globales ─────────────────────────────────────────

/**
 * Capture : type  nom  [= valeur]  ;
 * Exemples : int rapidSpeed = 17;   bool active;
 */
const VAR_PATTERN =
  /^(int|bool|fix[123]|u?int(?:8|16|32))\s+(\w+)(?:\s*=\s*([^;]+))?\s*;/;

const PRAGMA_PATTERN = /^#pragma\s+(.+)/;
const DEFINE_PATTERN = /^#define\s+(\w+)(?:\s+(.+))?/;

// ── Classe principale ─────────────────────────────────────────────────────────

class ScriptParser {
  /**
   * Analyse la structure d'un script GPC.
   * @param {string} content
   * @returns {ParseResult}
   */
  parse(content) {
    if (!content || content.trim() === '') {
      return this._empty('Script vide.');
    }

    // ── Passe 1 : annotation des lignes ──────────────────────────────────────
    const rawLines = content.split('\n');
    const lines    = this._annotateLines(rawLines);

    // ── Passe 2 : scan des blocs ──────────────────────────────────────────────
    const { blocks, firstBlockIdx } = this._scanBlocks(lines);

    // ── Passe 3 : globaux (variables + directives) ───────────────────────────
    const variables  = this._scanGlobalVars(lines, firstBlockIdx);
    const directives = this._scanDirectives(lines, firstBlockIdx);

    // ── Classification ────────────────────────────────────────────────────────
    const combos    = blocks.filter(b => b.type === 'combo');
    const functions = blocks.filter(b => b.type === 'function');
    const main      = blocks.find(b => b.type === 'main')  ?? null;
    const init      = blocks.find(b => b.type === 'init')  ?? null;

    // ── Résumé structurel ─────────────────────────────────────────────────────
    const structure = this._buildStructure(
      blocks, variables, directives, rawLines.length,
    );

    return {
      ok:         true,
      error:      null,
      blocks,
      functions,
      variables,
      combos,
      directives,
      main,
      init,
      structure,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Passe 1 — Annotation des lignes
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Retourne un tableau de { num, raw, clean, isComment, isEmpty }.
   * `clean` = ligne sans commentaires, trimée.
   */
  _annotateLines(rawLines) {
    const annotated     = [];
    let   inBlockComment = false;

    for (let i = 0; i < rawLines.length; i++) {
      const raw   = rawLines[i];
      let   clean = '';
      let   inLineComment = false;
      let   j     = 0;

      while (j < raw.length) {
        if (inBlockComment) {
          // On cherche la fermeture */
          if (raw[j] === '*' && raw[j + 1] === '/') {
            inBlockComment = false;
            j += 2;
          } else {
            j++;
          }
        } else if (inLineComment) {
          // Commentaire de fin de ligne — on ignore jusqu'\u00e0 EOL
          j++;
        } else {
          if (raw[j] === '/' && raw[j + 1] === '/') {
            inLineComment = true;
            j += 2;
          } else if (raw[j] === '/' && raw[j + 1] === '*') {
            inBlockComment = true;
            j += 2;
          } else {
            clean += raw[j];
            j++;
          }
        }
      }

      clean = clean.trim();

      annotated.push({
        num:       i + 1,          // 1-based
        raw,
        clean,
        isComment: clean === '' && raw.trim() !== '' && raw.trim() !== '',
        isEmpty:   raw.trim() === '',
      });
    }

    return annotated;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Passe 2 — Scan des blocs
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Parcourt les lignes et extrait les blocs de niveau 0.
   * Utilise un compteur de profondeur d'accolades.
   */
  _scanBlocks(lines) {
    const blocks      = [];
    let   firstBlockIdx = Infinity; // indice (0-based) de la première ligne de bloc
    let   i           = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Ignorer lignes vides, commentaires, directives
      if (line.isEmpty || line.clean === '' || line.clean.startsWith('#')) {
        i++;
        continue;
      }

      // Tenter de faire correspondre un en-tête de bloc
      const match = this._matchBlockHeader(line.clean);
      if (!match) {
        i++;
        continue;
      }

      if (i < firstBlockIdx) firstBlockIdx = i;

      // ── Extraction du corps du bloc par comptage d'accolades ────────────────
      const startIdx = i;
      let   depth    = 0;
      let   j        = i;

      while (j < lines.length) {
        // Compter sur la version `clean` pour éviter les { dans les commentaires
        for (const ch of lines[j].clean) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }

        if (depth === 0) break; // bloc fermé
        j++;
      }

      // Si EOF avant fermeture → accolades non équilibrées, on saute quand même
      if (depth !== 0) { i++; continue; }

      const endIdx   = Math.min(j, lines.length - 1);
      const startLine = lines[startIdx].num;
      const endLine   = lines[endIdx].num;

      // Corps = lignes entre l'en-tête et la fermeture (exclusifs)
      const bodyRaw = lines
        .slice(startIdx + 1, endIdx)
        .map(l => l.raw)
        .join('\n')
        .trimEnd();

      blocks.push({
        type:      match.type,
        name:      match.name,
        startLine,
        endLine,
        lineCount: endLine - startLine + 1,
        content:   bodyRaw.trim(),
        raw:       lines.slice(startIdx, endIdx + 1).map(l => l.raw).join('\n'),
      });

      i = endIdx + 1;
    }

    return {
      blocks,
      firstBlockIdx: firstBlockIdx === Infinity ? lines.length : firstBlockIdx,
    };
  }

  /** Teste si la ligne clean correspond à un en-tête de bloc connu. */
  _matchBlockHeader(clean) {
    for (const pattern of BLOCK_PATTERNS) {
      const m = clean.match(pattern.regex);
      if (m) {
        return {
          type: pattern.type,
          name: pattern.named ? m[pattern.group] : pattern.type,
        };
      }
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Passe 3 — Variables globales et directives
  // ════════════════════════════════════════════════════════════════════════════

  _scanGlobalVars(lines, firstBlockIdx) {
    const vars = [];

    for (let i = 0; i < firstBlockIdx && i < lines.length; i++) {
      const line = lines[i];
      if (line.isEmpty || line.clean === '' || line.clean.startsWith('#')) continue;

      const m = line.clean.match(VAR_PATTERN);
      if (m) {
        vars.push({
          type:         m[1],
          name:         m[2],
          initialValue: m[3] ? m[3].trim() : null,
          line:         line.num,
        });
      }
    }

    return vars;
  }

  _scanDirectives(lines, firstBlockIdx) {
    const directives = [];

    for (let i = 0; i < firstBlockIdx && i < lines.length; i++) {
      const line = lines[i];
      if (line.isEmpty || line.clean === '') continue;

      const pragma = line.clean.match(PRAGMA_PATTERN);
      if (pragma) {
        directives.push({ kind: 'pragma', value: pragma[1].trim(), line: line.num });
        continue;
      }

      const define = line.clean.match(DEFINE_PATTERN);
      if (define) {
        directives.push({
          kind:  'define',
          name:  define[1],
          value: define[2] ? define[2].trim() : null,
          line:  line.num,
        });
      }
    }

    return directives;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Résumé structurel
  // ════════════════════════════════════════════════════════════════════════════

  _buildStructure(blocks, variables, directives, lineCount) {
    const comboCount    = blocks.filter(b => b.type === 'combo').length;
    const functionCount = blocks.filter(b => b.type === 'function').length;
    const hasMain       = blocks.some(b => b.type === 'main');
    const hasInit       = blocks.some(b => b.type === 'init');

    let complexity = 'simple';
    if (comboCount > 5 || functionCount > 3 || lineCount > 80) {
      complexity = 'complex';
    } else if (comboCount > 2 || functionCount > 0 || lineCount > 30) {
      complexity = 'moderate';
    }

    return {
      hasMain,
      hasInit,
      comboCount,
      functionCount,
      globalVarCount: variables.length,
      directiveCount: directives.length,
      lineCount,
      complexity,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Résultat vide / erreur
  // ════════════════════════════════════════════════════════════════════════════

  _empty(error) {
    return {
      ok:         false,
      error,
      blocks:     [],
      functions:  [],
      variables:  [],
      combos:     [],
      directives: [],
      main:       null,
      init:       null,
      structure: {
        hasMain:        false,
        hasInit:        false,
        comboCount:     0,
        functionCount:  0,
        globalVarCount: 0,
        directiveCount: 0,
        lineCount:      0,
        complexity:     'simple',
      },
    };
  }
}

// ── Singleton exporté ─────────────────────────────────────────────────────────
export const scriptParser = new ScriptParser();
