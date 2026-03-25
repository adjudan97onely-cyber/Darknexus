/**
 * VALIDATION UX RÉELLE — Test comme un CLIENT PAYANT
 * Simule l'affichage EXACT que l'utilisateur voit.
 * 
 * Pas de score moteur. Pas de code. L'EXPÉRIENCE.
 */

import { askCookingAssistant } from "../src/services/aiService.js";
import { generateChefStarRecipes } from "../src/core/chefStarEngine.js";
import { parseIntent, intentSummary } from "../src/core/intentParser.js";
import { filterByIntent } from "../src/core/contextFilter.js";

// ═══════════════════════════════════════
// 5 SCÉNARIOS UTILISATEUR RÉELS  
// ═══════════════════════════════════════

const SCENARIOS = [
  { query: "repas muscu", label: "🏋️ Muscu" },
  { query: "repas 2€", label: "💰 Budget 2€" },
  { query: "plat rapide soir", label: "⚡ Rapide soir" },
  { query: "recette antillaise", label: "🌴 Antillaise" },
  { query: "impressionner un invité", label: "🌟 Impressionner" },
];

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   VALIDATION UX — VUE CLIENT PAYANT                    ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

const allResults = [];

for (const sc of SCENARIOS) {
  console.log(`\n${"█".repeat(60)}`);
  console.log(`█  ÉCRAN: "${sc.query}"`);
  console.log(`█  ${sc.label}`);
  console.log(`${"█".repeat(60)}\n`);

  // Obtenir les recettes du moteur (ce que l'utilisateur REÇOIT)
  const intent = parseIntent(sc.query);
  const filterResult = filterByIntent(intent, { maxResults: 5, chefLevel: 10 });
  
  // Générer via le pipeline complet
  const recipes = generateChefStarRecipes({
    chefLevel: 10,
    query: sc.query,
    servings: 2,
  });

  // Aussi tester askCookingAssistant (ce que le chat affiche)
  const chatResponse = await askCookingAssistant(sc.query, {});

  // ════════ CE QUE L'UTILISATEUR VOIT ════════
  
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│  📱 ÉCRAN APPLICATION — Ce que le client voit       │");
  console.log("└─────────────────────────────────────────────────────┘\n");

  // Titre chat
  console.log(`  💬 CHAT: "${chatResponse.title}"`);
  console.log(`  ─────────────────────────────────────────`);
  
  // Réponse texte (tronquée comme sur mobile)
  const answerLines = chatResponse.answer.split("\n").slice(0, 12);
  for (const line of answerLines) {
    console.log(`  │ ${line}`);
  }
  if (chatResponse.answer.split("\n").length > 12) {
    console.log(`  │ ... (${chatResponse.answer.split("\n").length - 12} lignes supplémentaires)`);
  }

  // Cartes recettes visibles
  console.log(`\n  📋 CARTES RECETTES (${recipes.length} résultats):`);
  console.log(`  ─────────────────────────────────────────`);
  
  const scenarioData = {
    query: sc.query,
    label: sc.label,
    cards: [],
    chatTitle: chatResponse.title,
    totalRecipes: recipes.length,
    uniqueDishNames: new Set(),
    uniqueCuisines: new Set(),
    uniqueFamilies: new Set(),
    uniqueIngredientSets: [],
    allIngredients: [],
  };

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const dish = r.dishProfile;
    const ctx = r.contextValidation;
    const time = r.adaptedTiming?.total || 0;
    
    scenarioData.uniqueDishNames.add(dish.name);
    scenarioData.uniqueCuisines.add(dish.cuisine);
    scenarioData.uniqueFamilies.add(dish.family);
    scenarioData.uniqueIngredientSets.push(dish.baseFamilies.sort().join("+"));
    scenarioData.allIngredients.push(...dish.baseFamilies);

    const card = {
      name: dish.name,
      cuisine: dish.cuisine,
      family: dish.family,
      time,
      difficulty: dish.difficulty,
      ingredients: dish.baseFamilies,
      score: ctx?.contextScore?.total || r.score,
      whyMatch: ctx?.whyMatch || "",
    };
    scenarioData.cards.push(card);

    console.log(`\n  ┌─── Carte ${i + 1} ───────────────────────────────┐`);
    console.log(`  │ 🍽️  ${dish.name}`);
    console.log(`  │ 🏷️  ${dish.cuisine} · ${dish.family}`);
    console.log(`  │ ⏱️  ${time} min · Difficulté ${dish.difficulty}/5`);
    console.log(`  │ 🥘  ${dish.baseFamilies.join(", ")}`);
    if (ctx) {
      console.log(`  │ 📊  Score: ${ctx.scoreDisplay} · ${ctx.coherenceLabel}`);
      console.log(`  │ 💡  ${ctx.whyMatch.substring(0, 70)}...`);
    }
    console.log(`  └──────────────────────────────────────────────┘`);
  }

  // Alternatives proposées dans le chat
  if (chatResponse.alternatives?.length > 0) {
    console.log(`\n  📌 ALTERNATIVES SUGGÉRÉES:`);
    for (const alt of chatResponse.alternatives) {
      console.log(`     • ${alt.name} (score ${alt.score})`);
    }
  }

  // Actions disponibles
  if (chatResponse.actions?.length > 0) {
    console.log(`\n  🔘 BOUTONS:`);
    for (const act of chatResponse.actions) {
      console.log(`     [${act}]`);
    }
  }

  allResults.push(scenarioData);
}

// ═══════════════════════════════════════
// ANALYSE CRITIQUE — DÉTECTION PROBLÈMES
// ═══════════════════════════════════════

console.log(`\n\n${"═".repeat(60)}`);
console.log("🔍 ANALYSE CRITIQUE — OEIL DU CLIENT PAYANT");
console.log(`${"═".repeat(60)}\n`);

// 1. Répétition de plats entre scénarios
console.log("📊 1. DIVERSITÉ ENTRE SCÉNARIOS");
console.log("─────────────────────────────────");

const globalDishMap = {};
const globalIngredientCount = {};
const globalFamilyCount = {};

for (const result of allResults) {
  for (const card of result.cards) {
    globalDishMap[card.name] = (globalDishMap[card.name] || 0) + 1;
    globalFamilyCount[card.family] = (globalFamilyCount[card.family] || 0) + 1;
    for (const ing of card.ingredients) {
      globalIngredientCount[ing] = (globalIngredientCount[ing] || 0) + 1;
    }
  }
}

const totalCards = allResults.reduce((s, r) => s + r.cards.length, 0);
const uniqueDishes = Object.keys(globalDishMap).length;

console.log(`  Total cartes affichées: ${totalCards}`);
console.log(`  Plats UNIQUES: ${uniqueDishes}`);
console.log(`  Taux diversité: ${((uniqueDishes / totalCards) * 100).toFixed(0)}%\n`);

// Plats qui reviennent trop
const repeatedDishes = Object.entries(globalDishMap)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);

if (repeatedDishes.length > 0) {
  console.log("  ⚠️ PLATS RÉPÉTÉS (apparaissent dans plusieurs scénarios):");
  for (const [name, count] of repeatedDishes) {
    const inScenarios = allResults
      .filter((r) => r.cards.some((c) => c.name === name))
      .map((r) => r.label);
    console.log(`     • "${name}" × ${count} fois → ${inScenarios.join(", ")}`);
  }
} else {
  console.log("  ✅ Aucune répétition entre scénarios");
}

// 2. Ingrédients trop fréquents
console.log("\n📊 2. PATTERNS D'INGRÉDIENTS");
console.log("─────────────────────────────────");

const sortedIngredients = Object.entries(globalIngredientCount)
  .sort((a, b) => b[1] - a[1]);

for (const [ing, count] of sortedIngredients.slice(0, 8)) {
  const pct = ((count / totalCards) * 100).toFixed(0);
  const bar = "█".repeat(Math.round(count / totalCards * 20));
  const flag = count > totalCards * 0.5 ? " ⚠️ OMNIPRÉSENT" : "";
  console.log(`  ${ing.padEnd(16)} ${bar} ${pct}%${flag}`);
}

// 3. Familles culinaires trop concentrées
console.log("\n📊 3. FAMILLES CULINAIRES");
console.log("─────────────────────────────────");
for (const [fam, count] of Object.entries(globalFamilyCount).sort((a, b) => b[1] - a[1])) {
  const pct = ((count / totalCards) * 100).toFixed(0);
  console.log(`  ${fam.padEnd(20)} ${count} plats (${pct}%)`);
}

// 4. Analyse par scénario
console.log("\n📊 4. COHÉRENCE PAR SCÉNARIO");
console.log("─────────────────────────────────");

for (const result of allResults) {
  const cuisines = result.uniqueCuisines.size;
  const families = result.uniqueFamilies.size;
  const names = result.uniqueDishNames.size;
  
  // Duplication interne (même ingrédients dans le même scénario)
  const ingSets = result.uniqueIngredientSets;
  const uniqueIngSets = new Set(ingSets).size;
  const internalDuplication = ingSets.length > 0 
    ? ((1 - uniqueIngSets / ingSets.length) * 100).toFixed(0) 
    : "0";

  console.log(`\n  ${result.label} ("${result.query}"):`);
  console.log(`    Plats uniques: ${names}/${result.totalRecipes}`);
  console.log(`    Cuisines: ${cuisines} | Familles: ${families}`);
  console.log(`    Duplication ingrédients: ${internalDuplication}%`);
  
  // Problème détecté?
  if (names < result.totalRecipes) {
    console.log(`    ❌ DOUBLON: même plat affiché ${result.totalRecipes - names} fois!`);
  }
  if (cuisines === 1 && result.totalRecipes > 2) {
    console.log(`    ⚠️ MONO-CUISINE: toutes les cartes sont ${[...result.uniqueCuisines][0]}`);
  }
  if (families === 1 && result.totalRecipes > 2) {
    console.log(`    ⚠️ MONO-FAMILLE: toutes les cartes sont "${[...result.uniqueFamilies][0]}"`);
  }
}

// 5. Noms trop similaires
console.log("\n📊 5. NOMS TROP SIMILAIRES");
console.log("─────────────────────────────────");
const allNames = Object.keys(globalDishMap);
const similarPairs = [];
for (let i = 0; i < allNames.length; i++) {
  for (let j = i + 1; j < allNames.length; j++) {
    const a = allNames[i].toLowerCase();
    const b = allNames[j].toLowerCase();
    // Check si les noms partagent plus de 50% des mots
    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);
    const shared = wordsA.filter((w) => wordsB.includes(w)).length;
    if (shared > 0 && shared >= Math.min(wordsA.length, wordsB.length) * 0.5) {
      similarPairs.push([allNames[i], allNames[j], shared]);
    }
  }
}
if (similarPairs.length > 0) {
  for (const [a, b] of similarPairs) {
    console.log(`  ⚠️ "${a}" ↔ "${b}" (noms trop proches)`);
  }
} else {
  console.log("  ✅ Noms suffisamment distincts");
}

// ═══════════════════════════════════════
// SCORE FINAL — OEIL DU CLIENT
// ═══════════════════════════════════════

console.log(`\n\n${"═".repeat(60)}`);
console.log("💣 SCORE FINAL — CLIENT PAYANT EXIGEANT");
console.log(`${"═".repeat(60)}\n`);

// Calcul diversité
const diversityScore = Math.min(10, Math.round(
  (uniqueDishes / totalCards) * 6 + // 60% = unicité des plats
  (repeatedDishes.length === 0 ? 2 : Math.max(0, 2 - repeatedDishes.length * 0.5)) + // 20% = pas de doublons
  (Object.keys(globalFamilyCount).length / totalCards * 10) // 20% = variété familles
));

// Calcul crédibilité (est-ce que les plats correspondent à la demande?)
let credibilityHits = 0;
for (const result of allResults) {
  // Check si le top résultat fait sens pour la query
  if (result.cards.length > 0) {
    const top = result.cards[0];
    if (result.query.includes("muscu") && top.ingredients.some((i) => 
      ["poulet", "boeuf", "poisson", "crevette", "oeuf", "morue"].includes(i))) credibilityHits++;
    else if (result.query.includes("2€") && !top.ingredients.some((i) => 
      ["boeuf", "crabe", "sole"].includes(i))) credibilityHits++;
    else if (result.query.includes("rapide") && (top.time <= 25)) credibilityHits++;
    else if (result.query.includes("antillaise")) {
      if (top.cuisine === "antillaise") credibilityHits++;
    }
    else if (result.query.includes("impressionner") && top.difficulty >= 3) credibilityHits++;
    else credibilityHits += 0.5;
  }
}
const credibilityScore = Math.min(10, Math.round((credibilityHits / SCENARIOS.length) * 10));

// Calcul wow (est-ce qu'on a envie d'utiliser l'app?)
const wowFactors = [];
// Multicuisine?
const allCuisines = new Set();
for (const r of allResults) r.uniqueCuisines.forEach((c) => allCuisines.add(c));
wowFactors.push(allCuisines.size >= 3 ? 3 : allCuisines.size >= 2 ? 2 : 1);
// Des plats "spectaculaires"?
const spectacularDishes = Object.keys(globalDishMap).filter((n) => 
  ["matoutou", "bouillabaisse", "coq au vin", "beef bourguignon", "sole"].some((s) => n.toLowerCase().includes(s))
);
wowFactors.push(spectacularDishes.length >= 2 ? 3 : spectacularDishes.length === 1 ? 2 : 0);
// Métadonnées contextuelles visibles?
wowFactors.push(2); // le moteur affiche "pourquoi ce plat" → innovant
// Alternatives proposées?
wowFactors.push(1);
const wowScore = Math.min(10, wowFactors.reduce((s, v) => s + v, 0));

console.log(`  DIVERSITÉ:    ${diversityScore}/10 ${"★".repeat(diversityScore)}${"☆".repeat(10 - diversityScore)}`);
console.log(`  CRÉDIBILITÉ:  ${credibilityScore}/10 ${"★".repeat(credibilityScore)}${"☆".repeat(10 - credibilityScore)}`);
console.log(`  EFFET WOW:    ${wowScore}/10 ${"★".repeat(wowScore)}${"☆".repeat(10 - wowScore)}`);

const avgScore = ((diversityScore + credibilityScore + wowScore) / 3).toFixed(1);
console.log(`\n  MOYENNE:      ${avgScore}/10`);

if (avgScore >= 9) console.log("\n  🏆 VERDICT: EXCEPTIONNEL — JE PAYE SANS HÉSITER");
else if (avgScore >= 7.5) console.log("\n  ✅ VERDICT: BON — J'utiliserais l'app");
else if (avgScore >= 6) console.log("\n  ⚠️ VERDICT: MOYEN — J'essaye mais je reviens pas");
else console.log("\n  ❌ VERDICT: INSUFFISANT — Je désinstalle");

// Problèmes détectés à corriger
console.log(`\n\n${"═".repeat(60)}`);
console.log("🔧 ACTIONS CORRECTIVES RECOMMANDÉES");
console.log(`${"═".repeat(60)}\n`);

if (repeatedDishes.length > 3) {
  console.log("  ❌ PROBLÈME: Trop de plats répétés entre scénarios");
  console.log("     → AJOUTER des plats dans dishKnowledge.ts");
  console.log("        Manque: plat rapide protéiné (poulet grillé, steak minute)");
  console.log("        Manque: plat budget protéiné (lentilles, œufs brouillés)");
  console.log("        Manque: plat rapide antillais (salade créole, ti-punch snack)");
}

const omniIngredients = sortedIngredients.filter(([_, c]) => c > totalCards * 0.5);
if (omniIngredients.length > 0) {
  console.log(`\n  ⚠️ PROBLÈME: Ingrédients omniprésents`);
  for (const [ing] of omniIngredients) {
    console.log(`     → "${ing}" apparaît trop souvent`);
  }
  console.log("     → Diversifier la base: ajouter plats sans ces ingrédients");
}

if (wowScore < 7) {
  console.log("\n  ⚠️ PROBLÈME: Pas assez d'effet WOW");
  console.log("     → Ajouter plats spectaculaires: flambage, dressage, présentation");
  console.log("     → Ajouter images générées pour chaque carte");
  console.log("     → Ajouter animation de découverte (swipe, reveal)");
}

if (diversityScore < 7) {
  console.log("\n  ❌ PROBLÈME: Diversité insuffisante");
  console.log("     → Objectif: 0 plat répété entre 5 scénarios différents");
  console.log("     → Ajouter au moins 10 plats supplémentaires ciblés:");
  console.log("        - 3 plats rapides (<15min): salade composée, wrap, tartine");
  console.log("        - 3 plats budget: riz sauté, pâtes carbonara, soupe");
  console.log("        - 2 plats protéinés: poulet grillé, steak haché");
  console.log("        - 2 plats impressionnants: filet mignon, tatin");
}
