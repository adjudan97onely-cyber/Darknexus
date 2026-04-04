/**
 * ScriptExplainer — Explication intelligente d'un script GPC via IA
 *
 * Module Node.js (main process uniquement — nécessite fetch HTTP).
 * Utilise l'API OpenAI (gpt-4o-mini par défaut) ou tout endpoint
 * compatible OpenAI (Groq, Together, OpenRouter…).
 *
 * Configuration (variables d'environnement) :
 *   OPENAI_API_KEY   — clé API (obligatoire)
 *   OPENAI_BASE_URL  — endpoint alternatif (optionnel, défaut : api.openai.com)
 *   OPENAI_MODEL     — modèle à utiliser (optionnel, défaut : gpt-4o-mini)
 *
 * Retourne :
 * {
 *   ok                  : boolean
 *   error               : string | null
 *   summary             : string
 *   featuresExplanation : string
 *   logicExplanation    : string
 *   complexity          : string
 *   gameType            : string
 *   model               : string   — modèle utilisé
 *   tokensUsed          : number   — usage total
 * }
 */

// ── Configuration ─────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL    = 'gpt-4o-mini';
const REQUEST_TIMEOUT  = 30_000; // 30 secondes

// ── Construction du prompt système ────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en scripts GPC (Chronus Zen) pour manettes de jeu vidéo.
Les scripts GPC permettent d'automatiser des actions sur une manette via la syntaxe C-like.
Tu analyses des scripts et tu expliques leur fonctionnement de façon claire et précise.

Réponds UNIQUEMENT en JSON valide avec exactement cette structure :
{
  "summary": "Résumé court en 1-2 phrases de ce que fait le script",
  "featuresExplanation": "Explication des fonctionnalités détectées et comment elles sont implémentées",
  "logicExplanation": "Explication de la logique globale : flux d'exécution, conditions, timing",
  "complexity": "Simple | Modéré | Avancé | Expert — avec justification en 1 phrase",
  "gameType": "Type de jeu visé (FPS, Battle Royale, Sport, Racing, etc.) avec explication"
}

Ne génère AUCUN texte en dehors du JSON. Sois précis, concis, et utilise un langage accessible.`;

// ── Classe principale ─────────────────────────────────────────────────────────

class ScriptExplainer {
  /**
   * Explique un script GPC via IA.
   *
   * @param {object} params
   * @param {string}           params.content      — contenu brut du script
   * @param {ParseResult|null} params.structure    — résultat ScriptParser
   * @param {DetectionResult|null} params.features — résultat FeatureDetector
   * @returns {Promise<ExplanationResult>}
   */
  async explainScript({ content, structure = null, features = null }) {
    const apiKey  = process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    const model   = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

    // ── Validation de la clé API ──────────────────────────────────────────
    if (!apiKey || apiKey.trim() === '') {
      return this._error(
        'Clé API manquante. Ajoutez OPENAI_API_KEY dans le fichier .env de l\'IDE.',
      );
    }

    if (!content || content.trim() === '') {
      return this._error('Le script est vide.');
    }

    // ── Construction du prompt utilisateur ────────────────────────────────
    const userPrompt = this._buildUserPrompt(content, structure, features);

    // ── Appel API ─────────────────────────────────────────────────────────
    let rawResponse;
    try {
      rawResponse = await this._callApi({ apiKey, baseUrl, model, userPrompt });
    } catch (err) {
      return this._error(`Erreur réseau : ${err.message}`);
    }

    // ── Parsing de la réponse JSON ────────────────────────────────────────
    return this._parseResponse(rawResponse, model);
  }

  // ── Construction du prompt ─────────────────────────────────────────────────

  _buildUserPrompt(content, structure, features) {
    const lines = [];

    // Script source
    lines.push('## SCRIPT GPC À ANALYSER\n```gpc');
    lines.push(content.slice(0, 4000)); // limite raisonnable
    if (content.length > 4000) lines.push('... [tronqué]');
    lines.push('```');

    // Données du parser (structure)
    if (structure?.ok) {
      const s = structure.structure;
      lines.push('\n## STRUCTURE DÉTECTÉE (ScriptParser)');
      lines.push(`- Blocs main   : ${s.hasMain  ? 'OUI' : 'NON'}`);
      lines.push(`- Blocs init   : ${s.hasInit  ? 'OUI' : 'NON'}`);
      lines.push(`- Combos       : ${s.comboCount} (${(structure.combos ?? []).map(c => c.name).join(', ')})`);
      lines.push(`- Fonctions    : ${s.functionCount} (${(structure.functions ?? []).map(f => f.name).join(', ')})`);
      lines.push(`- Variables    : ${s.globalVarCount}`);
      lines.push(`- Lignes       : ${s.lineCount}`);
      lines.push(`- Complexité   : ${s.complexity}`);
    }

    // Features détectées
    if (features?.features?.length > 0) {
      lines.push('\n## FONCTIONNALITÉS DÉTECTÉES (FeatureDetector)');
      for (const f of features.features) {
        lines.push(`- ${f.name} (confiance ${f.confidence}%, niveau ${f.level})`);
      }
    }

    lines.push('\nAnalyse ce script et réponds en JSON selon le format demandé.');

    return lines.join('\n');
  }

  // ── Appel HTTP vers API OpenAI-compatible ──────────────────────────────────

  async _callApi({ apiKey, baseUrl, model, userPrompt }) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
          ],
          temperature:     0.3,  // plus déterministe pour l'analyse
          max_tokens:      1200,
          response_format: { type: 'json_object' }, // force JSON (OpenAI >= gpt-4o)
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body?.error?.message ?? '';
      } catch { /* ignore */ }
      throw new Error(`API ${response.status} – ${detail || response.statusText}`);
    }

    return response.json();
  }

  // ── Parsing de la réponse ──────────────────────────────────────────────────

  _parseResponse(raw, model) {
    let text = '';
    try {
      text = raw.choices?.[0]?.message?.content ?? '';
    } catch {
      return this._error('Réponse API inattendue.');
    }

    if (!text.trim()) {
      return this._error('L\'IA n\'a retourné aucun contenu.');
    }

    let parsed;
    try {
      // Extraire uniquement le JSON si l'IA a ajouté du texte autour
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found');
      parsed = JSON.parse(match[0]);
    } catch {
      return this._error(`Impossible de parser la réponse JSON : ${text.slice(0, 120)}`);
    }

    const tokensUsed = (raw.usage?.total_tokens) ?? 0;

    return {
      ok:                  true,
      error:               null,
      summary:             String(parsed.summary             ?? '').trim(),
      featuresExplanation: String(parsed.featuresExplanation ?? '').trim(),
      logicExplanation:    String(parsed.logicExplanation    ?? '').trim(),
      complexity:          String(parsed.complexity          ?? '').trim(),
      gameType:            String(parsed.gameType            ?? '').trim(),
      model,
      tokensUsed,
    };
  }

  // ── Résultat d'erreur ──────────────────────────────────────────────────────

  _error(error) {
    return {
      ok:                  false,
      error,
      summary:             '',
      featuresExplanation: '',
      logicExplanation:    '',
      complexity:          '',
      gameType:            '',
      model:               '',
      tokensUsed:          0,
    };
  }
}

// ── Singleton exporté ─────────────────────────────────────────────────────────
export const scriptExplainer = new ScriptExplainer();
