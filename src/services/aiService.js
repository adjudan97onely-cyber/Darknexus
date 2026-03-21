import {
  CUISINE_MODES,
  formatIngredientLine,
  generateRecipeCandidates,
  scaleRecipeForServings,
} from "../core/recipeEngine";
import { normalizeUserProfile, recipeBlockedByProfile } from "../core/userProfile";
import { getUserProfile } from "./userProfileService";
import { applyAdminControls, recordGeneratedRecipes } from "./adminContentService";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toIngredients(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((item) => normalize(typeof item === "string" ? item : item?.name)).filter(Boolean))];
  }
  if (!input) return [];
  return [...new Set(String(input).split(/[,+;/\n]+/).map((value) => normalize(value)).filter(Boolean))];
}

function inferCuisine(query) {
  const q = normalize(query);
  if (q.includes("antill")) return "antillaise";
  if (q.includes("healthy") || q.includes("leger")) return "healthy";
  if (q.includes("rapide") || q.includes("express")) return "rapide";
  if (q.includes("franc")) return "francaise";
  if (q.includes("monde") || q.includes("fusion")) return "monde";
  return "all";
}

function inferSlot(query) {
  const q = normalize(query);
  if (q.includes("soir") || q.includes("diner")) return "dinner";
  if (q.includes("matin") || q.includes("petit")) return "breakfast";
  if (q.includes("collation") || q.includes("snack")) return "snack";
  return "lunch";
}

function inferServings(query) {
  const match = String(query || "").match(/(\d+)\s*personne/i);
  return match ? Number(match[1]) : 2;
}

function diversify(recipes) {
  const grouped = [...recipes].reduce((acc, recipe) => {
    const key = recipe.blueprintKey || "default";
    if (!acc[key]) acc[key] = [];
    acc[key].push(recipe);
    return acc;
  }, {});

  Object.values(grouped).forEach((group) => group.sort((a, b) => (b.score || 0) - (a.score || 0)));

  const result = [];
  let index = 0;
  const keys = Object.keys(grouped);
  while (keys.some((key) => grouped[key][index])) {
    keys.forEach((key) => {
      if (grouped[key][index]) result.push(grouped[key][index]);
    });
    index += 1;
  }

  return result;
}

function totalTime(recipe) {
  return (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) + (recipe.restMinutes || 0);
}

function nutritionScore(recipe, profile) {
  const kcal = recipe?.nutrition?.kcal || 0;
  const protein = recipe?.nutrition?.protein || 0;
  if (profile.goal === "lose") {
    const kcalScore = kcal <= 560 ? 92 : kcal <= 700 ? 70 : 40;
    return Math.round((kcalScore * 0.55) + Math.min(100, protein * 2) * 0.45);
  }
  if (profile.goal === "gain") {
    const kcalScore = kcal >= 600 && kcal <= 900 ? 90 : kcal >= 480 ? 74 : 50;
    return Math.round((kcalScore * 0.45) + Math.min(100, protein * 2.2) * 0.55);
  }
  const balanced = kcal >= 420 && kcal <= 760 ? 88 : 68;
  return Math.round((balanced * 0.6) + Math.min(100, protein * 1.8) * 0.4);
}

function speedScore(recipe) {
  const time = totalTime(recipe);
  if (time <= 20) return 98;
  if (time <= 30) return 86;
  if (time <= 45) return 70;
  return 52;
}

function complexityScore(recipe) {
  const difficulty = String(recipe?.difficulty || "Facile").toLowerCase();
  const stepCount = recipe?.steps?.length || 0;
  if (difficulty.includes("facile")) return stepCount <= 5 ? 92 : 84;
  if (difficulty.includes("inter")) return stepCount <= 6 ? 76 : 68;
  return 58;
}

function userFitScore(recipe, profile) {
  let score = 70;
  const time = totalTime(recipe);
  const style = String(recipe?.style || "").toLowerCase();
  const tags = (recipe?.tags || []).map((item) => String(item).toLowerCase());
  const ingredients = recipe?.ingredients || [];

  if (recipeBlockedByProfile(ingredients, profile)) return 0;
  if (profile.preferences.includes("healthy") && (recipe.nutrition?.kcal || 0) <= 620) score += 12;
  if (profile.preferences.includes("rapide") && time <= 25) score += 14;
  if (profile.preferences.includes("gourmand") && (style.includes("gastro") || style.includes("bistrot") || tags.includes("bake"))) score += 10;
  if (profile.goal === "lose" && recipe.nutrition?.kcal <= 560) score += 10;
  if (profile.goal === "gain" && recipe.nutrition?.protein >= 28) score += 10;
  return Math.max(0, Math.min(100, score));
}

function describeRecipe(recipe, profile) {
  const time = totalTime(recipe);
  const goalLine = profile.goal === "lose"
    ? "oriente vers un repas maitrise et rassasiant"
    : profile.goal === "gain"
      ? "oriente vers un apport proteine plus soutenu"
      : "equilibre pour un quotidien regulier";
  return `${recipe.name} : ${recipe.style}, ${time} min, ${goalLine}. Texture ${recipe.cookingMethod}, ${recipe.nutrition.kcal} kcal.`;
}

function buildVariants(recipe, profile) {
  const variants = [];
  if (recipe.cuisine !== "healthy") variants.push(`Version healthy de ${recipe.name}`);
  if (!profile.preferences.includes("rapide") && totalTime(recipe) > 25) variants.push(`Version rapide de ${recipe.name}`);
  if (recipe.cuisine !== "antillaise") variants.push(`Variation antillaise de ${recipe.name}`);
  return variants.slice(0, 3);
}

function buildSwaps(recipe, profile) {
  const swaps = [];
  if ((recipe?.ingredients || []).some((item) => String(item).includes("poulet"))) swaps.push("Poulet -> dinde ou tofu");
  if ((recipe?.ingredients || []).some((item) => String(item).includes("creme"))) swaps.push("Creme -> yaourt ou lait de coco leger");
  if (profile.goal === "lose" && (recipe?.ingredients || []).some((item) => String(item).includes("riz"))) swaps.push("Riz -> quinoa ou portion reduite");
  return swaps.slice(0, 3);
}

function attachAlternatives(recipes) {
  return recipes.map((recipe, index) => ({
    ...recipe,
    alternatives: recipes.filter((_, altIndex) => altIndex !== index).slice(0, 3).map((item) => item.name),
  }));
}

function enrichRecipe(recipe, profile) {
  const scores = {
    nutrition: nutritionScore(recipe, profile),
    speed: speedScore(recipe),
    complexity: complexityScore(recipe),
    userFit: userFitScore(recipe, profile),
  };
  const total = Math.round(scores.nutrition * 0.32 + scores.speed * 0.18 + scores.complexity * 0.14 + scores.userFit * 0.36);
  return {
    ...recipe,
    score: total,
    scores,
    description: describeRecipe(recipe, profile),
    variants: buildVariants(recipe, profile),
    substitutions: buildSwaps(recipe, profile),
    premiumHint: `Tu peux aussi faire ${buildVariants(recipe, profile)[0] || recipe.name}.`,
  };
}

function personalizeRecipes(recipes, profile) {
  const normalizedProfile = normalizeUserProfile(profile || getUserProfile());
  const filtered = recipes.filter((recipe) => !recipeBlockedByProfile(recipe.ingredients || [], normalizedProfile));
  const enriched = filtered.map((recipe) => enrichRecipe(recipe, normalizedProfile));
  return attachAlternatives(enriched).sort((a, b) => (b.score || 0) - (a.score || 0));
}

export { CUISINE_MODES, formatIngredientLine, scaleRecipeForServings };

export function generateDynamicRecipesFromIngredients(ingredients, options = {}) {
  const generated = personalizeRecipes(diversify(
    generateRecipeCandidates(toIngredients(ingredients), {
      cuisine: options.cuisine || "all",
      mode: options.mode || "normal",
      slot: options.slot || "lunch",
      servings: options.servings || 2,
      limit: options.limit || 12,
    })
  ), options.userProfile);

  const withAdminLayer = applyAdminControls(generated, {
    ingredients: toIngredients(ingredients),
    cuisine: options.cuisine || "all",
  });
  recordGeneratedRecipes(generated);
  return withAdminLayer;
}

export function recommendRecipesFromIngredients(ingredients, limit = 12, options = {}) {
  return generateDynamicRecipesFromIngredients(ingredients, {
    cuisine: options.cuisine || "all",
    mode: options.mode || "normal",
    slot: options.slot || "lunch",
    servings: options.servings || 2,
    limit: Math.max(8, Number(limit) || 12),
    userProfile: options.userProfile,
  });
}

export function surpriseBalancedRecipe() {
  const pools = [
    ["oeuf", "epinards", "tomate", "oignon"],
    ["poisson", "citron", "carotte", "oignon"],
    ["poulet", "quinoa", "brocoli", "avocat"],
    ["tofu", "brocoli", "courgette", "ail"],
  ];
  const index = new Date().getMinutes() % pools.length;
  return generateRecipeCandidates(pools[index], {
    cuisine: index % 2 === 0 ? "healthy" : "monde",
    mode: "chef",
    slot: "dinner",
    servings: 2,
    limit: 1,
  })[0];
}

export function smartSearchRecipes(query) {
  const q = normalize(query);
  if (!q) return recommendRecipesFromIngredients(["oeuf", "tomate", "oignon", "poulet"], 20, { cuisine: "all" });

  const generated = personalizeRecipes(diversify(
    generateRecipeCandidates(q.split(/\s+/).filter(Boolean), {
      cuisine: inferCuisine(q),
      slot: inferSlot(q),
      servings: inferServings(q),
      mode: q.includes("chef") ? "chef" : "normal",
      limit: 20,
    })
  ));

  const withAdminLayer = applyAdminControls(generated, {
    ingredients: q.split(/\s+/).filter(Boolean),
    cuisine: inferCuisine(q),
    query,
  });
  recordGeneratedRecipes(generated);
  return withAdminLayer;
}

export async function askCookingAssistant(question, context = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const lower = normalize(question);
  const ingredients = toIngredients(context.ingredients || []);
  const userProfile = normalizeUserProfile(context.userProfile || getUserProfile());

  if (lower.includes("surprend") || lower.includes("surprise")) {
    const pick = personalizeRecipes([surpriseBalancedRecipe()], userProfile)[0];
    return {
      title: "Mode surprise dynamique",
      answer: `Je compose ${pick.name}. ${pick.description} Tu peux aussi faire ${pick.alternatives?.[0] || pick.variants?.[0] || "une variation plus legere"}.`,
      actions: ["Voir recette", ...(pick.variants || []).slice(0, 2)],
      recipe: pick,
    };
  }

  const cuisine = lower.includes("antill") ? "antillaise" : inferCuisine(lower);
  const slot = inferSlot(lower);
  const rankedBase = personalizeRecipes(generateRecipeCandidates(ingredients.length ? ingredients : lower.split(/\s+/), {
    cuisine,
    mode: lower.includes("chef") || lower.includes("expert") ? "chef" : "normal",
    slot,
    servings: inferServings(lower),
    limit: 6,
  }), userProfile);
  const ranked = applyAdminControls(rankedBase, {
    ingredients: ingredients.length ? ingredients : lower.split(/\s+/),
    cuisine,
    query: question,
  });
  recordGeneratedRecipes(rankedBase);
  const pick = ranked[0] || rankedBase[0] || surpriseBalancedRecipe();

  return {
    title: "Composition culinaire intelligente",
    answer: `Je compose ${pick.name} a partir d'un blueprint ${pick.blueprintKey}, avec quantites adaptees, logique ${pick.cookingMethod} et coherence ${pick.cuisine}. ${pick.description} Tu peux aussi faire ${pick.alternatives?.[0] || pick.variants?.[0] || "une autre variante"}.`,
    actions: ["Voir recette", ...(pick.variants || []).slice(0, 2), ...(pick.substitutions || []).slice(0, 1)],
    recipe: pick,
    suggestions: {
      alternatives: ranked.slice(1, 4).map((item) => item.name),
      substitutions: pick.substitutions || [],
    },
  };
}
