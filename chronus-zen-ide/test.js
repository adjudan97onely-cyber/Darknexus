/**
 * test.js — Scénario de démonstration complet (étapes 1 + 2)
 *
 * Exécuter avec : node test.js
 * Aucun framework de test requis.
 */

import { projectManager, compiler } from './index.js';

// ─── Helpers d'affichage ─────────────────────────────────────────────────────

function section(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function ok(msg)   { console.log(`  ✓  ${msg}`); }
function fail(msg) { console.error(`  ✗  ${msg}`); process.exitCode = 1; }

function assert(condition, label) {
  condition ? ok(label) : fail(label);
}

// ─── Nettoyage : supprimer scripts précédents pour test propre ────────────────

section('NETTOYAGE (reset pour test idempotent)');
projectManager.getAllScripts().forEach(s => {
  projectManager.deleteScript(s.id);
  ok(`Script supprimé : "${s.name}"`);
});

// ─── 1. Création de scripts ───────────────────────────────────────────────────

section('1. createScript()');

const scriptA = projectManager.createScript('Aim Assist v1', `
combo aim_assist {
  set_val(Analog_RY, -30);
  set_val(Analog_RX, 0);
}
`);
ok(`Créé : "${scriptA.name}" (${scriptA.id})`);

const scriptB = projectManager.createScript('Rapid Fire', `
combo rapid_fire {
  set_val(BUTTON_R2, 100);
  wait(80);
  set_val(BUTTON_R2, 0);
  wait(80);
}
`);
ok(`Créé : "${scriptB.name}" (${scriptB.id})`);

assert(projectManager.getAllScripts().length === 2, 'Deux scripts en mémoire');

// ─── 2. Lecture ───────────────────────────────────────────────────────────────

section('2. getAllScripts() + getScriptById()');

const all = projectManager.getAllScripts();
assert(all.length === 2, `getAllScripts() retourne 2 scripts`);

const found = projectManager.getScriptById(scriptA.id);
assert(found !== null && found.name === 'Aim Assist v1', 'getScriptById() fonctionne');

// ─── 3. Mise à jour ───────────────────────────────────────────────────────────

section('3. updateScript()');

const updated = projectManager.updateScript(scriptA.id, '// version corrigée\ncombo aim_fix {}');
assert(updated.content.includes('version corrigée'), 'Contenu mis à jour');
assert(updated.updatedAt > updated.createdAt, 'updatedAt > createdAt');

// ─── 4. Assignation aux slots ─────────────────────────────────────────────────

section('4. assignScriptToSlot() + getSlots()');

projectManager.assignScriptToSlot(1, scriptA.id);
projectManager.assignScriptToSlot(2, scriptB.id);

const slots = projectManager.getSlots();
assert(slots[0].script?.name === 'Aim Assist v1',  'Slot 1 → Aim Assist v1');
assert(slots[1].script?.name === 'Rapid Fire',     'Slot 2 → Rapid Fire');
assert(slots[2].script === null,                   'Slot 3 → vide');

// Libérer un slot
projectManager.assignScriptToSlot(1, null);
const slotsAfter = projectManager.getSlots();
assert(slotsAfter[0].script === null, 'Slot 1 libéré avec null');

// ─── 5. Suppression + cascade slots ───────────────────────────────────────────

section('5. deleteScript() — cascade slots');

projectManager.assignScriptToSlot(3, scriptB.id);
projectManager.deleteScript(scriptB.id);

const slotsAfterDelete = projectManager.getSlots();
assert(slotsAfterDelete[1].script === null, 'Slot 2 libéré après suppression du script');
assert(slotsAfterDelete[2].script === null, 'Slot 3 libéré après suppression du script');
assert(projectManager.getAllScripts().length === 1, 'Il reste 1 script');

// ─── 6. Erreurs attendues ─────────────────────────────────────────────────────

section('6. Validation des erreurs attendues');

try {
  projectManager.createScript('  ');
  fail('createScript("  ") aurait dû lever une erreur');
} catch (e) {
  ok(`createScript("  ") → erreur attendue : ${e.message}`);
}

try {
  projectManager.assignScriptToSlot(9, null);
  fail('Slot 9 aurait dû lever une erreur');
} catch (e) {
  ok(`assignScriptToSlot(9) → erreur attendue : ${e.message}`);
}

// ─── 7. GpcCompiler — format standardisé ─────────────────────────────────────

section('7. GpcCompiler.analyze() — format { success, errors, warnings }');

// Script valide
const validScript = projectManager.createScript('Valid Script', `
combo test {
  set_val(BUTTON_R2, 100);
}
`);
const result1 = compiler.analyze(validScript);
assert(result1.success === true,        'Script valide → success=true');
assert(result1.errors.length   === 0,   'Aucune erreur bloquante');
assert(Array.isArray(result1.warnings), 'warnings est un tableau');

// Script vide → E001
const emptyResult = compiler.analyze({ id: 'x', name: 'Vide', content: '' });
assert(emptyResult.success === false,               'Script vide → success=false');
assert(emptyResult.issues[0]?.code === 'E001',      'Code E001 sur script vide');
assert(emptyResult.errors.length >= 1,              'Au moins 1 erreur texte');

// Script avec TODO (W001) et point-virgule manquant (E002)
const badScript = { id: 'y', name: 'Mauvais', content: `combo test {\n  set_val(BUTTON_R2, 100) // TODO fixer\n}` };
const result3 = compiler.analyze(badScript);
const issueCodes = result3.issues.map(i => i.code);
assert(issueCodes.includes('E002'), 'E002 détecté (point-virgule manquant)');
assert(issueCodes.includes('W001'), 'W001 détecté (TODO)');
assert(result3.success === false,   'Script avec erreur → success=false');

// Script sans bloc combo → E004
const noBlock = { id: 'z', name: 'SansBloc', content: 'set_val(BUTTON_R2, 100);' };
const result4 = compiler.analyze(noBlock);
assert(result4.issues.some(i => i.code === 'E004'), 'E004 détecté (aucun bloc combo/init)');

// Script avec mot suspect → W002 (dans une instruction, pas un commentaire)
const suspectScript = { id: 'w', name: 'Suspect', content: `combo test {\n  set_val(BUTTON_R2, undefined);\n}` };
const result5 = compiler.analyze(suspectScript);
assert(result5.issues.some(i => i.code === 'W002'), 'W002 détecté (mot suspect)');
assert(result5.warnings.length >= 1,                'Au moins 1 warning texte');

// ─── 8. AUTO-COMPILATION + getScriptAnalysis() ────────────────────────────────

section('8. Auto-compilation à l\'assignation + getScriptAnalysis()');

// Script GPC valide pour cette section
const autoScript = projectManager.createScript('Auto Compile Test', `
combo auto_test {
  set_val(BUTTON_R2, 100);
  wait(50);
  set_val(BUTTON_R2, 0);
  wait(50);
}
`);

// L'assignation doit déclencher l'analyse automatiquement
const { slot, analysis } = projectManager.assignScriptToSlot(4, autoScript.id);

assert(slot.slotNumber === 4,           'Slot 4 correctement assigné');
assert(slot.scriptId === autoScript.id, 'scriptId correct dans le slot');
assert(analysis !== null,               'analysis retournée par assignScriptToSlot');
assert(analysis.success === true,       'Script valide → analysis.success=true');
assert(analysis.errors.length === 0,    'Aucune erreur dans l\'analyse auto');

console.log('\n  [Rapport auto-compilation]');
console.log(`  Script : "${analysis.scriptName}"`);
console.log(`  Statut : ${analysis.success ? 'SUCCÈS ✓' : 'ÉCHEC ✗'}`);
console.log(`  Erreurs   : ${analysis.errors.length}`);
console.log(`  Warnings  : ${analysis.warnings.length}`);
if (analysis.warnings.length) {
  analysis.warnings.forEach(w => console.log(`    ⚠  ${w}`));
}

// Libérer le slot — analysis doit être null
const { analysis: nullAnalysis } = projectManager.assignScriptToSlot(4, null);
assert(nullAnalysis === null, 'Libération de slot → analysis=null');

// getScriptAnalysis() — script jamais assigné depuis réinitialisation
const freshScript = projectManager.createScript('Fresh', `
combo fresh {
  set_val(Analog_RY, -30);
}
`);
const freshAnalysis = projectManager.getScriptAnalysis(freshScript.id);
assert(freshAnalysis !== null,             'getScriptAnalysis() retourne un résultat');
assert(typeof freshAnalysis.success === 'boolean', 'Champ success présent');

// getScriptAnalysis() — script inexistant → erreur attendue
try {
  projectManager.getScriptAnalysis('id-inexistant');
  fail('getScriptAnalysis sur id inexistant aurait dû lever une erreur');
} catch (e) {
  ok(`getScriptAnalysis(id inexistant) → erreur attendue : ${e.message}`);
}

// ─── Résumé ───────────────────────────────────────────────────────────────────

section('RÉSUMÉ');
if (process.exitCode === 1) {
  console.error('\n  Certains tests ont échoué.\n');
} else {
  console.log('\n  Tous les tests sont passés.\n');
}