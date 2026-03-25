import { recommendRecipesFromIngredients } from "./aiService";
import { getUserProfile } from "./userProfileService";

const STORAGE_KEY = "killagain-food:user-memory";

const DEFAULT_MEMORY = {
  likedRecipes: [],
  seenRecipeIds: [],
  frequentIngredients: {},
  preferredStyles: {},
  preferredCuisines: {},
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function clampObjectEntries(map, maxEntries = 20) {
  return Object.fromEntries(
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxEntries)
  );
}

export function getUserMemory() {
  if (!canUseStorage()) return DEFAULT_MEMORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_MEMORY, ...JSON.parse(raw) } : DEFAULT_MEMORY;
  } catch {
    return DEFAULT_MEMORY;
  }
}

function saveUserMemory(memory) {
  if (!canUseStorage()) return memory;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  return memory;
}

export function recordRecipeSeen(recipe) {
  if (!recipe?.id) return getUserMemory();
  const memory = getUserMemory();
  const next = {
    ...memory,
    seenRecipeIds: [recipe.id, ...memory.seenRecipeIds.filter((id) => id !== recipe.id)].slice(0, 120),
  };

  if (recipe?.style) {
    next.preferredStyles = clampObjectEntries({
      ...memory.preferredStyles,
      [recipe.style]: (memory.preferredStyles?.[recipe.style] || 0) + 1,
    });
  }

  if (recipe?.cuisine) {
    next.preferredCuisines = clampObjectEntries({
      ...memory.preferredCuisines,
      [recipe.cuisine]: (memory.preferredCuisines?.[recipe.cuisine] || 0) + 1,
    });
  }

  return saveUserMemory(next);
}

export function recordRecipeLiked(recipe, liked = true) {
  if (!recipe?.id) return getUserMemory();
  const memory = getUserMemory();
  const likedRecipes = liked
    ? [recipe, ...memory.likedRecipes.filter((item) => item.id !== recipe.id)].slice(0, 40)
    : memory.likedRecipes.filter((item) => item.id !== recipe.id);
  return saveUserMemory({ ...memory, likedRecipes });
}

export function recordIngredientsUsage(ingredients = []) {
  if (!Array.isArray(ingredients) || !ingredients.length) return getUserMemory();
  const memory = getUserMemory();
  const nextIngredients = { ...memory.frequentIngredients };
  ingredients.map((item) => normalize(item)).filter(Boolean).forEach((item) => {
    nextIngredients[item] = (nextIngredients[item] || 0) + 1;
  });
  return saveUserMemory({
    ...memory,
    frequentIngredients: clampObjectEntries(nextIngredients, 30),
  });
}

function topKeys(map, limit = 5) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function goalCoachLine(goal, recipe) {
  const kcal = Number(recipe?.nutrition?.kcal || 0);
  if (goal === "lose") {
    if (kcal > 0 && kcal <= 550) return "Bonne option pour ton objectif perte de poids.";
    return "Adapte a ton objectif perte de poids avec un bon controle des portions.";
  }
  if (goal === "gain") {
    if (kcal >= 650) return "Bonne option pour soutenir ton objectif prise de masse.";
    return "Compatible avec ton objectif prise de masse, ajoute une portion si besoin.";
  }
  if (goal === "maintain") {
    return "Equilibre pour ton objectif de maintien.";
  }
  return "Adapte a ton objectif nutritionnel.";
}

function overlapCount(valuesA = [], valuesB = []) {
  const setB = new Set(valuesB.map((item) => normalize(item)).filter(Boolean));
  return valuesA.map((item) => normalize(item)).filter((item) => setB.has(item)).length;
}

function buildCoachExplanations(recipe, context) {
  const { profile, memory, recentSeed = [] } = context;
  const lines = [];
  const likedRecipes = memory?.likedRecipes || [];
  const likedStyles = topKeys(memory?.preferredStyles, 3).map((item) => normalize(item));
  const likedCuisines = topKeys(memory?.preferredCuisines, 3).map((item) => normalize(item));
  const recipeStyle = normalize(recipe?.style);
  const recipeCuisine = normalize(recipe?.cuisine);
  const recipeIngredients = (recipe?.ingredients || []).map((item) => normalize(item)).filter(Boolean);

  if (likedStyles.includes(recipeStyle) && recipe?.style) {
    lines.push(`Parce que tu aimes le style ${recipe.style}.`);
  } else if (likedCuisines.includes(recipeCuisine) && recipe?.cuisine) {
    lines.push(`Parce que tu apprecies souvent la cuisine ${recipe.cuisine}.`);
  } else {
    const likedOverlap = likedRecipes
      .slice(0, 8)
      .some((liked) => overlapCount(liked.ingredients || [], recipe.ingredients || []) >= 2);
    if (likedOverlap) lines.push("Parce que tu aimes des recettes proches de celle-ci.");
  }

  lines.push(goalCoachLine(profile?.goal, recipe));

  const seedOverlap = overlapCount(recipeIngredients, recentSeed);
  if (seedOverlap >= 2) {
    lines.push("Base sur tes ingredients recents, cette recette te correspond bien.");
  } else {
    const frequentIngredients = topKeys(memory?.frequentIngredients, 6);
    const frequentOverlap = overlapCount(recipeIngredients, frequentIngredients);
    if (frequentOverlap >= 2) {
      lines.push("Tu cuisines souvent ces ingredients, ca devrait te plaire.");
    }
  }

  const totalTime = Number(recipe?.prepMinutes || 0) + Number(recipe?.cookMinutes || 0) + Number(recipe?.restMinutes || 0);
  if (totalTime > 0 && totalTime <= 30) {
    lines.push("Rapide et equilibre pour ce soir.");
  }

  return [...new Set(lines)].slice(0, 3);
}

function withCoachExplanations(recipes, context) {
  return (recipes || []).map((recipe) => {
    const coachExplanations = buildCoachExplanations(recipe, context);
    return {
      ...recipe,
      coachExplanations,
      coachExplanation: coachExplanations[0] || "Suggestion personnalisee selon ton profil et tes habitudes.",
    };
  });
}

function personalizeRanking(recipes, memory) {
  const likedIds = new Set((memory.likedRecipes || []).map((item) => item.id));
  const seenIds = new Set(memory.seenRecipeIds || []);
  const topStyles = topKeys(memory.preferredStyles, 3);
  const topCuisines = topKeys(memory.preferredCuisines, 3);

  return [...recipes]
    .map((recipe) => {
      let boost = 0;
      if (likedIds.has(recipe.id)) boost += 25;
      if (topStyles.some((style) => String(recipe.style || "").includes(style))) boost += 14;
      if (topCuisines.includes(recipe.cuisine)) boost += 12;
      if (seenIds.has(recipe.id) && !likedIds.has(recipe.id)) boost -= 10;
      return {
        ...recipe,
        personalizedScore: (recipe.score || 0) + boost,
      };
    })
    .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
}

export function getPersonalizedRecommendationSections(detectedIngredients = []) {
  const memory = getUserMemory();
  const profile = getUserProfile();
  const frequent = topKeys(memory.frequentIngredients, 5);
  const liked = (memory.likedRecipes || []).slice(0, 4);
  const ingredientSeed = detectedIngredients.length ? detectedIngredients : (frequent.length ? frequent : ["oeuf", "tomate", "poulet"]);
  const explainContext = {
    profile,
    memory,
    recentSeed: ingredientSeed,
  };

  const recommended = personalizeRanking(
    recommendRecipesFromIngredients(ingredientSeed, 12, { cuisine: "all", userProfile: profile }),
    memory
  );

  const becauseYouLikedSeed = liked.length
    ? [...new Set(liked.flatMap((recipe) => (recipe.ingredients || []).slice(0, 4)).map((item) => normalize(item)).filter(Boolean))].slice(0, 6)
    : ingredientSeed;

  const becauseYouLiked = personalizeRanking(
    recommendRecipesFromIngredients(becauseYouLikedSeed, 8, { cuisine: "all", userProfile: profile }),
    memory
  ).filter((recipe) => !liked.some((item) => item.id === recipe.id));

  const youCouldAlsoLike = personalizeRanking(
    recommendRecipesFromIngredients([...ingredientSeed, ...frequent].slice(0, 8), 8, { cuisine: "all", userProfile: profile }),
    memory
  ).filter((recipe) => !recommended.slice(0, 4).some((item) => item.id === recipe.id));

  return {
    recommendedForYou: withCoachExplanations(recommended.slice(0, 4), explainContext),
    becauseYouLiked: withCoachExplanations(becauseYouLiked.slice(0, 4), explainContext),
    youCouldAlsoLike: withCoachExplanations(youCouldAlsoLike.slice(0, 4), explainContext),
    memory,
  };
}
