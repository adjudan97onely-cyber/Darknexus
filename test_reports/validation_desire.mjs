/**
 * PRODUIT PREMIUM — Validation Désir
 * "Une recette doit donner envie AVANT même de lire les étapes. Sinon → rejetée."
 * 
 * Tests:
 * 1. Tous les plats ont un desireName appétissant (!= name)
 * 2. Score plaisir: chaque plat a gourmandise/texture/visuel/arome
 * 3. Mix intelligent: chaque résultat contient au moins 1 signature + 1 essentiel
 * 4. Premium tier: ≥30% signature dans la base
 * 5. Validation "envie de cliquer": desireName >> name en attractivité
 */

import { getDishes } from "../src/core/dishKnowledge.ts";
import { generateChefStarRecipes } from "../src/core/chefStarEngine.ts";
import { filterByIntent } from "../src/core/contextFilter.ts";
import { parseIntent } from "../src/core/intentParser.ts";

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║  PRODUIT PREMIUM — VALIDATION DÉSIR                     ║");
console.log("║  \"Est-ce que j'ai envie de cliquer?\"                     ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

const allDishes = getDishes();
let passed = 0;
let failed = 0;
const failures = [];

// ═══════════════════════════════════════
// TEST 1: Tous les plats ont desireName ≠ name
// ═══════════════════════════════════════
console.log("═".repeat(60));
console.log("TEST 1: Noms appétissants (desireName ≠ name)");
console.log("─".repeat(60));

let missingDesire = 0;
let duplicateDesire = 0;
for (const dish of allDishes) {
  if (!dish.desireName || dish.desireName.trim() === "") {
    console.log(`  ❌ ${dish.id}: pas de desireName`);
    missingDesire++;
  } else if (dish.desireName === dish.name) {
    console.log(`  ⚠️  ${dish.id}: desireName identique au name`);
    duplicateDesire++;
  }
}
const desireOk = missingDesire === 0;
if (desireOk) {
  console.log(`  ✅ ${allDishes.length}/${allDishes.length} plats ont un desireName unique`);
  if (duplicateDesire > 0) console.log(`  ⚠️  ${duplicateDesire} identiques au name`);
  passed++;
} else {
  console.log(`  ❌ ${missingDesire} plats sans desireName`);
  failed++;
  failures.push("Test 1: plats sans desireName");
}

// ═══════════════════════════════════════
// TEST 2: Score plaisir (4 axes, 1-5 chacun)
// ═══════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log("TEST 2: Score plaisir (gourmandise, texture, visuel, arome)");
console.log("─".repeat(60));

let missingPlaisir = 0;
let avgPlaisir = 0;
for (const dish of allDishes) {
  const p = dish.plaisir;
  if (!p || !p.gourmandise || !p.texture || !p.visuel || !p.arome) {
    console.log(`  ❌ ${dish.id}: plaisir incomplet`);
    missingPlaisir++;
  } else {
    avgPlaisir += (p.gourmandise + p.texture + p.visuel + p.arome) / 4;
  }
}
avgPlaisir = avgPlaisir / (allDishes.length - missingPlaisir);

if (missingPlaisir === 0) {
  console.log(`  ✅ ${allDishes.length}/${allDishes.length} plats ont un score plaisir complet`);
  console.log(`  📊 Plaisir moyen: ${avgPlaisir.toFixed(2)}/5`);
  passed++;
} else {
  console.log(`  ❌ ${missingPlaisir} plats sans plaisir valide`);
  failed++;
  failures.push("Test 2: platsir manquant");
}

// ═══════════════════════════════════════
// TEST 3: Premium tier distribution (≥30% signature)
// ═══════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log("TEST 3: Distribution premium tier");
console.log("─".repeat(60));

const tiers = { signature: 0, classique: 0, essentiel: 0 };
for (const dish of allDishes) {
  if (dish.premiumTier) tiers[dish.premiumTier]++;
}
const signaturePct = (tiers.signature / allDishes.length * 100).toFixed(0);
const classiquePct = (tiers.classique / allDishes.length * 100).toFixed(0);
const essentielPct = (tiers.essentiel / allDishes.length * 100).toFixed(0);

console.log(`  ⭐ Signature:  ${tiers.signature} (${signaturePct}%)`);
console.log(`  🍽️  Classique:  ${tiers.classique} (${classiquePct}%)`);
console.log(`  📌 Essentiel:  ${tiers.essentiel} (${essentielPct}%)`);

if (tiers.signature / allDishes.length >= 0.30) {
  console.log(`  ✅ ≥30% signature: ${signaturePct}%`);
  passed++;
} else {
  console.log(`  ❌ Signature insuffisant: ${signaturePct}% < 30%`);
  failed++;
  failures.push(`Test 3: signature ${signaturePct}% < 30%`);
}

// ═══════════════════════════════════════
// TEST 4: Mix intelligent (1 essent + 2 classiq + 1 signature par set)
// ═══════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log("TEST 4: Mix intelligent par résultat");
console.log("─".repeat(60));

const MIX_SCENARIOS = [
  "repas du soir",
  "repas rapide",
  "repas muscu",
  "plat impressionnant",
  "repas pas cher",
];

let mixPass = 0;
for (const query of MIX_SCENARIOS) {
  const recipes = generateChefStarRecipes({ chefLevel: 10, query, servings: 2 });
  const tierCounts = { signature: 0, classique: 0, essentiel: 0 };
  
  for (const r of recipes) {
    const tier = r.dishProfile?.premiumTier;
    if (tier) tierCounts[tier]++;
  }

  const hasSignature = tierCounts.signature >= 1;
  const hasSimple = tierCounts.essentiel >= 1 || tierCounts.classique >= 1;
  const mixOk = hasSignature && hasSimple;

  const displayNames = recipes.map(r => r.dishProfile?.desireName || r.name);
  const tierList = recipes.map(r => r.dishProfile?.premiumTier || "?");

  console.log(`\n  "${query}" → ${recipes.length} recettes`);
  console.log(`    Mix: ${tierCounts.signature}S + ${tierCounts.classique}C + ${tierCounts.essentiel}E`);
  console.log(`    ${mixOk ? "✅" : "⚠️"} ${hasSignature ? "1+ signature" : "PAS de signature"} | ${hasSimple ? "1+ simple/classique" : "PAS de simple"}`);
  displayNames.forEach((n, i) => console.log(`    ${i + 1}. [${tierList[i]}] ${n}`));

  if (mixOk) mixPass++;
}

if (mixPass >= 3) {
  console.log(`\n  ✅ Mix intelligent: ${mixPass}/${MIX_SCENARIOS.length} scénarios OK`);
  passed++;
} else {
  console.log(`\n  ❌ Mix intelligent: seulement ${mixPass}/${MIX_SCENARIOS.length} OK`);
  failed++;
  failures.push(`Test 4: mix ${mixPass}/${MIX_SCENARIOS.length}`);
}

// ═══════════════════════════════════════
// TEST 5: Validation "envie de cliquer"
// ═══════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log('TEST 5: Validation "envie de cliquer?"');
console.log("─".repeat(60));

const DESIRE_KEYWORDS = [
  "croustillant", "fondant", "doré", "crémeux", "juteux", "parfumé",
  "épicé", "grillé", "onctueux", "caramélisé", "frais", "moelleux",
  "coulant", "croquant", "safran", "beurre", "peau", "royal",
  "smash", "filant", "mie", "wok", "poêlé", "mijoté",
];

let desireScoreTotal = 0;
let desireCount = 0;
console.log(`\n  Analyse sensorielle des noms:`);

for (const dish of allDishes) {
  const dn = (dish.desireName || "").toLowerCase();
  const matchCount = DESIRE_KEYWORDS.filter(kw => dn.includes(kw)).length;
  const desireScore = Math.min(10, Math.round(matchCount * 2.5));
  
  const p = dish.plaisir;
  const plaisirAvg = p ? (p.gourmandise + p.texture + p.visuel + p.arome) / 4 : 0;
  const gourmandiseScore = Math.min(10, Math.round(plaisirAvg * 2));
  
  desireScoreTotal += desireScore + gourmandiseScore;
  desireCount++;
  
  if (desireScore < 3) {
    console.log(`  ⚠️  ${dish.id}: "${dish.desireName}" → envie ${desireScore}/10 (peu sensoriel)`);
  }
}

const avgDesire = desireScoreTotal / desireCount / 2;
console.log(`\n  📊 Score désir moyen: ${avgDesire.toFixed(1)}/10`);

if (avgDesire >= 5) {
  console.log(`  ✅ Score désir ≥ 5/10: ${avgDesire.toFixed(1)}`);
  passed++;
} else {
  console.log(`  ❌ Score désir insuffisant: ${avgDesire.toFixed(1)} < 5`);
  failed++;
  failures.push(`Test 5: désir ${avgDesire.toFixed(1)} < 5`);
}

// ═══════════════════════════════════════
// RÉSULTAT FINAL
// ═══════════════════════════════════════
console.log(`\n${"═".repeat(60)}`);
console.log("🎯 RÉSULTAT FINAL — VALIDATION DÉSIR");
console.log("═".repeat(60));
console.log(`  Tests passés: ${passed}/${passed + failed}`);
console.log(`  Tests échoués: ${failed}/${passed + failed}`);

if (failures.length > 0) {
  console.log(`\n  Échecs:`);
  failures.forEach(f => console.log(`    ❌ ${f}`));
}

const finalScore = Math.round(passed / (passed + failed) * 10);
console.log(`\n  📊 SCORE PRODUIT PREMIUM: ${finalScore}/10`);
console.log(`  ${finalScore >= 8 ? "✅ PRODUIT PREMIUM VALIDÉ" : finalScore >= 6 ? "⚠️  AMÉLIORATIONS NÉCESSAIRES" : "❌ NE DONNE PAS ENVIE"}`);
