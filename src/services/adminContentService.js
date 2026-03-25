import { ALL_RECIPES } from "../data/recipes";

const STORAGE_KEY = "killagain-food:admin-content";

const DEFAULT_ADMIN_CONTENT = {
  generatedRecipes: [],
  manualRecipes: [],
  recipeOverrides: {},
  deletedRecipeIds: [],
  blacklistedIngredients: [],
  blacklistedCombinations: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function ingredientToken(item) {
  let text = normalize(item);
  text = text.replace(/^\d+[\d.,/]*\s*[a-z%]*\s*/i, "");
  text = text.replace(/^c\.?\s*a\s*(cafe|soupe)\s*/i, "");
  return text.trim();
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniqueById(recipes) {
  const map = new Map();
  (recipes || []).forEach((recipe) => {
    if (!recipe?.id) return;
    if (!map.has(recipe.id)) map.set(recipe.id, recipe);
  });
  return [...map.values()];
}

function withSafeArrays(recipe) {
  return {
    ...recipe,
    ingredients: toArray(recipe.ingredients),
    steps: toArray(recipe.steps),
    tips: toArray(recipe.tips),
    mistakes: toArray(recipe.mistakes),
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
  };
}

function clampList(values, max = 250) {
  return [...new Set((values || []).map((item) => String(item).trim()).filter(Boolean))].slice(0, max);
}

function normalizeCombination(value) {
  const parts = toArray(value)
    .map((item) => ingredientToken(item))
    .filter(Boolean)
    .sort();
  return parts.length >= 2 ? parts : null;
}

function comboKey(parts) {
  return parts.map((item) => normalize(item)).sort().join("|");
}

function ensureBlacklistsShape(content) {
  const combinations = (content.blacklistedCombinations || [])
    .map((value) => normalizeCombination(value))
    .filter(Boolean);
  return {
    ...content,
    blacklistedIngredients: clampList(content.blacklistedIngredients || [], 120),
    blacklistedCombinations: [...new Map(combinations.map((parts) => [comboKey(parts), parts])).values()].slice(0, 120),
  };
}

export function isLocalAdminAllowed() {
  if (typeof window === "undefined") return false;
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");
}

export function getAdminContent() {
  if (!canUseStorage()) return DEFAULT_ADMIN_CONTENT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return ensureBlacklistsShape({ ...DEFAULT_ADMIN_CONTENT, ...parsed });
  } catch {
    return DEFAULT_ADMIN_CONTENT;
  }
}

export function saveAdminContent(nextContent) {
  const normalized = ensureBlacklistsShape({ ...DEFAULT_ADMIN_CONTENT, ...(nextContent || {}) });
  if (!canUseStorage()) return normalized;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateAdminContent(partial) {
  const current = getAdminContent();
  return saveAdminContent({ ...current, ...(partial || {}) });
}

function sanitizeRecipeForStorage(recipe, source = "generated") {
  if (!recipe?.id) return null;
  const clean = withSafeArrays(recipe);
  return {
    id: clean.id,
    name: clean.name || "Recette sans nom",
    ingredients: clean.ingredients,
    steps: clean.steps,
    image: clean.image || "/recipes/default.svg",
    source,
    cuisine: clean.cuisine || "all",
    style: clean.style || "maison",
    difficulty: clean.difficulty || "Facile",
    prepMinutes: Number(clean.prepMinutes || 10),
    restMinutes: Number(clean.restMinutes || 0),
    cookMinutes: Number(clean.cookMinutes || 15),
    servings: Number(clean.servings || 2),
    nutrition: clean.nutrition || { kcal: 420, protein: 22, carbs: 32, fat: 18 },
    tips: clean.tips,
    mistakes: clean.mistakes,
    tags: clean.tags,
    score: Number(clean.score || 75),
    matchReason: clean.matchReason || "Recette admin.",
    generatedAt: clean.generatedAt || Date.now(),
  };
}

export function recordGeneratedRecipes(recipes = []) {
  if (!Array.isArray(recipes) || !recipes.length) return getAdminContent();
  const current = getAdminContent();
  const stamped = recipes
    .map((recipe) => sanitizeRecipeForStorage({ ...recipe, generatedAt: Date.now() }, "generated"))
    .filter(Boolean);

  const merged = uniqueById([...stamped, ...(current.generatedRecipes || [])]).slice(0, 240);
  return saveAdminContent({
    ...current,
    generatedRecipes: merged,
  });
}

function applyOverride(recipe, overrides) {
  if (!recipe?.id) return recipe;
  const override = overrides?.[recipe.id];
  if (!override) return recipe;
  return withSafeArrays({ ...recipe, ...override, id: recipe.id });
}

function recipeIngredientsNormalized(recipe) {
  return toArray(recipe?.ingredients).map((item) => ingredientToken(item)).filter(Boolean);
}

function violatesIngredientBlacklist(recipe, blacklist = []) {
  if (!blacklist.length) return false;
  const banned = new Set(blacklist.map((item) => ingredientToken(item)).filter(Boolean));
  const ingredients = recipeIngredientsNormalized(recipe);
  return ingredients.some((item) => banned.has(item));
}

function violatesCombinationBlacklist(recipe, combinations = []) {
  if (!combinations.length) return false;
  const ingredients = new Set(recipeIngredientsNormalized(recipe));
  return combinations.some((combo) => combo.every((item) => ingredients.has(ingredientToken(item))));
}

function overlapScore(recipe, seedIngredients = []) {
  const set = new Set((seedIngredients || []).map((item) => ingredientToken(item)).filter(Boolean));
  if (!set.size) return 0;
  const ingredients = recipeIngredientsNormalized(recipe);
  return ingredients.filter((item) => set.has(item)).length;
}

function scoreManualRecipe(recipe, context = {}) {
  const overlap = overlapScore(recipe, context.ingredients || []);
  const cuisineBonus = context.cuisine && context.cuisine !== "all" && recipe.cuisine === context.cuisine ? 2 : 0;
  return (Number(recipe.score || 72) + overlap * 6 + cuisineBonus);
}

function normalizeForUi(recipe) {
  return {
    ...withSafeArrays(recipe),
    nutrition: recipe.nutrition || { kcal: 420, protein: 22, carbs: 32, fat: 18 },
    prepMinutes: Number(recipe.prepMinutes || 10),
    cookMinutes: Number(recipe.cookMinutes || 15),
    restMinutes: Number(recipe.restMinutes || 0),
    servings: Number(recipe.servings || 2),
    difficulty: recipe.difficulty || "Facile",
    source: recipe.source || "generated",
  };
}

export function applyAdminControls(recipes = [], context = {}) {
  const content = getAdminContent();
  const deleted = new Set(content.deletedRecipeIds || []);

  const generated = uniqueById((recipes || []).map((recipe) => normalizeForUi(applyOverride(recipe, content.recipeOverrides))));
  const manual = (content.manualRecipes || [])
    .map((recipe) => normalizeForUi(applyOverride(recipe, content.recipeOverrides)))
    .filter((recipe) => !deleted.has(recipe.id));

  const merged = uniqueById([
    ...generated,
    ...manual,
  ])
    .filter((recipe) => !deleted.has(recipe.id))
    .filter((recipe) => !violatesIngredientBlacklist(recipe, content.blacklistedIngredients || []))
    .filter((recipe) => !violatesCombinationBlacklist(recipe, content.blacklistedCombinations || []))
    .map((recipe) => ({
      ...recipe,
      score: recipe.source === "manual" ? scoreManualRecipe(recipe, context) : Number(recipe.score || 75),
    }))
    .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));

  return merged;
}

export function addManualRecipe(input = {}) {
  const current = getAdminContent();
  const timestamp = Date.now();
  const id = input.id || `admin-manual-${timestamp}`;
  const recipe = sanitizeRecipeForStorage({
    id,
    name: input.name,
    image: input.image,
    ingredients: toArray(input.ingredients),
    steps: toArray(input.steps),
    cuisine: input.cuisine || "all",
    style: input.style || "signature admin",
    difficulty: input.difficulty || "Facile",
    prepMinutes: Number(input.prepMinutes || 10),
    cookMinutes: Number(input.cookMinutes || 15),
    restMinutes: Number(input.restMinutes || 0),
    servings: Number(input.servings || 2),
    nutrition: input.nutrition || { kcal: 440, protein: 24, carbs: 34, fat: 18 },
    tips: toArray(input.tips),
    mistakes: toArray(input.mistakes),
    tags: ["manual", "admin"],
    score: Number(input.score || 78),
    matchReason: "Ajoutee manuellement depuis admin.",
  }, "manual");

  const manualRecipes = [recipe, ...(current.manualRecipes || []).filter((item) => item.id !== id)];
  return saveAdminContent({ ...current, manualRecipes: manualRecipes.slice(0, 240) });
}

export function updateRecipeContent(recipeId, patch) {
  if (!recipeId) return getAdminContent();
  const current = getAdminContent();
  const currentOverride = current.recipeOverrides?.[recipeId] || {};
  const nextOverride = withSafeArrays({ ...currentOverride, ...(patch || {}) });
  return saveAdminContent({
    ...current,
    recipeOverrides: {
      ...current.recipeOverrides,
      [recipeId]: nextOverride,
    },
  });
}

export function deleteRecipeForAdmin(recipeId) {
  if (!recipeId) return getAdminContent();
  const current = getAdminContent();
  return saveAdminContent({
    ...current,
    deletedRecipeIds: clampList([recipeId, ...(current.deletedRecipeIds || [])], 500),
  });
}

export function restoreRecipeForAdmin(recipeId) {
  if (!recipeId) return getAdminContent();
  const current = getAdminContent();
  return saveAdminContent({
    ...current,
    deletedRecipeIds: (current.deletedRecipeIds || []).filter((id) => id !== recipeId),
  });
}

export function setIngredientBlacklist(values = []) {
  const current = getAdminContent();
  return saveAdminContent({
    ...current,
    blacklistedIngredients: clampList(toArray(values), 120),
  });
}

export function setCombinationBlacklist(lines = []) {
  const current = getAdminContent();
  const parsed = toArray(lines)
    .map((line) => line.split(/[+|,;]+/).map((item) => ingredientToken(item)).filter(Boolean))
    .filter((parts) => parts.length >= 2);
  return saveAdminContent({
    ...current,
    blacklistedCombinations: parsed,
  });
}

function correctedTextLines(lines, fallback) {
  const cleaned = toArray(lines)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : [fallback];
}

export function autoCorrectRecipe(recipeId) {
  if (!recipeId) return getAdminContent();
  const all = getAdminRecipeInventory();
  const target = all.find((item) => item.id === recipeId);
  if (!target) return getAdminContent();

  const patch = {
    name: String(target.name || "Recette corrigee").trim(),
    ingredients: correctedTextLines(target.ingredients, "ingredient a preciser"),
    steps: correctedTextLines(target.steps, "Etape a preciser"),
  };

  return updateRecipeContent(recipeId, patch);
}

function computeQualityFlags(recipe) {
  const flags = [];
  if (!recipe?.name || String(recipe.name).trim().length < 3) flags.push("Nom trop court");
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 2) flags.push("Ingredients insuffisants");
  if (!Array.isArray(recipe.steps) || recipe.steps.length < 2) flags.push("Etapes insuffisantes");
  if (!recipe.image) flags.push("Image manquante");
  return flags;
}

export function getAdminRecipeInventory() {
  const content = getAdminContent();
  const deleted = new Set(content.deletedRecipeIds || []);
  const basePool = uniqueById([
    ...(content.generatedRecipes || []),
    ...(content.manualRecipes || []),
    ...ALL_RECIPES,
  ]).map((recipe) => normalizeForUi(applyOverride(recipe, content.recipeOverrides)));

  return basePool
    .map((recipe) => ({
      ...recipe,
      deleted: deleted.has(recipe.id),
      qualityFlags: computeQualityFlags(recipe),
    }))
    .sort((a, b) => Number(b.generatedAt || 0) - Number(a.generatedAt || 0));
}

export function getRecipeByIdFromAdminLayer(recipeId) {
  if (!recipeId) return null;
  return getAdminRecipeInventory().find((item) => item.id === recipeId && !item.deleted) || null;
}
