/**
 * CONTEXT INTELLIGENCE ENGINE — Module 3: Context Filter
 * Filtre les plats AVANT génération.
 * Élimine les incohérents, trie par score, retourne les meilleurs.
 */

import { DishProfile, getDishes } from "./dishKnowledge";
import { ParsedIntent } from "./intentParser";
import { scoreDish, ContextScore, getDishEstimates } from "./contextScorer";

export interface FilteredDish {
  dish: DishProfile;
  score: ContextScore;
  rank: number;
}

export interface FilterResult {
  accepted: FilteredDish[];
  rejected: FilteredDish[];
  intent: ParsedIntent;
  stats: {
    totalCandidates: number;
    accepted: number;
    rejected: number;
    topScore: number;
    avgScore: number;
  };
}

/**
 * Filtre TOUS les plats de la base par rapport à l'intention.
 * Retourne les plats compatibles triés par score décroissant.
 */
export function filterByIntent(
  intent: ParsedIntent,
  options: { maxResults?: number; chefLevel?: number } = {}
): FilterResult {
  const allDishes = getDishes();
  const maxResults = options.maxResults || 5;
  const chefLevel = options.chefLevel || 10;

  const scored: FilteredDish[] = [];
  const rejected: FilteredDish[] = [];

  for (const dish of allDishes) {
    // Pre-filter: chef level
    if (dish.minChefLevel > chefLevel) continue;

    const score = scoreDish(dish, intent);
    const entry: FilteredDish = { dish, score, rank: 0 };

    if (score.rejected) {
      rejected.push(entry);
    } else {
      scored.push(entry);
    }
  }

  // Tri par score décroissant
  scored.sort((a, b) => b.score.total - a.score.total);

  // Assigner les rangs
  scored.forEach((item, idx) => (item.rank = idx + 1));

  // Diversifier: pas 2 plats identiques de même famille
  const diversified = diversifyResults(scored, maxResults);

  const accepted = diversified.slice(0, maxResults);
  const topScore = accepted.length > 0 ? accepted[0].score.total : 0;
  const avgScore =
    accepted.length > 0
      ? Math.round(accepted.reduce((sum, d) => sum + d.score.total, 0) / accepted.length)
      : 0;

  return {
    accepted,
    rejected,
    intent,
    stats: {
      totalCandidates: allDishes.length,
      accepted: accepted.length,
      rejected: rejected.length,
      topScore,
      avgScore,
    },
  };
}

/**
 * Diversifie les résultats: max 1 plat par famille culinaire
 * pour éviter "3 plats en sauce" ou "3 fritures"
 */
function diversifyResults(
  sorted: FilteredDish[],
  maxResults: number
): FilteredDish[] {
  const result: FilteredDish[] = [];
  const usedFamilies = new Set<string>();
  const usedCuisines = new Set<string>();

  // Premier pass: 1 plat par famille
  for (const item of sorted) {
    if (result.length >= maxResults) break;
    const family = item.dish.family;

    if (!usedFamilies.has(family)) {
      result.push(item);
      usedFamilies.add(family);
      usedCuisines.add(item.dish.cuisine);
    }
  }

  // Si pas assez, 2e pass: autoriser même famille mais cuisine diff
  if (result.length < maxResults) {
    for (const item of sorted) {
      if (result.length >= maxResults) break;
      if (result.includes(item)) continue;
      if (!usedCuisines.has(item.dish.cuisine) || result.length < 3) {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Métadonnées de validation pour affichage utilisateur.
 * Explique POURQUOI cette recette correspond à la demande.
 */
export function buildValidationMeta(
  dish: DishProfile,
  intent: ParsedIntent,
  score: ContextScore
): {
  whyMatch: string;
  coherenceLabel: string;
  nutritionLabel: string;
  timeLabel: string;
  budgetLabel: string;
  scoreDisplay: string;
} {
  const estimates = getDishEstimates(dish);

  const coherenceLabels: Record<string, string> = {
    protein: estimates.proteinLevel >= 3 ? "Riche en protéines" : "Protéines modérées",
    budget: estimates.budgetLevel === 1 ? "Très économique" : "Prix moyen",
    speed: `${estimates.totalTime} min total`,
    impress: estimates.visualImpact >= 3 ? "Spectaculaire" : "Bonne présentation",
    light: "Repas léger",
    comfort: "Réconfortant",
    discovery: "Original / Exotique",
    general: "Polyvalent",
  };

  const whyParts: string[] = [];
  if (intent.goal === "protein" && estimates.proteinLevel >= 2) {
    whyParts.push(`Ingrédients riches: ${dish.baseFamilies.filter((f) => ["poulet", "boeuf", "poisson", "crevette", "oeuf", "morue"].some((p) => f.includes(p))).join(", ")}`);
  }
  if (intent.goal === "budget" && estimates.budgetLevel <= 1) {
    whyParts.push(`Ingrédients économiques: ${dish.baseFamilies.join(", ")}`);
  }
  if (intent.goal === "speed") {
    whyParts.push(`Temps total: ${estimates.totalTime} min (prep ${dish.timings.prep} + cook ${dish.timings.cook})`);
  }
  if (intent.goal === "impress") {
    whyParts.push(`Technique: ${dish.technique}, difficulté ${dish.difficulty}/5`);
  }
  whyParts.push(dish.signature);

  const proteinLabels = ["Faible", "Moyen", "Élevé"];
  const budgetLabels = ["Économique", "Moyen", "Premium"];
  const timeStr =
    estimates.totalTime <= 20
      ? `${estimates.totalTime} min ⚡`
      : estimates.totalTime <= 40
        ? `${estimates.totalTime} min`
        : `${estimates.totalTime} min 🕐`;

  return {
    whyMatch: whyParts.join(" — "),
    coherenceLabel: coherenceLabels[intent.goal] || "Polyvalent",
    nutritionLabel: `Protéines: ${proteinLabels[estimates.proteinLevel - 1]}`,
    timeLabel: timeStr,
    budgetLabel: budgetLabels[estimates.budgetLevel - 1],
    scoreDisplay: `${score.total}/100`,
  };
}
