import { ALL_RECIPES } from "../data/recipes";
import { estimateRecipeNutrition } from "./nutritionEngineService";

export const CUISINE_MODES = ["all", "francaise", "healthy", "rapide", "monde"];

const PANTRY_BASICS = ["sel", "poivre", "huile d'olive", "ail", "oignon"];

const TEMPLATES = [
  {
    type: "omelette",
    names: {
      francaise: "Omelette bistro",
      healthy: "Omelette proteinee verte",
      rapide: "Omelette express",
      monde: "Omelette fusion",
      all: "Omelette maison",
    },
    tags: ["oeufs", "rapide", "poele"],
    defaultIngredients: ["oeufs", "fromage", "oignon"],
    prep: 7,
    cook: 8,
  },
  {
    type: "bowl",
    names: {
      francaise: "Bol complet fermier",
      healthy: "Power bowl equilibre",
      rapide: "Bowl minute",
      monde: "Bowl du monde",
      all: "Bowl nutritif",
    },
    tags: ["bowl", "equilibre", "meal-prep"],
    defaultIngredients: ["riz", "poulet", "tomate"],
    prep: 12,
    cook: 15,
  },
  {
    type: "gratin",
    names: {
      francaise: "Gratin de placard",
      healthy: "Gratin leger legumes",
      rapide: "Mini gratin express",
      monde: "Gratin fusion epice",
      all: "Gratin maison",
    },
    tags: ["four", "comfort", "familial"],
    defaultIngredients: ["fromage", "farine", "lait", "tomate"],
    prep: 15,
    cook: 25,
  },
  {
    type: "poelee",
    names: {
      francaise: "Poelee paysanne",
      healthy: "Poelee light proteinee",
      rapide: "Poelee 15 minutes",
      monde: "Poelee facon wok",
      all: "Poelee complete",
    },
    tags: ["poelee", "one-pan", "simple"],
    defaultIngredients: ["poulet", "carotte", "oignon"],
    prep: 10,
    cook: 14,
  },
  {
    type: "soupe",
    names: {
      francaise: "Soupe rustique",
      healthy: "Soupe detox maison",
      rapide: "Veloute express",
      monde: "Soupe epicee du monde",
      all: "Soupe reconfort",
    },
    tags: ["soupe", "chaud", "batch"],
    defaultIngredients: ["tomate", "oignon", "carotte"],
    prep: 10,
    cook: 22,
  },
  {
    type: "tartine",
    names: {
      francaise: "Tartine gratinee",
      healthy: "Tartine proteinee",
      rapide: "Tartine chrono",
      monde: "Tartine street fusion",
      all: "Tartine gourmande",
    },
    tags: ["snack", "rapide", "four"],
    defaultIngredients: ["pain", "fromage", "tomate"],
    prep: 6,
    cook: 7,
  },
  {
    type: "quiche",
    names: {
      francaise: "Quiche du frigo",
      healthy: "Quiche legere sans stress",
      rapide: "Quiche express poele/four",
      monde: "Quiche fusion epice douce",
      all: "Quiche maison",
    },
    tags: ["quiche", "four", "batch"],
    defaultIngredients: ["oeufs", "fromage", "farine", "lait"],
    prep: 15,
    cook: 28,
  },
  {
    type: "ceviche",
    names: {
      francaise: "Poisson mariné citron",
      healthy: "Ceviche lean",
      rapide: "Ceviche minute",
      monde: "Ceviche latino",
      all: "Ceviche maison",
    },
    tags: ["poisson", "citron", "frais"],
    defaultIngredients: ["poisson", "citron", "oignon"],
    prep: 12,
    cook: 0,
  },
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function toIngredients(input) {
  if (Array.isArray(input)) return unique(input.map((v) => normalize(v)));
  if (!input) return [];
  return unique(
    String(input)
      .split(/[,+;/\n]+/)
      .map((v) => normalize(v))
  );
}

function scoreRecipe(recipe, ingredients) {
  const list = toIngredients(ingredients);
  const base = (recipe.ingredients || []).join(" ").toLowerCase();
  const matches = list.filter((item) => base.includes(item));
  const ratio = matches.length / Math.max(list.length, 1);
  const speed = Math.max(0, (60 - (recipe.prepMinutes || 0) - (recipe.cookMinutes || 0)) / 60);
  const generatedBonus = recipe.source === "ai-generated" ? 0.08 : 0;
  return Math.min(100, Math.round((ratio * 0.72 + speed * 0.2 + generatedBonus) * 100));
}

function makeId(prefix, index, ingredients) {
  const sig = toIngredients(ingredients)
    .slice(0, 3)
    .join("-")
    .replace(/[^a-z0-9-]/g, "");
  return `ai-${prefix}-${sig || "mix"}-${index}`;
}

function buildSteps(name, ingredients) {
  const list = toIngredients(ingredients);
  const first = list.slice(0, 3).join(", ") || "tes ingredients";
  return [
    `Prepare ${first} et rassemble les basiques (sel, poivre, huile).`,
    `Lance la base de ${name.toLowerCase()} en cuisson douce pour fixer les saveurs.`,
    "Ajuste la texture (eau, creme, citron ou bouillon selon le resultat).",
    "Rectifie assaisonnement puis dresse proprement avec une touche fraiche.",
  ];
}

function makeGeneratedRecipe(template, index, ingredients, cuisine = "all", mode = "normal") {
  const baseIngredients = toIngredients(ingredients);
  const picked = unique([...baseIngredients, ...template.defaultIngredients]).slice(0, 8);
  const nameBase = template.names[cuisine] || template.names.all;
  const name = mode === "chef" ? `${nameBase} signature Chef IA` : nameBase;
  const nutrition = estimateRecipeNutrition([...picked, ...PANTRY_BASICS]);
  const difficulty = mode === "chef" ? "Intermediaire" : template.cook > 20 ? "Intermediaire" : "Facile";

  const recipe = {
    id: makeId(template.type, index, picked),
    name,
    tags: unique([cuisine, mode, ...template.tags]),
    source: "ai-generated",
    image: "",
    imagePrompt: `${name}, plated realistic food photography`,
    prepMinutes: template.prep,
    restMinutes: 0,
    cookMinutes: template.cook,
    difficulty,
    ingredients: [...picked, ...PANTRY_BASICS.slice(0, 2)],
    steps: buildSteps(name, picked),
    tips: [
      "Garde une source de proteines + legumes pour l'equilibre.",
      "Ajoute une herbe fraiche en finition pour une version premium.",
    ],
    mistakes: ["Cuisson trop forte", "Assaisonnement non goute en fin de recette"],
    nutrition,
    cuisine,
  };

  return {
    ...recipe,
    score: scoreRecipe(recipe, picked),
    matchReason: `Generation IA basee sur tes ingredients (${picked.slice(0, 4).join(", ")}).`,
  };
}

export function generateDynamicRecipesFromIngredients(ingredients, options = {}) {
  const list = toIngredients(ingredients);
  const limit = Math.max(6, Number(options.limit) || 10);
  const cuisine = CUISINE_MODES.includes(options.cuisine) ? options.cuisine : "all";
  const mode = options.mode === "chef" ? "chef" : "normal";

  const generated = [];
  let cursor = 0;

  while (generated.length < limit) {
    const template = TEMPLATES[cursor % TEMPLATES.length];
    generated.push(makeGeneratedRecipe(template, cursor + 1, list, cuisine, mode));
    cursor += 1;
  }

  return generated;
}

export function recommendRecipesFromIngredients(ingredients, limit = 10, options = {}) {
  const list = toIngredients(ingredients);
  const safeLimit = Math.max(6, Number(limit) || 10);

  const catalog = ALL_RECIPES.map((recipe) => {
    const score = scoreRecipe(recipe, list);
    return {
      ...recipe,
      source: "catalog",
      score,
      matchReason: `Compatibilite ${score}% avec tes ingredients disponibles.`,
    };
  });

  const dynamic = generateDynamicRecipesFromIngredients(list, {
    ...options,
    limit: safeLimit,
  });

  const merged = [...dynamic, ...catalog]
    .sort((a, b) => b.score - a.score)
    .reduce((acc, item) => {
      if (!acc.find((it) => it.name.toLowerCase() === item.name.toLowerCase())) acc.push(item);
      return acc;
    }, []);

  return merged.slice(0, safeLimit);
}

export function surpriseBalancedRecipe() {
  const pools = [
    ["poulet", "riz", "brocoli", "tomate"],
    ["oeufs", "pain", "avocat", "tomate"],
    ["poisson", "citron", "oignon", "carotte"],
    ["tofu", "pates", "courgette", "ail"],
  ];
  const index = new Date().getMinutes() % pools.length;
  return generateDynamicRecipesFromIngredients(pools[index], {
    limit: 1,
    cuisine: "healthy",
    mode: "chef",
  })[0];
}

export function smartSearchRecipes(query) {
  const q = normalize(query);
  if (!q) return ALL_RECIPES;

  const results = ALL_RECIPES.filter((recipe) => {
    const hay = [
      recipe.name,
      (recipe.tags || []).join(" "),
      (recipe.ingredients || []).join(" "),
      (recipe.steps || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  if (results.length >= 4) return results;

  const dynamic = generateDynamicRecipesFromIngredients(toIngredients(q), {
    limit: 8,
    cuisine: "all",
  });

  return [...results, ...dynamic];
}

export async function askCookingAssistant(question, context = {}) {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const lower = normalize(question);
  const ingredients = toIngredients(context.ingredients || []);

  if (lower.includes("surprendre")) {
    const pick = surpriseBalancedRecipe();
    return {
      title: "Mode Surprise active",
      answer: `Je te propose ${pick.name}: ${pick.nutrition.kcal} kcal avec P ${pick.nutrition.protein} g / G ${pick.nutrition.carbs} g / L ${pick.nutrition.fat} g.`,
      actions: ["Voir recette", "Regenerer une surprise"],
    };
  }

  if (lower.includes("chef")) {
    const pick = generateDynamicRecipesFromIngredients(ingredients, { limit: 1, mode: "chef" })[0];
    return {
      title: "Chef IA - recette creative",
      answer: `Avec ${ingredients.join(", ") || "peu d'ingredients"}, je t'ai cree ${pick.name}. C'est une recette originale et equilibree, faisable rapidement.`,
      actions: ["Voir recette", "Version plus rapide", "Version plus healthy"],
    };
  }

  if (ingredients.length > 0) {
    const top = recommendRecipesFromIngredients(ingredients, 1, { cuisine: "all" })[0];
    return {
      title: "Idee immediate avec ton frigo",
      answer: `Je te recommande ${top.name}. Profil nutrition: ${top.nutrition.kcal} kcal, ${top.nutrition.protein} g proteines.`,
      actions: ["Voir recette", "Afficher alternatives", "Mode Chef IA"],
    };
  }

  return {
    title: "Coach culinaire intelligent",
    answer:
      "Donne-moi tes ingredients (ex: oeufs, fromage, farine) et je genere plusieurs recettes francaises, healthy, rapides et du monde, meme hors catalogue.",
    actions: ["Scanner mes ingredients", "Mode Surprise", "Mode Chef IA"],
  };
}
