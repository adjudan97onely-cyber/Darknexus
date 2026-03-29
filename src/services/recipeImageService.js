import { getRecipeImage as getStaticImage, DEFAULT_IMAGE } from "../data/recipeImages";

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

export function resolveRecipeImage(recipe) {
  // 1. localStorage override (user-set image)
  const map = readMap();
  if (map[recipe?.id]) return map[recipe.id];
  // 2. recipe.image from data (patched Unsplash URLs)
  if (recipe?.image) return recipe.image;
  // 3. Static mapping from recipeImages.js
  return getStaticImage(recipe?.id, DEFAULT_IMAGE);
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
