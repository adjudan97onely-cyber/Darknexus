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
  const expensive = ["boeuf", "crabe", "crustace", "sole", "safran", "vin-rouge", "champignon"];
  const cheap = ["farine", "oeuf", "oignon", "tomate", "riz", "pomme-terre", "levure", "ail"];

  let expensiveCount = 0;
  let cheapCount = 0;

  for (const fam of dish.baseFamilies) {
    const f = fam.toLowerCase();
    if (expensive.some((e) => f.includes(e))) expensiveCount++;
    if (cheap.some((c) => f.includes(c))) cheapCount++;
  }

  if (expensiveCount >= 2) return 3;
  if (expensiveCount >= 1 && cheapCount < 2) return 2;
  return 1;
}

/** Niveau protéine estimé 1-3 basé sur les ingredients */
function estimateProteinLevel(dish: DishProfile): 1 | 2 | 3 {
  const highProtein = ["poulet", "boeuf", "poisson", "crevette", "crabe", "morue", "sole", "tofu", "oeuf"];
  const medProtein = ["fromage", "creme", "lait", "quinoa"];

  const families = dish.baseFamilies.map((f) => f.toLowerCase());
  const highCount = families.filter((f) => highProtein.some((hp) => f.includes(hp))).length;
  const medCount = families.filter((f) => medProtein.some((mp) => f.includes(mp))).length;

  if (highCount >= 2) return 3;
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

// ==========================================
// SCORING CONTEXTUEL
// ==========================================

export interface ContextScore {
  total: number; // 0-100
  intentCoherence: number; // 0-40 — Cohérence avec intention
  timeScore: number; // 0-20 — Respect contrainte temps
  budgetScore: number; // 0-20 — Respect contrainte budget
  nutritionScore: number; // 0-20 — Respect contrainte nutrition
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
      // Haute difficulté / cuisine exotique = plus de découverte
      const exoticCuisines = ["antillaise", "thaï", "indienne"];
      const isExotic = exoticCuisines.includes(dish.cuisine.toLowerCase());
      intentCoherence = isExotic ? 35 : dish.difficulty >= 3 ? 25 : 15;
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

  const total = intentCoherence + timeScore + budgetScore + nutritionScore;
  const rejected = rejectReason != null || total < REJECTION_THRESHOLD;

  return {
    total,
    intentCoherence,
    timeScore,
    budgetScore,
    nutritionScore,
    rejected,
    rejectReason: rejected ? rejectReason || `Score ${total} < seuil ${REJECTION_THRESHOLD}` : undefined,
    explanation: buildExplanation(dish, intent, {
      total,
      intentCoherence,
      timeScore,
      budgetScore,
      nutritionScore,
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
    totalTime: number;
    budgetLevel: number;
    proteinLevel: number;
    visualImpact: number;
  }
): string {
  const parts: string[] = [];

  parts.push(`${dish.name} → score ${scores.total}/100 pour "${intent.goal}"`);

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
  };
}
