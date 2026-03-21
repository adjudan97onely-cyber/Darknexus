const STORAGE_KEY = "killagain-food:recipe-images";

function normalizeQuery(value) {
  return String(value || "food")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readMap() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getRecipeImage(recipeId, defaultImage) {
  const map = readMap();
  return map[recipeId] || defaultImage;
}

export function buildRealisticRecipeImageUrl(recipe) {
  const rawQuery = recipe?.imagePrompt || recipe?.name || "healthy food plate";
  const query = normalizeQuery(rawQuery);
  const encoded = encodeURIComponent(`${query},food,meal,realistic,plated`);
  return `https://source.unsplash.com/960x720/?${encoded}`;
}

export function resolveRecipeImage(recipe) {
  const fallback = recipe?.image || buildRealisticRecipeImageUrl(recipe);
  return getRecipeImage(recipe?.id, fallback);
}

export function setRecipeImage(recipeId, dataUrl) {
  const map = readMap();
  map[recipeId] = dataUrl;
  writeMap(map);
}

export function clearRecipeImage(recipeId) {
  const map = readMap();
  delete map[recipeId];
  writeMap(map);
}
