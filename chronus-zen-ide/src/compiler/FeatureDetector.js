/**
 * FeatureDetector — Détection automatique des fonctionnalités GPC
 *
 * Module INDÉPENDANT, JS pur, sans dépendances Node.js.
 * Compatible renderer ET main process.
 *
 * Algorithme :
 *  Pour chaque feature définie dans FEATURE_RULES :
 *    - Chercher des "signaux" (mots-clés, patterns regex) dans :
 *        · les noms de combos/fonctions/variables (parsedData)
 *        · le contenu brut du script
 *    - Sommer les poids des signaux déclenchés → score brut
 *    - Normaliser sur maxScore → confidence 0–100
 *  Une feature est "détectée" si confidence >= DETECTION_THRESHOLD.
 *
 * Retourne :
 * {
 *   features : DetectedFeature[],   — seulement celles détectées
 *   details  : FeatureDetail[],     — toutes les features (pour debug)
 *   summary  : FeatureSummary,
 * }
 *
 * DetectedFeature : { id, name, icon, confidence, level, signals }
 * FeatureSummary  : { total, high, medium, low, complexity, comboCount, functionCount }
 */

// ── Constantes ────────────────────────────────────────────────────────────────

const DETECTION_THRESHOLD = 20; // score minimum pour être "détecté" (0-100)

// ── Règles de détection (exhaustives et commentées) ──────────────────────────
//
// Chaque règle possède :
//   id             — identifiant unique
//   name           — label affiché
//   icon           — caractère ASCII/Unicode
//   signals[]      — liste de signaux, chacun a : type + données + weight
//   maxScore       — somme de TOUS les weights (pour normalisation 0-100)
//
// Types de signaux :
//   'name_keyword'   — mot dans un nom de combo/fonction/variable
//   'content_string' — chaîne (case-insensitive) dans le contenu brut
//   'content_regex'  — regex (flags 'gi') dans le contenu brut
//   'var_keyword'    — mot dans un nom de variable globale

const FEATURE_RULES = [
  // ── Aim Assist ───────────────────────────────────────────────────────────
  {
    id:   'aim_assist',
    name: 'Aim Assist',
    icon: '◎',
    signals: [
      { type: 'name_keyword',   value: 'aim',        weight: 30 },
      { type: 'name_keyword',   value: 'aimassist',  weight: 40 },
      { type: 'name_keyword',   value: 'aim_assist', weight: 40 },
      { type: 'name_keyword',   value: 'aiming',     weight: 25 },
      { type: 'var_keyword',    value: 'aim',        weight: 20 },
      { type: 'var_keyword',    value: 'sensitivity', weight: 10 },
      { type: 'content_string', value: 'aim',        weight: 8  },
      { type: 'content_regex',  value: /BUTTON_L2/,  weight: 12 },
      { type: 'content_regex',  value: /get_val\s*\(\s*(?:Analog_(?:RX|RY)|STICK_1)/, weight: 20 },
      { type: 'content_regex',  value: /sensitivity|sens\b/i, weight: 10 },
    ],
    maxScore: 215,
  },

  // ── Anti Recoil ──────────────────────────────────────────────────────────
  {
    id:   'anti_recoil',
    name: 'Anti Recoil',
    icon: '↕',
    signals: [
      { type: 'name_keyword',   value: 'recoil',      weight: 40 },
      { type: 'name_keyword',   value: 'antirecoil',  weight: 50 },
      { type: 'name_keyword',   value: 'anti_recoil', weight: 50 },
      { type: 'name_keyword',   value: 'norecoil',    weight: 45 },
      { type: 'var_keyword',    value: 'recoil',      weight: 30 },
      { type: 'var_keyword',    value: 'strength',    weight: 8  },
      { type: 'content_string', value: 'recoil',      weight: 25 },
      { type: 'content_regex',  value: /set_val\s*\(\s*(?:Analog_RY|Analog_RX|STICK_1_Y|STICK_1_X)/, weight: 30 },
      { type: 'content_regex',  value: /recoil/i,     weight: 25 },
    ],
    maxScore: 303,
  },

  // ── Rapid Fire ───────────────────────────────────────────────────────────
  {
    id:   'rapid_fire',
    name: 'Rapid Fire',
    icon: '⚡',
    signals: [
      { type: 'name_keyword',   value: 'rapid',      weight: 40 },
      { type: 'name_keyword',   value: 'rapidfire',  weight: 50 },
      { type: 'name_keyword',   value: 'rapid_fire', weight: 50 },
      { type: 'name_keyword',   value: 'autofire',   weight: 35 },
      { type: 'var_keyword',    value: 'rapid',      weight: 25 },
      { type: 'var_keyword',    value: 'firerate',   weight: 25 },
      { type: 'var_keyword',    value: 'delay',      weight: 10 },
      { type: 'content_string', value: 'rapid',      weight: 20 },
      { type: 'content_regex',  value: /combo_run\s*\([^)]*\)/,  weight: 15 },
      { type: 'content_regex',  value: /set_val\s*\(\s*BUTTON_R2[\s,]/, weight: 15 },
      { type: 'content_regex',  value: /wait\s*\(\s*\d+\s*\)/,   weight: 10 },
    ],
    maxScore: 295,
  },

  // ── Weapon Detection ─────────────────────────────────────────────────────
  {
    id:   'weapon_detection',
    name: 'Weapon Detection',
    icon: '⊕',
    signals: [
      { type: 'name_keyword',   value: 'weapon',     weight: 40 },
      { type: 'name_keyword',   value: 'detect',     weight: 20 },
      { type: 'name_keyword',   value: 'gun',        weight: 30 },
      { type: 'name_keyword',   value: 'rifle',      weight: 30 },
      { type: 'name_keyword',   value: 'pistol',     weight: 30 },
      { type: 'name_keyword',   value: 'smg',        weight: 30 },
      { type: 'name_keyword',   value: 'sniper',     weight: 20 },
      { type: 'var_keyword',    value: 'weapon',     weight: 25 },
      { type: 'var_keyword',    value: 'gun',        weight: 20 },
      { type: 'content_string', value: 'weapon',     weight: 15 },
      { type: 'content_regex',  value: /BUTTON_DPAD_(?:UP|DOWN|LEFT|RIGHT)/g, weight: 12 },
      { type: 'content_regex',  value: /weapon|gun|rifle|pistol|smg/i,        weight: 18 },
    ],
    maxScore: 290,
  },

  // ── Auto Fire ────────────────────────────────────────────────────────────
  {
    id:   'auto_fire',
    name: 'Auto Fire',
    icon: '▶',
    signals: [
      { type: 'name_keyword',   value: 'auto',       weight: 20 },
      { type: 'name_keyword',   value: 'autofire',   weight: 50 },
      { type: 'name_keyword',   value: 'auto_fire',  weight: 50 },
      { type: 'name_keyword',   value: 'automatic',  weight: 25 },
      { type: 'name_keyword',   value: 'fullAuto',   weight: 40 },
      { type: 'var_keyword',    value: 'auto',       weight: 15 },
      { type: 'content_string', value: 'auto_fire',  weight: 20 },
      { type: 'content_string', value: 'autofire',   weight: 20 },
      { type: 'content_regex',  value: /set_val\s*\(\s*BUTTON_R2[\s,].*\)\s*;/g, weight: 20 },
      { type: 'content_regex',  value: /get_val\s*\(\s*BUTTON_R2\s*\)/,           weight: 12 },
    ],
    maxScore: 272,
  },

  // ── Menu System ──────────────────────────────────────────────────────────
  {
    id:   'menu_system',
    name: 'Menu System',
    icon: '☰',
    signals: [
      { type: 'name_keyword',   value: 'menu',       weight: 45 },
      { type: 'name_keyword',   value: 'settings',   weight: 20 },
      { type: 'name_keyword',   value: 'config',     weight: 15 },
      { type: 'name_keyword',   value: 'option',     weight: 15 },
      { type: 'var_keyword',    value: 'menu',       weight: 30 },
      { type: 'var_keyword',    value: 'counter',    weight: 15 },
      { type: 'var_keyword',    value: 'page',       weight: 10 },
      { type: 'content_string', value: 'menu',       weight: 20 },
      { type: 'content_regex',  value: /BUTTON_DPAD_UP.*BUTTON_DPAD_DOWN|BUTTON_DPAD_DOWN.*BUTTON_DPAD_UP/s, weight: 25 },
      { type: 'content_regex',  value: /LED_(?:A|B|X|Y|1|2|3|4)/,   weight: 15 },
      { type: 'content_regex',  value: /set_led\s*\(/,                weight: 12 },
    ],
    maxScore: 222,
  },

  // ── Sniper Mode ──────────────────────────────────────────────────────────
  {
    id:   'sniper_mode',
    name: 'Sniper Mode',
    icon: '◈',
    signals: [
      { type: 'name_keyword',   value: 'sniper',     weight: 50 },
      { type: 'name_keyword',   value: 'scope',      weight: 30 },
      { type: 'name_keyword',   value: 'zoom',       weight: 20 },
      { type: 'name_keyword',   value: 'ads',        weight: 15 },
      { type: 'var_keyword',    value: 'sniper',     weight: 35 },
      { type: 'var_keyword',    value: 'scope',      weight: 20 },
      { type: 'content_string', value: 'sniper',     weight: 30 },
      { type: 'content_regex',  value: /sniper|scope|zoom/i,         weight: 20 },
      { type: 'content_regex',  value: /BUTTON_L1/,                  weight: 10 },
      { type: 'content_regex',  value: /breath|hold.*breath|breath.*hold/i, weight: 20 },
    ],
    maxScore: 250,
  },

  // ── Trigger Bot ──────────────────────────────────────────────────────────
  {
    id:   'trigger_bot',
    name: 'Trigger Bot',
    icon: '⊛',
    signals: [
      { type: 'name_keyword',   value: 'trigger',     weight: 40 },
      { type: 'name_keyword',   value: 'triggerbot',  weight: 55 },
      { type: 'name_keyword',   value: 'trigger_bot', weight: 55 },
      { type: 'name_keyword',   value: 'autoshot',    weight: 40 },
      { type: 'var_keyword',    value: 'trigger',     weight: 25 },
      { type: 'content_string', value: 'triggerbot',  weight: 30 },
      { type: 'content_string', value: 'trigger_bot', weight: 30 },
      { type: 'content_regex',  value: /trigger(?:bot|_?bot)/i,      weight: 35 },
      { type: 'content_regex',  value: /get_val\s*\(\s*BUTTON_R2\s*\)\s*[<>]=?\s*\d+/, weight: 20 },
    ],
    maxScore: 330,
  },
];

// ── Niveaux de confiance ──────────────────────────────────────────────────────

function confidenceLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ── Classe principale ─────────────────────────────────────────────────────────

class FeatureDetector {
  /**
   * Détecte les fonctionnalités d'un script GPC.
   *
   * @param {string}     scriptContent  — contenu brut du script
   * @param {ParseResult|null} parsedData — résultat de ScriptParser (peut être null)
   * @returns {DetectionResult}
   */
  detectFeatures(scriptContent, parsedData = null) {
    const content = scriptContent ?? '';

    // Préparer les listes de noms (combos, fonctions, variables)
    const comboNames    = (parsedData?.combos    ?? []).map(c => c.name.toLowerCase());
    const functionNames = (parsedData?.functions ?? []).map(f => f.name.toLowerCase());
    const varNames      = (parsedData?.variables ?? []).map(v => v.name.toLowerCase());
    const allNames      = [...comboNames, ...functionNames];

    const contentLower = content.toLowerCase();
    const contentNorm  = content; // garder le contenu original pour regex case-sensitive

    // ── Évaluer chaque règle ───────────────────────────────────────────────
    const details = FEATURE_RULES.map(rule => {
      let rawScore   = 0;
      const triggered = []; // signaux déclenchés (pour debug/UI)

      for (const signal of rule.signals) {
        let hit = false;

        switch (signal.type) {
          case 'name_keyword': {
            const kw = signal.value.toLowerCase();
            hit = allNames.some(n => n.includes(kw));
            break;
          }
          case 'var_keyword': {
            const kw = signal.value.toLowerCase();
            hit = varNames.some(n => n.includes(kw));
            break;
          }
          case 'content_string': {
            hit = contentLower.includes(signal.value.toLowerCase());
            break;
          }
          case 'content_regex': {
            // Accepte RegExp ou string
            const re = signal.value instanceof RegExp
              ? new RegExp(signal.value.source, signal.value.flags.includes('i') ? 'gi' : 'g')
              : new RegExp(signal.value, 'gi');
            hit = re.test(contentNorm);
            break;
          }
        }

        if (hit) {
          rawScore += signal.weight;
          triggered.push({ type: signal.type, value: String(signal.value), weight: signal.weight });
        }
      }

      // Normaliser en 0-100 (plafonner à 100)
      const confidence = Math.min(100, Math.round((rawScore / rule.maxScore) * 100));
      const detected   = confidence >= DETECTION_THRESHOLD;

      return {
        id:         rule.id,
        name:       rule.name,
        icon:       rule.icon,
        confidence,
        level:      confidenceLevel(confidence),
        detected,
        signals:    triggered,
      };
    });

    // ── Features détectées uniquement ────────────────────────────────────
    const features = details
      .filter(d => d.detected)
      .sort((a, b) => b.confidence - a.confidence);

    // ── Résumé global ─────────────────────────────────────────────────────
    const summary = this._buildSummary(features, parsedData);

    return { features, details, summary };
  }

  _buildSummary(features, parsedData) {
    const high   = features.filter(f => f.level === 'high').length;
    const medium = features.filter(f => f.level === 'medium').length;
    const low    = features.filter(f => f.level === 'low').length;

    return {
      total:         features.length,
      high,
      medium,
      low,
      comboCount:    parsedData?.combos?.length    ?? 0,
      functionCount: parsedData?.functions?.length ?? 0,
      complexity:    parsedData?.structure?.complexity ?? 'simple',
    };
  }
}

// ── Singleton exporté ─────────────────────────────────────────────────────────
export const featureDetector = new FeatureDetector();
