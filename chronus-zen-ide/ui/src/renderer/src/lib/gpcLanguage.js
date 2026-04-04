/**
 * gpcLanguage.js — Définition du langage GPC pour CodeMirror 6
 *
 * Utilise StreamLanguage : tokenizer ligne par ligne, pas de parser Lezer complet.
 * C'est l'approche idéale pour un langage personnalisé sans grammaire formelle publiée.
 *
 * Tokens retournés → mappés par HighlightStyle vers des classes CSS.
 */

import { StreamLanguage, HighlightStyle } from '@codemirror/language';
import { tags }                           from '@lezer/highlight';

// ── Vocabulaire GPC ───────────────────────────────────────────────────────────

const KEYWORDS = new Set([
  'combo', 'main', 'init',
  'if', 'else', 'while', 'for', 'do',
  'return', 'break', 'continue',
  'define', 'include', 'pragma',
  'data', 'section', 'const',
]);

const TYPES = new Set([
  'int', 'bool', 'float', 'uint8', 'int8', 'uint16', 'int16',
  'fix1', 'fix2', 'fix3', 'uint32', 'int32',
]);

const BUILTINS = new Set([
  // I/O valeurs
  'set_val', 'get_val', 'get_actual',
  // Combos
  'combo_run', 'combo_stop', 'is_active', 'event_active',
  // Temps
  'wait', 'get_ptime', 'get_rtime', 'get_val',
  // Maths
  'abs', 'pow', 'clamp', 'sqrt',
  // Contrôleur
  'get_controller', 'get_battery', 'get_console',
  // LED / rumble
  'set_led', 'reset_leds', 'block_rumble', 'ffb_set', 'ffb_get',
  // Variables accumulateurs
  'get_lval',
]);

// Constantes PSN / XB / boutons — préfixes reconnus
const CONSTANT_RE = /^(PS4_|PS5_|XB1_|XB_|BUTTON_|Analog_|LED_|TRACE_|PIO_|ADC_|UART_)/;
const BOOL_CONST  = new Set(['TRUE', 'FALSE', 'true', 'false']);

// ── Tokenizer en streaming ────────────────────────────────────────────────────

const gpcMode = {
  startState() {
    return { inBlockComment: false };
  },

  token(stream, state) {
    // ── Commentaires bloc /* … */ ──────────────────────────────────────────
    if (state.inBlockComment) {
      if (stream.match('*/')) {
        state.inBlockComment = false;
      } else {
        stream.next();
      }
      return 'comment';
    }

    // Espaces blancs — pas de token
    if (stream.eatSpace()) return null;

    // ── Commentaire ligne //  ───────────────────────────────────────────────
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // ── Début commentaire bloc /* ───────────────────────────────────────────
    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }

    // ── Chaîne de caractères " … " ─────────────────────────────────────────
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';

    // ── Nombre décimal, hexa ───────────────────────────────────────────────
    if (stream.match(/^0x[0-9a-fA-F]+/)) return 'number';
    if (stream.match(/^\d+(\.\d+)?/))    return 'number';

    // ── Identifiant / mot-clé / fonction ───────────────────────────────────
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const word = stream.current();

      if (KEYWORDS.has(word))   return 'keyword';
      if (TYPES.has(word))      return 'typeName';
      if (BUILTINS.has(word))   return 'variableName.special'; // sera stylé comme builtin
      if (BOOL_CONST.has(word)) return 'atom';
      if (CONSTANT_RE.test(word)) return 'atom';

      return null; // identifiant ordinaire (variable, nom combo, etc.)
    }

    // ── Opérateurs & ponctuation ────────────────────────────────────────────
    if (stream.match(/^[+\-*/%=<>!&|^~?:]+/)) return 'operator';
    if (stream.match(/^[(){}\[\];,]/))          return 'punctuation';

    stream.next();
    return null;
  },

  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"'] },
  },
};

/** Extension CodeMirror — langage GPC */
export const gpcLanguage = StreamLanguage.define(gpcMode);

// ── Thème de coloration ───────────────────────────────────────────────────────
// Surcharge le thème oneDark pour les tokens GPC spécifiques

export const gpcHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword,              color: '#c792ea', fontWeight: 'bold' },  // violet — combo, main, if
  { tag: tags.typeName,             color: '#82aaff' },                       // bleu clair — int, bool
  { tag: tags.variableName,         color: '#eeffff' },                       // blanc — variables
  { tag: [tags.special(tags.variableName)], color: '#89ddff', fontStyle: 'italic' }, // builtin — set_val, get_val
  { tag: tags.atom,                 color: '#f78c6c' },                       // orange — TRUE, FALSE, BUTTON_R2
  { tag: tags.number,               color: '#f07178' },                       // rouge-rose — nombres
  { tag: tags.string,               color: '#c3e88d' },                       // vert — chaînes
  { tag: tags.comment,              color: '#546e7a', fontStyle: 'italic' },  // gris — commentaires
  { tag: tags.operator,             color: '#89ddff' },                       // cyan — opérateurs
  { tag: tags.punctuation,          color: '#89ddff' },                       // cyan — {} ; ()
]);
