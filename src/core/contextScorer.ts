/**
 * CONTEXT INTELLIGENCE ENGINE — Module 2: Context Scorer
 * Score chaque plat sur cohérence avec l'intention utilisateur.
 * Si score < seuil → rejet automatique.
 */

import { DishProfile } from "./dishKnowledge";
import { ParsedIntent, IntentGoal } from "./intentParser";

// ==========================================
// ESTIMATION DES PROPRIÉTÉS
// ==========================================

/** Coût estimé 1-3 basé sur les ingredients */
function estimateBudgetLevel(dish: DishProfile): 1 | 2 | 3 {
  const expensive = ["boeuf", "crabe", "crustace", "sole", "safran", "vin-rouge", "champignon", "crevette", "poisson-blanc", "poisson", "saumon", "langouste", "homard", "riz-arborio", "pate-feuilletee"];
  const cheap = ["farine", "oeuf", "oignon", "tomate", "riz", "pomme-terre", "levure", "ail", "pates", "lentilles", "carotte", "pain", "tortilla", "salade", "poireau"];

  let expensiveCount = 0;
  let cheapCount = 0;

  for (const fam of dish.baseFamilies) {
    const f = fam.toLowerCase();
    if (expensive.some((e) => f.includes(e))) expensiveCount++;
    if (cheap.some((c) => f.includes(c))) cheapCount++;
  }

  if (expensiveCount >= 2) return 3;
  if (expensiveCount >= 1) return 2;
  return 1;
}

/** Niveau protéine estimé 1-3 basé sur les ingredients + famille du plat */
function estimateProteinLevel(dish: DishProfile): 1 | 2 | 3 {
  const highProtein = ["poulet", "boeuf", "poisson", "crevette", "crabe", "morue", "sole", "tofu", "oeuf", "saumon", "thon", "porc", "dinde"];
  const medProtein = ["fromage", "creme", "lait", "quinoa", "lentilles"];
  const proteinFamilies = ["viande-grillee", "viande-noble", "viande-crue", "poisson-grille", "bowl-complet", "oeuf"];

  const families = dish.baseFamilies.map((f) => f.toLowerCase());
  const highCount = families.filter((f) => highProtein.some((hp) => f.includes(hp))).length;
  const medCount = families.filter((f) => medProtein.some((mp) => f.includes(mp))).length;
  const isProteinFamily = proteinFamilies.includes(dish.family);

  if (highCount >= 2 || (highCount >= 1 && isProteinFamily)) return 3;
  if (highCount >= 1 || medCount >= 2) return 2;
  return 1;
}

/** Impact visuel estimé 1-3 basé sur difficulté + technique */
function estimateVisualImpact(dish: DishProfile): 1 | 2 | 3 {
  const spectacularTechniques = ["braise", "sous-vide", "demi-glace-mastery"];
  const simpleTechniques = ["boil", "fry"];

  if (dish.difficulty >= 4 || spectacularTechniques.includes(dish.technique)) return 3;
  if (dish.difficulty >= 3 && !simpleTechniques.includes(dish.technique)) return 2;
  return 1;
}

/** Temps total estimé en minutes */
function estimateTotalTime(dish: DishProfile): number {
  return dish.timings.prep + dish.timings.cook + (dish.timings.rest || 0);
}

/** Score plaisir 0-20 basé sur les 4 axes du plat */
function calculatePlaisirScore(dish: DishProfile): number {
  const p = dish.plaisir;
  const raw = (p.gourmandise + p.texture + p.visuel + p.arome) / 20; // 0-1
  return Math.round(raw * 20);
}

// ==========================================
// SCORING CONTEXTUEL
// ==========================================

export interface ContextScore {
  total: number; // 0-100
  intentCoherence: number; // 0-40 — Cohérence avec intention
  timeScore: number; // 0-20 — Respect contrainte temps
  budgetScore: number; // 0-20 — Respect contrainte budget
  nutritionScore: number; // 0-20 — Respect contrainte nutrition
  plaisirScore: number; // 0-20 — Score plaisir (gourmandise, texture, visuel, arome)
  rejected: boolean;
  rejectReason?: string;
  explanation: string;
}

const REJECTION_THRESHOLD = 35;

/**
 * Score un plat par rapport à une intention détectée.
 * Score < REJECTION_THRESHOLD → plat rejeté
 */
export function scoreDish(dish: DishProfile, intent: ParsedIntent): ContextScore {
  const c = intent.constraints;
  const totalTime = estimateTotalTime(dish);
  const budgetLevel = estimateBudgetLevel(dish);
  const proteinLevel = estimateProteinLevel(dish);
  const visualImpact = estimateVisualImpact(dish);
  const plaisirScore = calculatePlaisirScore(dish);

  let intentCoherence = 0;
  let timeScore = 0;
  let budgetScore = 0;
  let nutritionScore = 0;
  let rejectReason: string | undefined;

  // ======== INTENT COHERENCE (0-40) ========
  switch (intent.goal) {
    case "protein":
      intentCoherence = proteinLevel === 3 ? 40 : proteinLevel === 2 ? 22 : 5;
      break;
    case "budget":
      intentCoherence = budgetLevel === 1 ? 40 : budgetLevel === 2 ? 18 : 2;
      break;
    case "speed":
      intentCoherence = totalTime <= 20 ? 40 : totalTime <= 30 ? 25 : totalTime <= 45 ? 10 : 2;
      break;
    case "impress":
      intentCoherence = visualImpact === 3 ? 40 : visualImpact === 2 ? 24 : 8;
      break;
    case "light":
      // Léger = pas trop riche, pas trop gras
      const heavyFamilies = ["lard", "creme", "fromage", "beurre"];
      const heavyCount = dish.baseFamilies.filter((f) =>
        heavyFamilies.some((h) => f.toLowerCase().includes(h))
      ).length;
      intentCoherence = heavyCount === 0 ? 40 : heavyCount === 1 ? 20 : 5;
      break;
    case "comfort":
      const comfortFamilies = ["pomme-terre", "fromage", "creme", "boeuf", "poulet"];
      const comfortCount = dish.baseFamilies.filter((f) =>
        comfortFamilies.some((cf) => f.toLowerCase().includes(cf))
      ).length;
      intentCoherence = comfortCount >= 2 ? 40 : comfortCount === 1 ? 25 : 10;
      break;
    case "discovery":
      // Si cuisine spécifique demandée, la cuisine bonus/malus dans le bloc CUISINE gère tout
      // Sinon haute difficulté / cuisine exotique = plus de découverte
      if (c.preferredCuisine) {
        intentCoherence = 25; // neutre, le bonus cuisine fera le travail
      } else {
        const exoticCuisines = ["antillaise", "thaï", "indienne", "asiatique", "italienne"];
        const isExotic = exoticCuisines.includes(dish.cuisine.toLowerCase());
        intentCoherence = isExotic ? 35 : dish.difficulty >= 3 ? 25 : 15;
      }
      break;
    case "general":
      intentCoherence = 30; // neutre
      break;
  }

  // ======== TIME SCORE (0-20) ========
  if (c.maxTotalMinutes) {
    if (totalTime <= c.maxTotalMinutes) {
      timeScore = 20;
    } else if (totalTime <= c.maxTotalMinutes * 1.5) {
      timeScore = 10;
    } else {
      timeScore = 2;
      if (intent.goal === "speed") {
        rejectReason = `Temps ${totalTime} min > max ${c.maxTotalMinutes} min`;
      }
    }
  } else {
    timeScore = 15; // pas de contrainte = bonus neutre
  }

  // ======== BUDGET SCORE (0-20) ========
  if (c.maxBudgetLevel) {
    if (budgetLevel <= c.maxBudgetLevel) {
      budgetScore = 20;
    } else if (budgetLevel === c.maxBudgetLevel + 1) {
      budgetScore = 8;
    } else {
      budgetScore = 0;
      if (intent.goal === "budget") {
        rejectReason = `Budget trop élevé (niveau ${budgetLevel} > max ${c.maxBudgetLevel})`;
      }
    }
  } else {
    budgetScore = 15;
  }

  // ======== NUTRITION SCORE (0-20) ========
  if (c.minProteinLevel) {
    if (proteinLevel >= c.minProteinLevel) {
      nutritionScore = 20;
    } else if (proteinLevel === c.minProteinLevel - 1) {
      nutritionScore = 10;
    } else {
      nutritionScore = 2;
      if (intent.goal === "protein") {
        rejectReason = `Protéines insuffisantes (niveau ${proteinLevel} < min ${c.minProteinLevel})`;
      }
    }
  } else {
    nutritionScore = 15;
  }

  // ======== DIFFICULTY CHECK ========
  if (c.maxDifficulty && dish.difficulty > c.maxDifficulty) {
    intentCoherence = Math.max(0, intentCoherence - 10);
  }

  // ======== VISUAL IMPACT CHECK ========
  if (c.minVisualImpact && visualImpact < c.minVisualImpact) {
    intentCoherence = Math.max(0, intentCoherence - 8);
    if (intent.goal === "impress" && dish.difficulty < 3) {
      rejectReason = `Pas assez impressionnant (difficulté ${dish.difficulty}/5, impact visuel ${visualImpact}/3)`;
    }
  }

  // ======== FAMILLE PRÉFÉRÉE BONUS ========
  if (c.preferredFamilies && c.preferredFamilies.length > 0) {
    const preferred = dish.baseFamilies.filter((f) =>
      c.preferredFamilies!.some((pf) => f.toLowerCase().includes(pf))
    ).length;
    intentCoherence = Math.min(40, intentCoherence + preferred * 3);
  }

  // ======== FAMILLE EXCLUE PÉNALITÉ ========
  if (c.excludedFamilies && c.excludedFamilies.length > 0) {
    const excluded = dish.baseFamilies.filter((f) =>
      c.excludedFamilies!.some((ef) => f.toLowerCase().includes(ef))
    ).length;
    if (excluded > 0) {
      intentCoherence = Math.max(0, intentCoherence - excluded * 12);
      if (intent.goal === "budget" && excluded > 0) {
        rejectReason = `Contient ingrédient(s) cher(s) exclu(s) du budget`;
      }
    }
  }

  // ======== CUISINE PRÉFÉRÉE BONUS/MALUS ========
  if (c.preferredCuisine) {
    const dishCuisine = dish.cuisine.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prefCuisine = c.preferredCuisine.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (dishCuisine === prefCuisine) {
      intentCoherence = Math.min(40, intentCoherence + 15);
    } else {
      intentCoherence = Math.max(0, intentCoherence - 15);
    }
  }

  const total = intentCoherence + timeScore + budgetScore + nutritionScore + plaisirScore;
  const rejected = rejectReason != null || total < REJECTION_THRESHOLD;

  return {
    total,
    intentCoherence,
    timeScore,
    budgetScore,
    nutritionScore,
    plaisirScore,
    rejected,
    rejectReason: rejected ? rejectReason || `Score ${total} < seuil ${REJECTION_THRESHOLD}` : undefined,
    explanation: buildExplanation(dish, intent, {
      total,
      intentCoherence,
      timeScore,
      budgetScore,
      nutritionScore,
      plaisirScore,
      totalTime,
      budgetLevel,
      proteinLevel,
      visualImpact,
    }),
  };
}

function buildExplanation(
  dish: DishProfile,
  intent: ParsedIntent,
  scores: {
    total: number;
    intentCoherence: number;
    timeScore: number;
    budgetScore: number;
    nutritionScore: number;
    plaisirScore: number;
    totalTime: number;
    budgetLevel: number;
    proteinLevel: number;
    visualImpact: number;
  }
): string {
  const parts: string[] = [];

  parts.push(`${dish.desireName} → score ${scores.total}/120 pour "${intent.goal}"`);

  if (intent.goal === "speed") {
    parts.push(`Temps: ${scores.totalTime} min (${intent.constraints.maxTotalMinutes ? `max ${intent.constraints.maxTotalMinutes}` : "sans limite"})`);
  }
  if (intent.goal === "budget") {
    parts.push(`Budget: niveau ${scores.budgetLevel}/3 (${scores.budgetLevel === 1 ? "économique" : scores.budgetLevel === 2 ? "moyen" : "élevé"})`);
  }
  if (intent.goal === "protein") {
    parts.push(`Protéines: niveau ${scores.proteinLevel}/3 (${scores.proteinLevel >= 3 ? "élevé" : scores.proteinLevel >= 2 ? "moyen" : "faible"})`);
  }
  if (intent.goal === "impress") {
    parts.push(`Impact visuel: ${scores.visualImpact}/3`);
  }

  const p = dish.plaisir;
  const plaisirLabel = p.gourmandise >= 4 && p.visuel >= 4 ? "🔥 Premium" : p.gourmandise >= 3 ? "✨ Appétissant" : "📋 Classique";
  parts.push(`Plaisir: ${scores.plaisirScore}/20 ${plaisirLabel}`);

  return parts.join(" | ");
}

/**
 * Données brutes d'estimation pour affichage
 */
export function getDishEstimates(dish: DishProfile) {
  return {
    totalTime: estimateTotalTime(dish),
    budgetLevel: estimateBudgetLevel(dish),
    proteinLevel: estimateProteinLevel(dish),
    visualImpact: estimateVisualImpact(dish),
    plaisirScore: calculatePlaisirScore(dish),
    premiumTier: dish.premiumTier,
  };
}
