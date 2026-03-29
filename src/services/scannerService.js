// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Scanner IA Intelligent
// Appelle /api/analyze (Vercel Function proxy OpenAI Vision)
// - Analyse photo réelle du frigo/aliment
// - Pioche dans le catalogue en priorité
// - Génère et sauvegarde si absent
// ═══════════════════════════════════════════════════════════════

import { ALL_RECIPES } from "../data/recipes";

// ─── CATALOGUE DYNAMIQUE ─────────────────────────────────────
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
      const updated = [recipe, ...existing].slice(0, 50);
      localStorage.setItem("killagain_dynamic_recipes", JSON.stringify(updated));
      DYNAMIC_CATALOG = updated;
    }
  } catch {}
}

export function getAllRecipesWithDynamic() {
  return [...ALL_RECIPES, ...getDynamicCatalog()];
}

// ─── APPEL PROXY /api/analyze ─────────────────────────────────
const API_URL = "/api/analyze";

async function callProxy(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur proxy");
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── ANALYSE IMAGE (Vision) ───────────────────────────────────
export async function analyzeImageWithVision(imageBase64, mediaType = "image/jpeg") {
  try {
    return await callProxy({ type: "vision", image: imageBase64, mediaType });
  } catch (err) {
    console.error("Erreur Vision:", err);
    return null;
  }
}

// ─── ANALYSE TEXTE ────────────────────────────────────────────
export async function analyzeTextWithAI(input) {
  try {
    const prompt = `L'utilisateur a tapé : "${input}". Réponds UNIQUEMENT en JSON valide :
{
  "aliments": ["aliment1", "aliment2"],
  "description": "Ce que c'est en une phrase naturelle",
  "contexte": "cuisine_antillaise ou cuisine_mondiale",
  "possibilites": ["5 idées de recettes possibles"],
  "conseil_chef": "Un conseil de chef professionnel",
  "valeur_nutritionnelle": "Valeur nutritionnelle principale"
}`;
    return await callProxy({ type: "text", text: prompt });
  } catch {
    // Fallback local intelligent
    const mots = (input || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
    const mapping = {
      "frigo": ["oeuf", "fromage", "tomate", "lait"],
      "poulet": ["poulet"], "poisson": ["poisson"],
      "banane": ["banane"], "avocat": ["avocat"],
      "morue": ["morue"], "crevettes": ["crevettes"],
      "riz": ["riz"], "tomate": ["tomate"],
      "oeuf": ["oeuf"], "oeufs": ["oeuf"],
      "fromage": ["fromage"], "farine": ["farine"],
      "pizza": ["pate", "tomate", "fromage"],
      "crepe": ["farine", "oeuf", "lait"],
    };

    let aliments = [];
    mots.forEach(m => {
      if (mapping[m]) aliments.push(...mapping[m]);
      else if (m.length > 2) aliments.push(m);
    });
    if (!aliments.length) aliments = ["oeuf", "tomate", "fromage"];

    return {
      aliments: [...new Set(aliments)],
      description: `Ingrédients : ${aliments.join(", ")}`,
      contexte: "cuisine_antillaise",
      possibilites: [
        "Omelette créole aux herbes",
        "Salade fraîche du frigo",
        "Plat rapide selon les ingrédients",
        "Recette antillaise maison",
        "Improvisation du chef",
      ],
      conseil_chef: "Utilise ce que tu as pour créer quelque chose de savoureux !",
      valeur_nutritionnelle: "Varie les sources de protéines et légumes.",
    };
  }
}

// ─── GÉNÉRATION DE RECETTE ────────────────────────────────────
export async function generateRecipeWithAI(aliments, nomRecette = null) {
  const sujet = nomRecette || aliments.join(", ");
  try {
    const prompt = `Tu es un chef cuisinier expert en cuisine antillaise et internationale. Génère une recette ultra détaillée pour : "${sujet}".
Réponds UNIQUEMENT en JSON valide :
{
  "id": "gen-${Date.now()}",
  "name": "Nom exact de la recette",
  "category": "plat ou entree ou dessert ou boisson ou accompagnement",
  "tags": ["tag1", "tag2"],
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
  "prepMinutes": 15,
  "restMinutes": 0,
  "cookMinutes": 30,
  "difficulty": "Facile ou Intermediaire ou Avance",
  "description": "Description appétissante en 1-2 phrases",
  "ingredients": ["quantité + ingrédient précis"],
  "steps": ["ÉTAPE : Description détaillée avec techniques, températures, durées. Minimum 5 étapes."],
  "tips": ["Conseil de chef précis"],
  "mistakes": ["Erreur courante à éviter"],
  "nutrition": { "kcal": 450, "protein": 25, "carbs": 45, "fat": 18 },
  "source": "ai-generated"
}`;

    const recipe = await callProxy({ type: "text", text: prompt });
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

  // 1. Vision si image fournie
  if (imageBase64) {
    analysis = await analyzeImageWithVision(imageBase64, mediaType);
  }

  // 2. Texte si pas d'image ou si vision échoue
  if (!analysis) {
    analysis = await analyzeTextWithAI(input || "frigo");
  }

  const aliments = analysis?.aliments || [];

  // 3. Cherche dans le catalogue (priorité absolue)
  const catalogResults = searchInCatalog(aliments, analysis?.description || input || "");

  // 4. Génère avec l'IA si pas assez de résultats
  let generatedRecipe = null;
  if (catalogResults.length < 3 && aliments.length > 0) {
    generatedRecipe = await generateRecipeWithAI(aliments, input);
  }

  // 5. Combine
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
