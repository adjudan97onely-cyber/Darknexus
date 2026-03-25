import { normalizeUserProfile } from "../core/userProfile";

export const STORAGE_KEYS = {
  favorites: "killagain-food:favorites",
  userProfile: "killagain-food:user-profile",
  userMemory: "killagain-food:user-memory",
  recipeImages: "killagain-food:recipe-images",
  adminContent: "killagain-food:admin-content",
  nutritionTracking: "killagain-food:nutrition-tracking",
  runtimeMeta: "killagain-food:runtime-meta",
};

const STORAGE_PREFIX = "killagain-food:";
const CURRENT_STORAGE_VERSION = 2;
const KNOWN_KEYS = new Set(Object.values(STORAGE_KEYS));
const LEGACY_KEYS = [
  "killagain-food:role",
  "killagain-food:userRole",
  "killagain-food:profile",
  "killagain-food:memory",
  "killagain-food:images",
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function uniqueStrings(values = [], max = 100) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))].slice(0, max);
}

function clampMap(raw, maxEntries) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [String(key || "").trim(), Number(value) || 0])
      .filter(([key, value]) => key && value >= 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxEntries)
  );
}

function safeReadJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  if (!canUseStorage()) return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return value;
  }
  return value;
}

function safeRemove(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage cleanup failures
  }
}

function sanitizeRecipe(recipe) {
  if (!recipe || typeof recipe !== "object" || !recipe.id) return null;
  return {
    ...recipe,
    id: String(recipe.id),
    name: String(recipe.name || "Recette"),
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(Boolean).map(String) : [],
  };
}

function sanitizeFavorites(raw) {
  if (!Array.isArray(raw)) return [];
  const uniqueById = new Map();
  raw.forEach((recipe) => {
    const next = sanitizeRecipe(recipe);
    if (next && !uniqueById.has(next.id)) uniqueById.set(next.id, next);
  });
  return [...uniqueById.values()].slice(0, 30);
}

function sanitizeUserMemory(raw) {
  const next = raw && typeof raw === "object" ? raw : {};
  const likedRecipes = Array.isArray(next.likedRecipes)
    ? next.likedRecipes.map(sanitizeRecipe).filter(Boolean).slice(0, 40)
    : [];

  return {
    likedRecipes,
    seenRecipeIds: uniqueStrings(next.seenRecipeIds, 120),
    frequentIngredients: clampMap(next.frequentIngredients, 30),
    preferredStyles: clampMap(next.preferredStyles, 20),
    preferredCuisines: clampMap(next.preferredCuisines, 20),
  };
}

function sanitizeImageMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [String(key || "").trim(), String(value || "").trim()])
      .filter(([key, value]) => key && value && (value.startsWith("data:") || value.startsWith("http") || value.startsWith("/")))
      .slice(0, 300)
  );
}

function sanitizeTracking(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([dateKey, value]) => {
        const item = value && typeof value === "object" ? value : {};
        const done = item.done && typeof item.done === "object" ? item.done : {};
        return [
          String(dateKey || "").trim(),
          {
            done: {
              breakfast: Boolean(done.breakfast),
              lunch: Boolean(done.lunch),
              snack: Boolean(done.snack),
              dinner: Boolean(done.dinner),
            },
            water: Math.max(0, Math.min(20, Number(item.water) || 0)),
          },
        ];
      })
      .filter(([dateKey]) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
      .slice(-31)
  );
}

function sanitizeAdminContent(raw) {
  const next = raw && typeof raw === "object" ? raw : {};
  return {
    generatedRecipes: Array.isArray(next.generatedRecipes) ? next.generatedRecipes.map(sanitizeRecipe).filter(Boolean).slice(0, 240) : [],
    manualRecipes: Array.isArray(next.manualRecipes) ? next.manualRecipes.map(sanitizeRecipe).filter(Boolean).slice(0, 240) : [],
    recipeOverrides: next.recipeOverrides && typeof next.recipeOverrides === "object" && !Array.isArray(next.recipeOverrides) ? next.recipeOverrides : {},
    deletedRecipeIds: uniqueStrings(next.deletedRecipeIds, 500),
    blacklistedIngredients: uniqueStrings(next.blacklistedIngredients, 120),
    blacklistedCombinations: Array.isArray(next.blacklistedCombinations)
      ? next.blacklistedCombinations
          .filter(Array.isArray)
          .map((items) => uniqueStrings(items, 10))
          .filter((items) => items.length >= 2)
          .slice(0, 120)
      : [],
  };
}

function sanitizeUserProfile(rawProfile, meta) {
  const normalized = normalizeUserProfile(rawProfile || {});
  if (!meta?.storageVersion && normalized.role === "standard") {
    return { ...normalized, role: "free" };
  }
  return normalized;
}

export function initializeRuntimeState() {
  if (!canUseStorage()) return false;

  LEGACY_KEYS.forEach(safeRemove);

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX) && !KNOWN_KEYS.has(key))
    .forEach(safeRemove);

  const runtimeMeta = safeReadJson(STORAGE_KEYS.runtimeMeta, {});
  const userProfile = sanitizeUserProfile(safeReadJson(STORAGE_KEYS.userProfile, {}), runtimeMeta);
  const favorites = sanitizeFavorites(safeReadJson(STORAGE_KEYS.favorites, []));
  const userMemory = sanitizeUserMemory(safeReadJson(STORAGE_KEYS.userMemory, {}));
  const recipeImages = sanitizeImageMap(safeReadJson(STORAGE_KEYS.recipeImages, {}));
  const adminContent = sanitizeAdminContent(safeReadJson(STORAGE_KEYS.adminContent, {}));
  const nutritionTracking = sanitizeTracking(safeReadJson(STORAGE_KEYS.nutritionTracking, {}));

  safeWriteJson(STORAGE_KEYS.userProfile, userProfile);
  safeWriteJson(STORAGE_KEYS.favorites, favorites);
  safeWriteJson(STORAGE_KEYS.userMemory, userMemory);
  safeWriteJson(STORAGE_KEYS.recipeImages, recipeImages);
  safeWriteJson(STORAGE_KEYS.adminContent, adminContent);
  safeWriteJson(STORAGE_KEYS.nutritionTracking, nutritionTracking);
  safeWriteJson(STORAGE_KEYS.runtimeMeta, {
    storageVersion: CURRENT_STORAGE_VERSION,
    activeRole: userProfile.role,
    sanitizedAt: Date.now(),
  });

  return true;
}

export function prepareRuntimeForRoleChange(nextRole, previousRole) {
  if (!canUseStorage()) return false;
  initializeRuntimeState();
  const currentProfile = safeReadJson(STORAGE_KEYS.userProfile, {});
  safeWriteJson(STORAGE_KEYS.userProfile, normalizeUserProfile({
    ...(currentProfile || {}),
    role: nextRole,
  }));
  safeWriteJson(STORAGE_KEYS.runtimeMeta, {
    ...(safeReadJson(STORAGE_KEYS.runtimeMeta, {}) || {}),
    storageVersion: CURRENT_STORAGE_VERSION,
    activeRole: nextRole,
    previousRole: previousRole || null,
    lastRoleChangeAt: Date.now(),
  });
  window.dispatchEvent(new CustomEvent("killagain-food:role-changed", {
    detail: { nextRole, previousRole },
  }));
  return true;
}