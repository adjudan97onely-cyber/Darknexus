import { ALL_RECIPES } from "../data/recipes";
export { ALL_RECIPES };

function estimateRecipeNutrition(ingredients) {
  const base = { kcal: 350, protein: 20, carbs: 40, fat: 15 };
  const n = ingredients.length;
  return {
    kcal: base.kcal + n * 15,
    protein: base.protein + n * 2,
    carbs: base.carbs + n * 3,
    fat: base.fat + n,
  };
}

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
  const nutrition = { kcal: 450, protein: 25, carbs: 45, fat: 18 };
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
  }).sort((a, b) => b.score - a.score);

  // Si on a des bonnes recettes créoles, on les met en avant
  const creoleFirst = catalog.filter(r => 
    r.tags && (r.tags.includes("guadeloupe") || r.tags.includes("martinique") || 
    r.tags.includes("tradition") || r.tags.includes("antillaise"))
  );
  
  const rest = catalog.filter(r => !creoleFirst.find(c => c.id === r.id));
  const sorted = [...creoleFirst, ...rest];

  // Compléter avec du dynamique seulement si pas assez
  if (sorted.length >= safeLimit) return sorted.slice(0, safeLimit);

  const dynamic = generateDynamicRecipesFromIngredients(list, {
    ...options,
    limit: safeLimit - sorted.length,
  });

  return [...sorted, ...dynamic].slice(0, safeLimit);
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
  const ingredients = toIngredients(context.ingredients || []);

  // 1. Cherche d'abord dans le catalogue local
  const catalogResults = smartSearchRecipes(question);
  const topRecipe = catalogResults?.[0] || null;

  // 2. Appel Claude pour une réponse intelligente
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Tu es un expert en cuisine antillaise ET nutritionniste professionnel pour l'app Killagain Food.

Question de l'utilisateur : "${question}"
Ingrédients disponibles : ${ingredients.length > 0 ? ingredients.join(", ") : "non précisés"}
${topRecipe ? `Recette trouvée dans le catalogue : ${topRecipe.name}` : "Aucune recette trouvée dans le catalogue."}

Réponds en JSON valide UNIQUEMENT :
{
  "title": "Titre court et accrocheur",
  "answer": "Réponse complète, précise, utile. Si c'est une question nutrition (perdre du poids, prendre de la masse, calories...) donne un vrai plan d'action concret. Si c'est une recette, donne les points clés. Si c'est un conseil, sois précis et actionnable. MAX 4 phrases percutantes.",
  "conseil_bonus": "Un conseil bonus surprenant que l'utilisateur n'attend pas",
  "actions": ["Action 1", "Action 2", "Action 3"]
}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return {
      title: result.title,
      answer: result.answer,
      conseil_bonus: result.conseil_bonus,
      recipe: topRecipe,
      actions: result.actions || ["Voir recette", "Alternatives", "Mode Chef IA"],
    };

  } catch {
    // Fallback si l'API échoue
    if (topRecipe) {
      return {
        title: `Recette : ${topRecipe.name}`,
        answer: `${topRecipe.name} — ${topRecipe.difficulty}, ${topRecipe.prepMinutes + topRecipe.cookMinutes} min, ${topRecipe.nutrition?.kcal} kcal. ${topRecipe.description || ""}`,
        recipe: topRecipe,
        actions: ["Voir recette complète", "Alternatives", "Mode Chef IA"],
      };
    }
    return {
      title: "Coach Killagain",
      answer: "Pose-moi une question sur la cuisine antillaise ou la nutrition — je suis là pour t'aider !",
      actions: ["Scanner mes ingrédients", "Mode Surprise", "Mode Chef IA"],
    };
  }
}
