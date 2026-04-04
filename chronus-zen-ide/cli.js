/**
 * cli.js — Interface en ligne de commande interactive
 *
 * Chronus Zen IDE — étape 3
 * Exécuter avec : node cli.js
 *
 * Architecture :
 *  [1] colors   — codes ANSI (aucune dépendance externe)
 *  [2] print*   — fonctions d'affichage pur (aucune logique métier)
 *  [3] prompt*  — lecture d'entrée utilisateur (readline)
 *  [4] action*  — handlers menu (délèguent tout à projectManager)
 *  [5] menu     — boucle principale
 */

import * as readline from 'readline';
import { projectManager } from './index.js';

// ════════════════════════════════════════════════════════════
// [1] COULEURS ANSI
// ════════════════════════════════════════════════════════════

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  bgBlue: '\x1b[44m',
};

const red    = (s) => `${c.red}${s}${c.reset}`;
const green  = (s) => `${c.green}${s}${c.reset}`;
const yellow = (s) => `${c.yellow}${s}${c.reset}`;
const cyan   = (s) => `${c.cyan}${s}${c.reset}`;
const bold   = (s) => `${c.bold}${s}${c.reset}`;
const dim    = (s) => `${c.dim}${s}${c.reset}`;

// ════════════════════════════════════════════════════════════
// [2] FONCTIONS D'AFFICHAGE
// ════════════════════════════════════════════════════════════

function printBanner() {
  console.clear();
  console.log(bold(cyan('\n  ╔══════════════════════════════════════╗')));
  console.log(bold(cyan('  ║       CHRONUS ZEN IDE  —  CLI        ║')));
  console.log(bold(cyan('  ╚══════════════════════════════════════╝')));
  console.log(dim('  Langage GPC | Usage personnel\n'));
}

function printMenu() {
  console.log(bold('  ┌─ MENU ─────────────────────────────────┐'));
  console.log('  │  1.  Créer un script                   │');
  console.log('  │  2.  Modifier un script                 │');
  console.log('  │  3.  Supprimer un script                │');
  console.log('  │  4.  Voir tous les scripts              │');
  console.log('  │  5.  Assigner un script à un slot       │');
  console.log('  │  6.  Voir les slots                     │');
  console.log('  │  7.  Voir l\'analyse d\'un script         │');
  console.log('  │  8.  Quitter                            │');
  console.log(bold('  └────────────────────────────────────────┘'));
}

function printSeparator() {
  console.log(dim('\n  ─────────────────────────────────────────\n'));
}

function printSuccess(msg) {
  console.log(green(`\n  ✓  ${msg}`));
}

function printError(msg) {
  console.log(red(`\n  ✗  ${msg}`));
}

function printWarning(msg) {
  console.log(yellow(`  ⚠  ${msg}`));
}

function printInfo(label, value) {
  console.log(`  ${dim(label.padEnd(14))} ${value}`);
}

/**
 * Affiche la liste des scripts sous forme de tableau simple.
 * @param {import('./src/models/Script.js').Script[]} scripts
 */
function printScriptList(scripts) {
  if (scripts.length === 0) {
    console.log(dim('\n  Aucun script enregistré.\n'));
    return;
  }
  console.log();
  scripts.forEach((s, i) => {
    const lines = s.content.split('\n').filter(l => l.trim()).length;
    console.log(`  ${cyan(`[${i + 1}]`)} ${bold(s.name)}`);
    console.log(`      ${dim('ID')}      : ${dim(s.id)}`);
    console.log(`      ${dim('Lignes')}  : ${lines}`);
    console.log(`      ${dim('Modifié')} : ${new Date(s.updatedAt).toLocaleString('fr-FR')}`);
    console.log();
  });
}

/**
 * Affiche les 8 slots.
 * @param {Array} slots
 */
function printSlots(slots) {
  console.log();
  slots.forEach(sl => {
    const indicator = sl.script ? green('●') : dim('○');
    const label     = sl.script ? bold(sl.script.name) : dim('— vide —');
    console.log(`  Slot ${cyan(sl.slotNumber.toString().padStart(2))}  ${indicator}  ${label}`);
  });
  console.log();
}

/**
 * Affiche le résultat d'une analyse GPC.
 * @param {object} analysis
 */
function printAnalysis(analysis) {
  console.log();
  const status = analysis.success ? green('SUCCÈS ✓') : red('ÉCHEC ✗');
  console.log(`  Script : ${bold(analysis.scriptName)}`);
  console.log(`  Statut : ${status}`);
  console.log();

  if (analysis.errors.length === 0 && analysis.warnings.length === 0) {
    printSuccess('Aucun problème détecté.');
    return;
  }

  if (analysis.errors.length > 0) {
    console.log(red(`  Erreurs (${analysis.errors.length}) :`));
    analysis.errors.forEach(e => console.log(red(`    ✗  ${e}`)));
    console.log();
  }

  if (analysis.warnings.length > 0) {
    console.log(yellow(`  Avertissements (${analysis.warnings.length}) :`));
    analysis.warnings.forEach(w => console.log(yellow(`    ⚠  ${w}`)));
    console.log();
  }
}

// ════════════════════════════════════════════════════════════
// [3] LECTURE D'ENTRÉE (readline helpers)
// ════════════════════════════════════════════════════════════

/** Interface readline partagée */
const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

/**
 * Pose une question et retourne la réponse (Promise).
 * @param {string} question
 * @returns {Promise<string>}
 */
function ask(question) {
  return new Promise(resolve => {
    rl.question(`  ${cyan('?')}  ${question} `, answer => resolve(answer.trim()));
  });
}

/**
 * Attend que l'utilisateur appuie sur Entrée.
 */
function pressEnter() {
  return ask(dim('[ Entrée pour continuer ]'));
}

/**
 * Demande à l'utilisateur de choisir un script dans la liste.
 * Retourne le script sélectionné ou null si annulé.
 * @returns {Promise<import('./src/models/Script.js').Script|null>}
 */
async function pickScript() {
  const scripts = projectManager.getAllScripts();
  if (scripts.length === 0) {
    printError('Aucun script disponible.');
    return null;
  }
  printScriptList(scripts);
  const input = await ask('Numéro du script (ou 0 pour annuler) :');
  const index = parseInt(input, 10) - 1;
  if (isNaN(index) || index < 0) return null;
  if (index >= scripts.length) {
    printError(`Numéro invalide. Entrez entre 1 et ${scripts.length}.`);
    return null;
  }
  return scripts[index];
}

// ════════════════════════════════════════════════════════════
// [4] ACTIONS DU MENU
// ════════════════════════════════════════════════════════════

/** Action 1 — Créer un script */
async function actionCreateScript() {
  const name = await ask('Nom du script :');
  if (!name) { printError('Nom vide, opération annulée.'); return; }

  console.log(dim('\n  Entrez le contenu du script (terminez avec une ligne contenant uniquement "END") :'));

  const lines = [];
  await new Promise(resolve => {
    const onLine = (line) => {
      if (line.trim() === 'END') {
        rl.removeListener('line', onLine);
        resolve();
      } else {
        lines.push(line);
      }
    };
    rl.on('line', onLine);
  });

  const content = lines.join('\n');

  try {
    const script = projectManager.createScript(name, content);
    printSuccess(`Script "${script.name}" créé (${script.id.slice(0, 8)}…)`);
  } catch (err) {
    printError(err.message);
  }
}

/** Action 2 — Modifier un script */
async function actionUpdateScript() {
  const script = await pickScript();
  if (!script) return;

  console.log(dim('\n  Contenu actuel :'));
  script.content.split('\n').forEach(l => console.log(`  ${dim('│')} ${l}`));

  console.log(dim('\n  Entrez le nouveau contenu (terminez avec une ligne contenant uniquement "END") :'));

  const lines = [];
  await new Promise(resolve => {
    const onLine = (line) => {
      if (line.trim() === 'END') {
        rl.removeListener('line', onLine);
        resolve();
      } else {
        lines.push(line);
      }
    };
    rl.on('line', onLine);
  });

  const newContent = lines.join('\n');

  try {
    projectManager.updateScript(script.id, newContent);
    printSuccess(`Script "${script.name}" mis à jour.`);
  } catch (err) {
    printError(err.message);
  }
}

/** Action 3 — Supprimer un script */
async function actionDeleteScript() {
  const script = await pickScript();
  if (!script) return;

  const confirm = await ask(`Supprimer "${bold(script.name)}" ? (oui/non) :`);
  if (confirm.toLowerCase() !== 'oui') {
    console.log(dim('\n  Suppression annulée.'));
    return;
  }

  try {
    projectManager.deleteScript(script.id);
    printSuccess(`Script "${script.name}" supprimé.`);
  } catch (err) {
    printError(err.message);
  }
}

/** Action 4 — Voir tous les scripts */
async function actionListScripts() {
  const scripts = projectManager.getAllScripts();
  if (scripts.length === 0) {
    console.log(dim('\n  Aucun script enregistré.'));
    return;
  }
  console.log(`\n  ${bold(scripts.length + ' script(s) enregistré(s) :')}`);
  printScriptList(scripts);
}

/** Action 5 — Assigner un script à un slot */
async function actionAssignToSlot() {
  const script = await pickScript();
  if (!script) return;

  const slotInput = await ask('Numéro de slot (1–8) :');
  const slotNumber = parseInt(slotInput, 10);

  try {
    const { slot, analysis } = projectManager.assignScriptToSlot(slotNumber, script.id);
    printSuccess(`"${script.name}" assigné au slot ${slot.slotNumber}.`);

    if (analysis) {
      printSeparator();
      console.log(bold('  Résultat de l\'analyse automatique :'));
      printAnalysis(analysis);
    }
  } catch (err) {
    printError(err.message);
  }
}

/** Action 6 — Voir les slots */
async function actionViewSlots() {
  const slots = projectManager.getSlots();
  console.log(`\n  ${bold('État des 8 slots :')}`);
  printSlots(slots);
}

/** Action 7 — Voir l'analyse d'un script */
async function actionViewAnalysis() {
  const script = await pickScript();
  if (!script) return;

  try {
    const analysis = projectManager.getScriptAnalysis(script.id);
    printSeparator();
    console.log(bold('  Analyse GPC :'));
    printAnalysis(analysis);
  } catch (err) {
    printError(err.message);
  }
}

// ════════════════════════════════════════════════════════════
// [5] BOUCLE PRINCIPALE
// ════════════════════════════════════════════════════════════

const ACTIONS = {
  '1': actionCreateScript,
  '2': actionUpdateScript,
  '3': actionDeleteScript,
  '4': actionListScripts,
  '5': actionAssignToSlot,
  '6': actionViewSlots,
  '7': actionViewAnalysis,
};

async function loop() {
  while (true) {
    printBanner();
    printMenu();
    console.log();

    const choice = await ask('Votre choix :');

    if (choice === '8' || choice.toLowerCase() === 'q') {
      console.log(green('\n  Au revoir.\n'));
      rl.close();
      process.exit(0);
    }

    const action = ACTIONS[choice];
    if (!action) {
      printError('Choix invalide. Entrez un chiffre entre 1 et 8.');
      await pressEnter();
      continue;
    }

    printSeparator();
    await action();
    await pressEnter();
  }
}

// ════════════════════════════════════════════════════════════
// DÉMARRAGE
// ════════════════════════════════════════════════════════════

loop().catch(err => {
  console.error(red(`\n  Erreur fatale : ${err.message}\n`));
  process.exit(1);
});
