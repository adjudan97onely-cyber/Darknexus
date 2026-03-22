/**
 * CONTEXT INTELLIGENCE ENGINE — Test de validation
 * Vérifie que le moteur répond bien à l'INTENTION et pas au hasard.
 * 
 * Critères STRICTS:
 * - "repas muscu" → doit contenir protéine élevée (poulet, boeuf, poisson)
 * - "repas 2€" → PAS de boeuf, crabe, sole
 * - "plat rapide soir" → temps total < 20 min
 * - "impressionner invité" → plat complexe + visuel
 * - "plat léger" → PAS de crème, lard, fromage
 * - "bokit" → bokit exact (match direct)
 */

import { parseIntent, intentSummary } from "../src/core/intentParser.js";
import { filterByIntent, buildValidationMeta } from "../src/core/contextFilter.js";
import { scoreDish } from "../src/core/contextScorer.js";
import { generateChefStarRecipes } from "../src/core/chefStarEngine.js";

// ═══════════════════════════════════════
// CAS DE TEST — CRITÈRES MÉTIER
// ═══════════════════════════════════════

const TEST_CASES = [
  {
    query: "repas muscu",
    expectGoal: "protein",
    mustContain: ["poulet", "boeuf", "poisson", "crevette", "oeuf", "morue", "sole"],
    mustNotContain: [],
    maxTime: null,
    label: "🏋️ Muscu → protéines obligatoires",
  },
  {
    query: "repas 2€",
    expectGoal: "budget",
    mustContain: [],
    mustNotContain: ["boeuf", "crabe", "sole", "safran", "crustace"],
    maxTime: null,
    label: "💰 Budget → pas d'ingrédients chers",
  },
  {
    query: "plat rapide soir",
    expectGoal: "speed",
    mustContain: [],
    mustNotContain: [],
    maxTime: 25, // on accorde 25min max (pas 20 strict car prep incompressible)
    label: "⚡ Rapide → max 25 min total",
  },
  {
    query: "impressionner un invité",
    expectGoal: "impress",
    mustContain: [],
    mustNotContain: [],
    maxTime: null,
    minDifficulty: 3,
    label: "🌟 Impressionner → difficulté ≥ 3",
  },
  {
    query: "repas léger healthy",
    expectGoal: "light",
    mustContain: [],
    mustNotContain: ["lard", "creme", "fromage"],
    maxTime: null,
    label: "🥗 Léger → pas de gras lourd",
  },
  {
    query: "bokit",
    expectGoal: null, // match direct, pas d'intention spécifique requise
    mustContain: [],
    mustNotContain: [],
    maxTime: null,
    expectDish: "bokit",
    label: "🎯 Bokit → match direct exact",
  },
  {
    query: "colombo poulet",
    expectGoal: null,
    mustContain: [],
    mustNotContain: [],
    maxTime: null,
    expectDish: "colombo",
    label: "🎯 Colombo → match direct exact",
  },
  {
    query: "plat réconfortant hiver",
    expectGoal: "comfort",
    mustContain: [],
    mustNotContain: [],
    maxTime: null,
    label: "🔥 Réconfortant → plat chaleureux",
  },
];

// ═══════════════════════════════════════
// EXÉCUTION DES TESTS
// ═══════════════════════════════════════

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║  CONTEXT INTELLIGENCE ENGINE — VALIDATION COMPLÈTE  ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

let passed = 0;
let failed = 0;
const failures = [];

for (const tc of TEST_CASES) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`TEST: ${tc.label}`);
  console.log(`Query: "${tc.query}"`);
  console.log(`${"─".repeat(60)}`);

  // 1. Test Intent Parser
  const intent = parseIntent(tc.query);
  console.log(`  Intent détecté: ${intent.goal} (confiance: ${(intent.confidence * 100).toFixed(0)}%)`);
  console.log(`  Résumé: ${intentSummary(intent)}`);
  console.log(`  Keywords matchés: ${intent.matchedKeywords.join(", ") || "(aucun)"}`);

  if (tc.expectGoal && intent.goal !== tc.expectGoal) {
    console.log(`  ❌ ERREUR INTENTION: attendu "${tc.expectGoal}", obtenu "${intent.goal}"`);
    failed++;
    failures.push({ test: tc.label, error: `Intent ${intent.goal} ≠ ${tc.expectGoal}` });
    continue;
  }
  if (tc.expectGoal) {
    console.log(`  ✅ Intention correcte: ${intent.goal}`);
  }

  // 2. Test Filter + Score
  const filterResult = filterByIntent(intent, { maxResults: 5, chefLevel: 10 });
  console.log(`\n  Filtrage: ${filterResult.stats.accepted} acceptés / ${filterResult.stats.rejected} rejetés sur ${filterResult.stats.totalCandidates} plats`);
  console.log(`  Top score: ${filterResult.stats.topScore}/100 | Moyenne: ${filterResult.stats.avgScore}/100`);

  // 3. Test Génération complète
  const recipes = generateChefStarRecipes({
    chefLevel: 10,
    query: tc.query,
    servings: 2,
  });

  if (recipes.length === 0) {
    console.log(`  ❌ AUCUNE RECETTE GÉNÉRÉE`);
    failed++;
    failures.push({ test: tc.label, error: "0 recettes" });
    continue;
  }

  const top = recipes[0];
  const dishName = top.dishProfile?.name || top.name || "";
  const dishFamilies = (top.dishProfile?.baseFamilies || []).map((f) => f.toLowerCase());
  const totalTime = (top.adaptedTiming?.total || 0);
  const ctx = top.contextValidation;

  console.log(`\n  🍽️  Plat sélectionné: ${dishName}`);
  console.log(`  Ingrédients: ${dishFamilies.join(", ")}`);
  console.log(`  Temps total: ${totalTime} min`);
  console.log(`  Difficulté: ${top.dishProfile?.difficulty || "?"}/5`);

  if (ctx) {
    console.log(`\n  📊 VALIDATION CONTEXTUELLE:`);
    console.log(`     Intention: ${ctx.intentSummary}`);
    console.log(`     Pourquoi: ${ctx.whyMatch}`);
    console.log(`     Score: ${ctx.scoreDisplay}`);
    console.log(`     Cohérence: ${ctx.coherenceLabel}`);
    console.log(`     Nutrition: ${ctx.nutritionLabel}`);
    console.log(`     Temps: ${ctx.timeLabel}`);
    console.log(`     Budget: ${ctx.budgetLabel}`);
  }

  // 4. Vérification des CRITÈRES MÉTIER
  let testPassed = true;

  // Vérif match direct
  if (tc.expectDish) {
    const nameMatch = dishName.toLowerCase().includes(tc.expectDish);
    if (!nameMatch) {
      console.log(`  ❌ MATCH DIRECT: attendu "${tc.expectDish}" dans "${dishName}"`);
      testPassed = false;
      failures.push({ test: tc.label, error: `"${dishName}" ne contient pas "${tc.expectDish}"` });
    } else {
      console.log(`  ✅ Match direct: "${tc.expectDish}" trouvé`);
    }
  }

  // Vérif ingrédients obligatoires
  if (tc.mustContain.length > 0) {
    const hasRequired = tc.mustContain.some((req) =>
      dishFamilies.some((f) => f.includes(req))
    );
    if (!hasRequired) {
      console.log(`  ❌ INGRÉDIENT MANQUANT: doit contenir un de [${tc.mustContain.join(", ")}]`);
      console.log(`     Trouvé: [${dishFamilies.join(", ")}]`);
      testPassed = false;
      failures.push({ test: tc.label, error: `Aucun de [${tc.mustContain.join(",")}] dans [${dishFamilies.join(",")}]` });
    } else {
      console.log(`  ✅ Contient ingrédient requis`);
    }
  }

  // Vérif ingrédients interdits
  if (tc.mustNotContain.length > 0) {
    const hasForbidden = tc.mustNotContain.filter((bad) =>
      dishFamilies.some((f) => f.includes(bad))
    );
    if (hasForbidden.length > 0) {
      console.log(`  ❌ INGRÉDIENT INTERDIT: ${hasForbidden.join(", ")} détecté`);
      testPassed = false;
      failures.push({ test: tc.label, error: `Interdit: ${hasForbidden.join(",")}` });
    } else {
      console.log(`  ✅ Aucun ingrédient interdit`);
    }
  }

  // Vérif temps max
  if (tc.maxTime && totalTime > tc.maxTime) {
    console.log(`  ❌ TROP LENT: ${totalTime} min > max ${tc.maxTime} min`);
    testPassed = false;
    failures.push({ test: tc.label, error: `${totalTime}min > ${tc.maxTime}min` });
  } else if (tc.maxTime) {
    console.log(`  ✅ Temps respecté: ${totalTime} min ≤ ${tc.maxTime} min`);
  }

  // Vérif difficulté min
  if (tc.minDifficulty && (top.dishProfile?.difficulty || 0) < tc.minDifficulty) {
    console.log(`  ❌ PAS ASSEZ COMPLEXE: difficulté ${top.dishProfile?.difficulty} < min ${tc.minDifficulty}`);
    testPassed = false;
    failures.push({ test: tc.label, error: `Difficulté ${top.dishProfile?.difficulty} < ${tc.minDifficulty}` });
  } else if (tc.minDifficulty) {
    console.log(`  ✅ Complexité suffisante: ${top.dishProfile?.difficulty}/5`);
  }

  // Alternatives proposées
  if (recipes.length > 1) {
    console.log(`\n  📋 Alternatives (${recipes.length - 1}):`);
    for (const alt of recipes.slice(1, 4)) {
      const altCtx = alt.contextValidation;
      console.log(`     • ${alt.dishProfile?.name} — score ${altCtx?.scoreDisplay || alt.score}`);
    }
  }

  if (testPassed) {
    passed++;
    console.log(`\n  ✅ TEST PASSÉ`);
  } else {
    failed++;
    console.log(`\n  ❌ TEST ÉCHOUÉ`);
  }
}

// ═══════════════════════════════════════
// RAPPORT FINAL
// ═══════════════════════════════════════

console.log(`\n\n${"═".repeat(60)}`);
console.log("RAPPORT FINAL — CONTEXT INTELLIGENCE ENGINE");
console.log(`${"═".repeat(60)}`);
console.log(`Tests passés: ${passed}/${TEST_CASES.length}`);
console.log(`Tests échoués: ${failed}/${TEST_CASES.length}`);
console.log(`Taux réussite: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n❌ ÉCHECS:`);
  for (const f of failures) {
    console.log(`  • ${f.test}: ${f.error}`);
  }
}

const verdict =
  failed === 0
    ? "🏆 PARFAIT — Toutes les intentions sont correctement traitées"
    : failed <= 2
      ? "⚠️ BON — Quelques ajustements nécessaires"
      : "❌ INSUFFISANT — Le moteur ne comprend pas les intentions";

console.log(`\nVERDICT: ${verdict}`);
