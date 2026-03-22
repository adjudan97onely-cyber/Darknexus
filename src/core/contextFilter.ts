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

    // Pre-filter: exclure les accompagnements (sauce, condiment) sauf requête explicite
    const nonStandaloneFamilies = ["sauce", "condiment", "accompagnement"];
    if (nonStandaloneFamilies.includes(dish.family) && !intent.rawQuery.toLowerCase().includes("sauce")) {
      continue;
    }

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

  // Tiebreaker: mélanger les plats de même score pour éviter biais d'ordre
  shuffleTiedScores(scored);

  // Assigner les rangs
  scored.forEach((item, idx) => (item.rank = idx + 1));

  // Diversifier: pas 2 plats identiques de même famille
  const diversified = diversifyResults(scored, maxResults, intent.constraints.preferredCuisine);

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
 * Mélange les plats ayant le même score pour éviter le biais d'ordre du tableau.
 * Fisher-Yates partiel sur les groupes de même score.
 */
function shuffleTiedScores(arr: FilteredDish[]): void {
  let i = 0;
  while (i < arr.length) {
    let j = i;
    while (j < arr.length && arr[j].score.total === arr[i].score.total) j++;
    // Shuffle arr[i..j-1]
    for (let k = j - 1; k > i; k--) {
      const r = i + Math.floor(Math.random() * (k - i + 1));
      [arr[k], arr[r]] = [arr[r], arr[k]];
    }
    i = j;
  }
}

/**
 * Mix intelligent des résultats: assure une diversité de niveaux premium.
 * Cible optimale par set de 5: 1 essentiel + 2 classiques + 1 signature + 1 meilleur score
 * Diversifie aussi par famille et cuisine.
 */
function diversifyResults(
  sorted: FilteredDish[],
  maxResults: number,
  preferredCuisine?: string
): FilteredDish[] {
  const result: FilteredDish[] = [];
  const usedFamilies = new Set<string>();
  const cuisineCount = new Map<string, number>();
  const MAX_PER_CUISINE = preferredCuisine ? 99 : 2;
  const MAX_OTHER_CUISINE = 2;

  // Séparer par premiumTier
  const signatures = sorted.filter((d) => d.dish.premiumTier === "signature");
  const classiques = sorted.filter((d) => d.dish.premiumTier === "classique");
  const essentiels = sorted.filter((d) => d.dish.premiumTier === "essentiel");

  const canAdd = (item: FilteredDish): boolean => {
    const family = item.dish.family;
    const cuisine = item.dish.cuisine;
    const count = cuisineCount.get(cuisine) || 0;
    const limit = (preferredCuisine && cuisine.toLowerCase() === preferredCuisine.toLowerCase())
      ? MAX_PER_CUISINE : MAX_OTHER_CUISINE;
    return !usedFamilies.has(family) && count < limit;
  };

  const add = (item: FilteredDish): boolean => {
    if (!canAdd(item)) return false;
    result.push(item);
    usedFamilies.add(item.dish.family);
    cuisineCount.set(item.dish.cuisine, (cuisineCount.get(item.dish.cuisine) || 0) + 1);
    return true;
  };

  // 1. Garantir au moins 1 signature (WOW) si possible
  for (const s of signatures) {
    if (result.length >= 1) break;
    add(s);
  }

  // 2. Ajouter 1 essentiel (simple)
  for (const e of essentiels) {
    if (result.filter((r) => r.dish.premiumTier === "essentiel").length >= 1) break;
    add(e);
  }

  // 3. Remplir avec classiques (équilibré)
  for (const c of classiques) {
    if (result.length >= maxResults - 1) break;
    add(c);
  }

  // 4. Compléter avec les meilleurs scores restants (mix libre)
  for (const item of sorted) {
    if (result.length >= maxResults) break;
    if (result.includes(item)) continue;
    add(item);
  }

  // 5. Si pas assez, relâcher contrainte famille
  if (result.length < maxResults) {
    for (const item of sorted) {
      if (result.length >= maxResults) break;
      if (!result.includes(item)) {
        result.push(item);
      }
    }
  }

  // Re-trier par score pour affichage cohérent
  result.sort((a, b) => b.score.total - a.score.total);

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
  plaisirLabel: string;
  premiumLabel: string;
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

  const p = dish.plaisir;
  const plaisirAvg = (p.gourmandise + p.texture + p.visuel + p.arome) / 4;
  const plaisirLabel = plaisirAvg >= 4.5 ? "🔥 Irrésistible" : plaisirAvg >= 3.5 ? "✨ Appétissant" : plaisirAvg >= 2.5 ? "👍 Correct" : "📋 Basique";

  const premiumLabels: Record<string, string> = {
    signature: "⭐ Signature",
    classique: "🍽️ Classique",
    essentiel: "📌 Essentiel",
  };

  return {
    whyMatch: whyParts.join(" — "),
    coherenceLabel: coherenceLabels[intent.goal] || "Polyvalent",
    nutritionLabel: `Protéines: ${proteinLabels[estimates.proteinLevel - 1]}`,
    timeLabel: timeStr,
    budgetLabel: budgetLabels[estimates.budgetLevel - 1],
    scoreDisplay: `${score.total}/120`,
    plaisirLabel,
    premiumLabel: premiumLabels[dish.premiumTier] || dish.premiumTier,
  };
}
