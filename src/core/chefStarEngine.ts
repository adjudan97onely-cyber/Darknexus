/**
 * Moteur Chef Étoilé (Niveau 10)
 * Sélection de vrais plats + adaptation intelligente
 * Remplace la génération pure ingrédients
 */

import { ChefLevel, DEFAULT_CHEF_LEVEL, getLevelCapabilities } from "./chefLevel";
import {
  DishProfile,
  canCookRecipe,
  getDish,
  getDishFundamentals,
  getDishMistakes,
  getDishSignature,
  getDishTips,
  findDishesByChefLevel,
  findDishesBySlot,
  searchDishes,
} from "./dishKnowledge";
import {
  CookingTechnique,
  scaleHeatIntensity,
  scaleTimingByPortions,
  getTechniqueProfTip,
  getTechniqueRisk,
  TECHNIQUE_SPECS,
} from "./professionalTechniques";
import { EngineRecipe, MealSlot } from "./foodRules";
import { normalize } from "./foodRules";
import { parseIntent, ParsedIntent, intentSummary } from "./intentParser";
import { filterByIntent, FilterResult, buildValidationMeta } from "./contextFilter";
import { scoreDish, ContextScore } from "./contextScorer";

interface ChefStarOptions {
  chefLevel?: ChefLevel;
  cuisine?: string;
  slot?: MealSlot;
  servings?: number;
  preferredDishes?: string[]; // IDs de plats préférés
  availableIngredients?: string[];
  query?: string; // requête textuelle pour matching direct + intent parsing
}

/** Recette avec métadonnées de validation contextuelle */
export interface ContextValidation {
  intent: ParsedIntent;
  contextScore: ContextScore;
  whyMatch: string;
  coherenceLabel: string;
  nutritionLabel: string;
  timeLabel: string;
  budgetLabel: string;
  scoreDisplay: string;
  intentSummary: string;
  plaisirLabel: string;
  premiumLabel: string;
}

interface AdaptedDish extends EngineRecipe {
  dishId: string;
  dishProfile: DishProfile;
  adaptedTiming: {
    prep: number;
    cook: number;
    rest?: number;
    total: number;
  };
  portionRatio: number;
  techniques: {
    name: CookingTechnique;
    timing: number;
    temperature?: { low: number; high: number; exact?: number };
    tips: string[];
    risks: string[];
  }[];
  fundamentals: string[];
  signature: string;
  contextValidation?: ContextValidation;
}

/**
 * Sélectionner un vrai plat basé sur contexte
 */
export function selectBestDish(
  options: ChefStarOptions = {}
): DishProfile | undefined {
  const chefLevel = options.chefLevel || DEFAULT_CHEF_LEVEL;
  const slot = options.slot || "lunch";
  const cuisine = options.cuisine || "all";

  // 1. Filter par niveau & slot
  let candidates = findDishesByChefLevel(1, chefLevel);
  candidates = candidates.filter((dish) => dish.slot === slot);

  // 2. Filter par cuisine si specifié
  if (cuisine !== "all") {
    const cuisineMatches = candidates.filter(
      (dish) => normalize(dish.cuisine) === normalize(cuisine)
    );
    if (cuisineMatches.length > 0) {
      candidates = cuisineMatches;
    }
  }

  // 3. Chercher ingrédients compatibles
  if (options.availableIngredients && options.availableIngredients.length > 0) {
    const scored = candidates.map((dish) => {
      const matches = dish.baseFamilies.filter((family) =>
        options.availableIngredients!.some(
          (ingredient) =>
            normalize(ingredient).includes(normalize(family)) ||
            normalize(family).includes(normalize(ingredient))
        )
      ).length;
      return { dish, matches };
    });
    scored.sort((a, b) => b.matches - a.matches);
    candidates = scored.slice(0, Math.max(5, Math.ceil(scored.length * 0.5))).map((s) => s.dish);
  }

  // 4. Appliquer préférences utilisateur
  if (options.preferredDishes && options.preferredDishes.length > 0) {
    const preferred = candidates.filter((dish) =>
      options.preferredDishes!.includes(dish.id)
    );
    if (preferred.length > 0) return preferred[0];
  }

  // 5. Retourner le top candidate
  if (candidates.length === 0) return undefined;

  // Prioriser difficulté moderate pour éviter trop facile ou trop complexe
  const mediumDifficulty = candidates.filter((d) => d.difficulty >= 2 && d.difficulty <= 4);
  return mediumDifficulty.length > 0 ? mediumDifficulty[0] : candidates[0];
}

/**
 * Adapter timing aux portions
 */
export function adaptTimingToPortions(
  dish: DishProfile,
  fromServings: number,
  toServings: number,
  chefLevel: ChefLevel
): { prep: number; cook: number; rest?: number; total: number } {
  const caps = getLevelCapabilities(chefLevel);
  const ratio = toServings / fromServings;

  const prepAdapted = scaleTimingByPortions(
    dish.timings.prep,
    "linear",
    fromServings,
    toServings
  );

  const cookAdapted = scaleTimingByPortions(
    dish.timings.cook,
    dish.portionAdaptation,
    fromServings,
    toServings
  );

  const restAdapted = dish.timings.rest
    ? scaleTimingByPortions(
        dish.timings.rest,
        "linear",
        fromServings,
        toServings
      )
    : undefined;

  const total = prepAdapted + cookAdapted + (restAdapted || 0);

  return {
    prep: prepAdapted,
    cook: cookAdapted,
    rest: restAdapted,
    total,
  };
}

/**
 * Construire recette adaptée avec details pro
 */
export function buildAdaptedRecipe(
  dish: DishProfile,
  chefLevel: ChefLevel = DEFAULT_CHEF_LEVEL,
  toServings: number = 2
): AdaptedDish {
  const caps = getLevelCapabilities(chefLevel);
  const adaptedTiming = adaptTimingToPortions(
    dish,
    dish.servings,
    toServings,
    chefLevel
  );
  const ratio = toServings / dish.servings;

  // Construire les techniques
  const techniques = [
    {
      name: dish.technique as CookingTechnique,
      timing: adaptedTiming.cook,
      heatIntensity: scaleHeatIntensity(
        TECHNIQUE_SPECS[dish.technique as CookingTechnique]?.heatLevel ||
          "medium",
        ratio
      ),
      tips: [getTechniqueProfTip(dish.technique as CookingTechnique, chefLevel)],
      risks: [getTechniqueRisk(dish.technique as CookingTechnique, chefLevel)],
    },
  ];

  // Adapter ingrédients aux portions
  const ingredientsAdapted = dish.baseFamilies.map((family) => ({
    name: family,
    quantity: Math.round(100 * ratio) / 100,
    unit: "unit", // Simplifié pour base
  }));

  // Construire étapes avec details pro
  const stepsBasic = [
    `Préparation: ${adaptedTiming.prep} min (mise en place des ingrédients)`,
    `Technique: ${dish.technique} (${adaptedTiming.cook} min)`,
  ];

  const steps = chefLevel >= 8
    ? [
        ...stepsBasic,
        ...dish.profTips.slice(0, 2),
        `Finition et vérification`,
      ]
    : [
        ...stepsBasic,
        ...dish.profTips.slice(0, 1),
        `Servir immédiatement selon préparation`,
      ];

  const recipe: AdaptedDish = {
    id: `chef-star-${dish.id}-${toServings}`,
    name: `${dish.name} (Chef Étoilé - ${toServings} pers.)`,
    source: "chef-star-knowledge",
    cuisine: dish.cuisine as any,
    mode: "chef",
    style: caps.platingStandard,
    dishType: dish.family,
    difficulty: `${dish.difficulty}/5`,
    prepMinutes: adaptedTiming.prep,
    cookMinutes: adaptedTiming.cook,
    restMinutes: adaptedTiming.rest,
    servings: toServings,
    ingredientsDetailed: ingredientsAdapted as any,
    ingredients: ingredientsAdapted.map((item) => item.name),
    steps,
    tags: [
      dish.cuisine,
      dish.family,
      `level${chefLevel}`,
      `${toServings}pers`,
    ],
    tips: dish.profTips,
    mistakes: dish.mistakes,
    slotHints: [dish.slot],
    nutrition: {
      kcal: 550,
      protein: 25,
      carbs: 45,
      fat: 24,
    }, // Simplifié
    imagePrompt: `${dish.name}, professional plating, chef level ${chefLevel}, ${dish.region}`,
    score: 95,
    matchReason: `Chef Expert: sélection vraie recette ${dish.name} - ${dish.fundamentals.join(" • ")}`,
    blueprintKey: `chef-star-${dish.id}`,
    cookingMethod: dish.technique as any,
    proteinFamily: "premium",
    primaryProtein: dish.baseFamilies[0],
    dishFamily: dish.family,
    flavorBalance: {
      score: 90,
      balance: ["acid", "fat", "fresh"],
      missing: [],
      notes: dish.fundamentals,
    },
    // Chef Star spécifiques
    dishId: dish.id,
    dishProfile: dish,
    adaptedTiming,
    portionRatio: ratio,
    techniques: techniques as any,
    fundamentals: dish.fundamentals,
    signature: dish.signature,
  };

  return recipe;
}

/**
 * Interface principale: générer recettes chef étoilé
 * CONTEXT INTELLIGENCE ENGINE: sélection basée sur l'intention utilisateur
 * 
 * Flux:
 * 1. Parse intent de la query ("repas muscu" → protein)
 * 2. Si query matche un plat exact → le retourner (priorité)
 * 3. Sinon: filtrer TOUS les plats par intent + scorer
 * 4. Rejeter les incohérents (score < seuil)
 * 5. Retourner les meilleurs avec métadonnées de validation
 */
export function generateChefStarRecipes(
  options: ChefStarOptions = {}
): AdaptedDish[] {
  const chefLevel = options.chefLevel || DEFAULT_CHEF_LEVEL;
  const servings = Math.max(1, options.servings || 2);
  const query = options.query || "";

  // ═══════════ ÉTAPE 1: PARSER L'INTENTION ═══════════
  const intent = parseIntent(query);

  // ═══════════ ÉTAPE 2: MATCH EXACT PAR NOM ═══════════
  // Si l'user demande "bokit" ou "colombo" → on le sert directement
  if (query.trim().length > 0) {
    const directMatches = searchDishes(query);
    if (directMatches.length > 0) {
      const validMatches = directMatches.filter((d) => canCookRecipe(d.id, chefLevel));
      if (validMatches.length > 0) {
        // Même pour un match direct, on calcule le context score
        return validMatches.slice(0, 3).map((dish) => {
          const recipe = buildAdaptedRecipe(dish, chefLevel, servings);
          const ctxScore = scoreDish(dish, intent);
          const meta = buildValidationMeta(dish, intent, ctxScore);
          recipe.contextValidation = {
            intent,
            contextScore: ctxScore,
            ...meta,
            intentSummary: intentSummary(intent),
          };
          return recipe;
        });
      }
    }
  }

  // ═══════════ ÉTAPE 3: FILTRAGE PAR INTENTION ═══════════
  // C'est ici que la magie opère: on filtre TOUTE la base
  // par cohérence avec l'intention détectée
  const filterResult = filterByIntent(intent, {
    maxResults: 5,
    chefLevel,
  });

  if (filterResult.accepted.length > 0) {
    return filterResult.accepted.map((filtered) => {
      const recipe = buildAdaptedRecipe(filtered.dish, chefLevel, servings);
      const meta = buildValidationMeta(filtered.dish, intent, filtered.score);
      recipe.contextValidation = {
        intent,
        contextScore: filtered.score,
        ...meta,
        intentSummary: intentSummary(intent),
      };
      // Override le score de base avec le context score
      recipe.score = filtered.score.total;
      recipe.matchReason = `[${intentSummary(intent)}] ${meta.whyMatch}`;
      return recipe;
    });
  }

  // ═══════════ ÉTAPE 4: FALLBACK LEGACY ═══════════
  // Si aucun plat ne passe le filtre intent, fallback slot+cuisine
  let candidates = findDishesByChefLevel(1, chefLevel);
  const slot = options.slot || "lunch";
  let slotMatches = candidates.filter((dish) => dish.slot === slot);

  if (options.cuisine && options.cuisine !== "all") {
    const cuisineMatches = slotMatches.filter(
      (dish) => normalize(dish.cuisine) === normalize(options.cuisine!)
    );
    if (cuisineMatches.length > 0) slotMatches = cuisineMatches;
  }

  if (slotMatches.length === 0) slotMatches = candidates;

  // Prendre les 3 premiers avec validation context minimale
  return slotMatches.slice(0, 3).map((dish) => {
    const recipe = buildAdaptedRecipe(dish, chefLevel, servings);
    const ctxScore = scoreDish(dish, intent);
    const meta = buildValidationMeta(dish, intent, ctxScore);
    recipe.contextValidation = {
      intent,
      contextScore: ctxScore,
      ...meta,
      intentSummary: intentSummary(intent),
    };
    return recipe;
  });
}

/**
 * Recherche par nom - plat exact
 */
export function findDishByName(query: string): DishProfile | undefined {
  const results = searchDishes(query);
  return results.length > 0 ? results[0] : undefined;
}

/**
 * Obtenir une recette chef star complète par plat
 */
export function recipeForDishId(
  dishId: string,
  chefLevel: ChefLevel = DEFAULT_CHEF_LEVEL,
  servings: number = 2
): AdaptedDish | undefined {
  const dish = getDish(dishId);
  if (!dish) return undefined;
  if (!canCookRecipe(dishId, chefLevel)) return undefined;
  return buildAdaptedRecipe(dish, chefLevel, servings);
}
