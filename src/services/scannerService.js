// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Scanner IA Intelligent
// - Analyse photo via Claude Vision API
// - Pioche dans le catalogue en priorité
// - Si absent : génère ET sauvegarde pour enrichir le catalogue
// - Parle de TOUT ce qu'on peut faire avec l'aliment détecté
// ═══════════════════════════════════════════════════════════════

import { ALL_RECIPES, CREOLE_RECIPES } from "../data/recipes";

// ─── CATALOGUE DYNAMIQUE ─────────────────────────────────────
// Les recettes générées sont ajoutées ici pour enrichir l'app
let DYNAMIC_CATALOG = [];

export function getDynamicCatalog() {
  try {
    const saved = localStorage.getItem("killagain_dynamic_recipes");
    if (saved) DYNAMIC_CATALOG = JSON.parse(saved);
  } catch {}
  return DYNAMIC_CATALOG;
}

function saveToDynamicCatalog(recipe) {
  try {
    const existing = getDynamicCatalog();
    const alreadyExists = existing.find(r => r.id === recipe.id);
    if (!alreadyExists) {
      const updated = [recipe, ...existing].slice(0, 50); // max 50 recettes dynamiques
      localStorage.setItem("killagain_dynamic_recipes", JSON.stringify(updated));
      DYNAMIC_CATALOG = updated;
    }
  } catch {}
}

export function getAllRecipesWithDynamic() {
  return [...ALL_RECIPES, ...getDynamicCatalog()];
}

// ─── ANALYSE IMAGE VIA PROXY OPENAI VISION ──────────────────
export async function analyzeImageWithClaude(imageBase64, mediaType = "image/jpeg") {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "vision", image: imageBase64, mediaType }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error("Erreur Vision IA:", err);
    return null;
  }
}

// ─── ANALYSE TEXTE (fallback si pas d'image) ─────────────────
export async function analyzeTextWithClaude(input) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "text", input }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch {
    return {
      aliments: input.split(/[,\s]+/).filter(Boolean),
      description: input,
      contexte: "cuisine_mondiale",
      possibilites: ["Recherche dans le catalogue..."],
      conseil_chef: "Explore les recettes disponibles.",
      valeur_nutritionnelle: "Information non disponible.",
    };
  }
}

// ─── GÉNÉRATION DE RECETTE VIA IA ────────────────────────────
export async function generateRecipeWithClaude(aliments, nomRecette = null) {
  const sujet = nomRecette || aliments.join(", ");
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "recipe", input: sujet }),
    });
    const recipe = await response.json();
    if (recipe.error) throw new Error(recipe.error);
    recipe.source = "ai-generated";
    recipe.generatedAt = new Date().toISOString();
    saveToDynamicCatalog(recipe);
    return recipe;
  } catch (err) {
    console.error("Erreur génération recette:", err);
    return null;
  }
}

// ─── RECHERCHE DANS LE CATALOGUE ─────────────────────────────
export function searchInCatalog(aliments, description = "") {
  const allRecipes = getAllRecipesWithDynamic();
  const searchTerms = [
    ...aliments.map(a => a.toLowerCase()),
    ...description.toLowerCase().split(/\s+/).filter(w => w.length > 3),
  ];

  const scored = allRecipes.map(recipe => {
    const haystack = [
      recipe.name,
      recipe.description || "",
      (recipe.tags || []).join(" "),
      (recipe.ingredients || []).join(" "),
    ].join(" ").toLowerCase();

    let score = 0;
    searchTerms.forEach(term => {
      if (haystack.includes(term)) score += 10;
    });

    // Bonus recettes créoles
    const isCreole = (recipe.tags || []).some(t =>
      ["guadeloupe", "martinique", "tradition", "antillais", "creole"].includes(t)
    );
    if (isCreole) score += 5;

    return { ...recipe, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ─── POINT D'ENTRÉE PRINCIPAL ─────────────────────────────────
export async function scanAndRecommend(input, imageBase64 = null, mediaType = "image/jpeg") {
  let analysis = null;

  // 1. Analyse via Vision IA si image fournie
  if (imageBase64) {
    analysis = await analyzeImageWithClaude(imageBase64, mediaType);
  }

  // 2. Analyse texte si pas d'image ou si vision échoue
  if (!analysis) {
    analysis = await analyzeTextWithClaude(input || "frigo");
  }

  const aliments = analysis.aliments || [];

  // 3. Cherche dans le catalogue (priorité)
  const catalogResults = searchInCatalog(aliments, analysis.description || input || "");

  // 4. Si pas assez de résultats → génère avec l'IA
  let generatedRecipe = null;
  if (catalogResults.length < 3 && aliments.length > 0) {
    generatedRecipe = await generateRecipeWithClaude(aliments, input);
  }

  // 5. Combine les résultats
  const allResults = [
    ...catalogResults,
    ...(generatedRecipe ? [{ ...generatedRecipe, score: 95, isNew: true }] : []),
  ].slice(0, 8);

  return {
    analysis,
    aliments,
    recipes: allResults,
    generatedRecipe,
    hasNewRecipe: !!generatedRecipe,
  };
}

// ─── CONVERSION IMAGE EN BASE64 ──────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
