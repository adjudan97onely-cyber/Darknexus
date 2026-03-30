// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Chef IA Central
// Moteur intelligent avec 3 rôles : Chef, Nutritionniste, Assistant
// ═══════════════════════════════════════════════════════════════

import { SYSTEM_PROMPTS, buildContext } from "./prompts";
import { ALL_RECIPES } from "../data/recipes";
import { getRecipeImage } from "../data/recipeImages";

// ─── CONFIGURATION ───────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ─── APPEL API CLAUDE ────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens = 1024) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Anthropic non configurée");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── VALIDATION D'INGRÉDIENTS ────────────────────────────────
// Corrige les quantités irréalistes (pas de "0.3 pomme")
export function validateIngredients(ingredients) {
  return ingredients.map(ing => {
    let fixed = ing;

    // Remplace les fractions de fruits/légumes entiers par des unités entières
    fixed = fixed.replace(/0\.\d+\s+(pomme|tomate|oignon|banane|mangue|avocat|oeuf|citron)/gi,
      (_, item) => `1 ${item}`);

    // Arrondir les quantités en grammes au multiple de 5
    fixed = fixed.replace(/(\d+(?:\.\d+)?)\s*g\b/g, (_, num) => {
      const rounded = Math.round(parseFloat(num) / 5) * 5;
      return `${Math.max(5, rounded)} g`;
    });

    // Arrondir les quantités en ml au multiple de 10
    fixed = fixed.replace(/(\d+(?:\.\d+)?)\s*ml\b/g, (_, num) => {
      const rounded = Math.round(parseFloat(num) / 10) * 10;
      return `${Math.max(10, rounded)} ml`;
    });

    return fixed;
  });
}

// ─── CHEF ANTILLAIS EXPERT ───────────────────────────────────
export async function askChef(question, options = {}) {
  const context = buildContext(options);
  const message = `${question}\n\n${context}`;

  try {
    const result = await callClaude(SYSTEM_PROMPTS.chef, message, 1500);

    // Valider et corriger les ingrédients
    if (result.ingredients) {
      result.ingredients = validateIngredients(result.ingredients);
    }

    // Vérifier le nombre minimum d'étapes
    if (result.steps && result.steps.length < 5) {
      result.warnings = ["Recette simplifiée — moins de 5 étapes"];
    }

    return {
      success: true,
      role: "chef",
      ...result,
    };
  } catch {
    return chefFallback(question, options);
  }
}

// ─── NUTRITIONNISTE ──────────────────────────────────────────
export async function askNutritionniste(question, options = {}) {
  const context = buildContext(options);
  const message = `${question}\n\n${context}`;

  try {
    const result = await callClaude(SYSTEM_PROMPTS.nutritionniste, message, 1024);
    return {
      success: true,
      role: "nutritionniste",
      ...result,
    };
  } catch {
    return nutritionnisteFallback(question, options);
  }
}

// ─── VALIDATION RECETTE PAR LE CHEF ──────────────────────────
export async function validateRecipeWithChef(recipe) {
  const message = `Valide cette recette et corrige si nécessaire :
Nom : ${recipe.name}
Ingrédients : ${(recipe.ingredients || []).join(", ")}
Étapes : ${(recipe.steps || []).length} étapes
Nutrition : ${recipe.nutrition?.kcal || "?"} kcal

Vérifie :
1. Les quantités sont-elles réalistes ?
2. Les étapes sont-elles assez détaillées (minimum 5) ?
3. La nutrition est-elle cohérente avec les ingrédients ?
4. Manque-t-il des astuces ou erreurs courantes ?

Réponds en JSON :
{
  "score": number (0-100),
  "valid": boolean,
  "corrections": ["correction 1", "..."],
  "missingSteps": ["étape manquante 1", "..."],
  "nutritionAccurate": boolean,
  "suggestions": ["suggestion 1", "..."]
}`;

  try {
    const result = await callClaude(SYSTEM_PROMPTS.chef, message, 800);
    return { success: true, ...result };
  } catch {
    // Fallback : validation locale
    return validateRecipeLocally(recipe);
  }
}

// ─── VALIDATION PLAN NUTRITIONNEL ────────────────────────────
export async function validateMealPlanWithNutritionist(plan) {
  const daysSummary = (plan.days || []).map(d =>
    `${d.dayName}: ${Object.values(d.meals || {}).filter(Boolean).map(m => m.name).join(" + ")} = ${d.dailyTotals?.kcal || "?"} kcal`
  ).join("\n");

  const message = `Valide ce plan nutritionnel hebdomadaire :
Objectif calorique : ${plan.targetCalories} kcal/jour
${daysSummary}

Vérifie l'équilibre, la variété, et la cohérence avec l'objectif.
Réponds en JSON :
{
  "score": number (0-100),
  "balanced": boolean,
  "variety": "haute|moyenne|basse",
  "corrections": ["..."],
  "dailyAdvice": "conseil global"
}`;

  try {
    const result = await callClaude(SYSTEM_PROMPTS.nutritionniste, message, 800);
    return { success: true, ...result };
  } catch {
    return {
      success: false,
      score: 70,
      balanced: true,
      variety: "moyenne",
      corrections: [],
      dailyAdvice: "Plan généré automatiquement — ajuste selon tes sensations.",
    };
  }
}

// ─── VALIDATION LOCALE (SANS API) ────────────────────────────
function validateRecipeLocally(recipe) {
  const issues = [];
  let score = 100;

  // Vérifier nombre d'étapes
  const stepCount = (recipe.steps || []).length;
  if (stepCount < 5) {
    issues.push(`Seulement ${stepCount} étapes — minimum recommandé : 5`);
    score -= 15;
  }

  // Vérifier présence d'ingrédients
  const ingCount = (recipe.ingredients || []).length;
  if (ingCount < 3) {
    issues.push(`${ingCount} ingrédients seulement — recette trop simple`);
    score -= 10;
  }

  // Vérifier nutrition
  if (!recipe.nutrition?.kcal) {
    issues.push("Nutrition non renseignée");
    score -= 10;
  } else if (recipe.nutrition.kcal < 50 || recipe.nutrition.kcal > 2000) {
    issues.push(`Calories suspectes : ${recipe.nutrition.kcal} kcal`);
    score -= 15;
  }

  // Vérifier astuces et erreurs
  if (!recipe.tips?.length) {
    issues.push("Aucune astuce de chef");
    score -= 5;
  }
  if (!recipe.mistakes?.length) {
    issues.push("Aucune erreur courante listée");
    score -= 5;
  }

  // Vérifier temps réalistes
  const totalTime = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0);
  if (totalTime === 0) {
    issues.push("Temps de préparation/cuisson manquants");
    score -= 10;
  }

  return {
    success: true,
    score: Math.max(0, score),
    valid: score >= 60,
    corrections: issues,
    missingSteps: [],
    nutritionAccurate: !!recipe.nutrition?.kcal,
    suggestions: issues.length ? ["Enrichir la recette avec plus de détails"] : [],
  };
}

// ─── FALLBACKS (HORS LIGNE) ─────────────────────────────────
function chefFallback(question, options = {}) {
  const q = (question || "").toLowerCase();
  const catalogResults = ALL_RECIPES.filter(r => {
    const hay = [r.name, ...(r.tags || []), ...(r.ingredients || [])].join(" ").toLowerCase();
    return q.split(/\s+/).some(w => w.length > 2 && hay.includes(w));
  });

  if (catalogResults.length > 0) {
    const recipe = catalogResults[0];
    return {
      success: false,
      role: "chef",
      name: recipe.name,
      description: recipe.description,
      difficulty: recipe.difficulty,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tips: recipe.tips || [],
      mistakes: recipe.mistakes || [],
      nutrition: recipe.nutrition || {},
      image: getRecipeImage(recipe.id),
      fallback: true,
    };
  }

  return {
    success: false,
    role: "chef",
    name: "Suggestion Chef",
    description: "Je n'ai pas pu générer de recette en ligne. Voici une suggestion du catalogue.",
    fallback: true,
  };
}

function nutritionnisteFallback(question, options = {}) {
  const goal = options.goal || "maintain";
  const advice = {
    lose: "Privilégie les protéines maigres (poisson, poulet) et beaucoup de légumes. Réduis les glucides le soir.",
    gain: "Augmente tes portions de riz, igname et banane plantain. Ajoute une collation protéinée l'après-midi.",
    maintain: "Continue avec un bon équilibre protéines/légumes/glucides complexes. Hydrate-toi bien.",
  };

  return {
    success: false,
    role: "nutritionniste",
    analysis: advice[goal] || advice.maintain,
    score: 65,
    corrections: [],
    alternatives: [],
    dailyAdvice: "Écoute ton corps et adapte tes portions selon ta faim réelle.",
    fallback: true,
  };
}
