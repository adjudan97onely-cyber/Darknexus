import { buildRecipeImageUrl, resolveRecipeImage as resolveCoreRecipeImage } from "../core/imageService";

const STORAGE_KEY = "killagain-food:recipe-images";

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
  return buildRecipeImageUrl(recipe);
}

export function resolveRecipeImage(recipe) {
  return resolveCoreRecipeImage(recipe, (recipeId) => getRecipeImage(recipeId, ""));
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
