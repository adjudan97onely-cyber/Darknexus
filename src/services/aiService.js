import {
  CUISINE_MODES,
  formatIngredientLine,
  generateRecipeCandidates,
  scaleRecipeForServings,
} from "../core/recipeEngine";
import { ALL_RECIPES } from "../data/recipes";
import { normalizeUserProfile, recipeBlockedByProfile } from "../core/userProfile";
import { getUserProfile } from "./userProfileService";
import { applyAdminControls, recordGeneratedRecipes } from "./adminContentService";
import { getDishes, matchByIngredients } from "../core/dishKnowledge";
import { DEFAULT_CHEF_LEVEL } from "../core/chefLevel";
import { generateChefStarRecipes } from "../core/chefStarEngine";

/**
 * Parse une quantité brute d'ingrédient ("800g", "2 cs", "3 branches", "2") 
 * en { quantity: number, unit: string }
 */
function parseIngredientQuantity(raw) {
  if (!raw || typeof raw !== "string") return { quantity: 1, unit: "" };
  const trimmed = raw.trim();
  // "800g" ou "500ml" — nombre collé à l'unité
  const collé = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|l|dl)$/i);
  if (collé) return { quantity: parseFloat(collé[1].replace(",", ".")), unit: collé[2].toLowerCase() };
  // "2 cs", "3 branches", "4 gousses", "1 boîte"
  const séparé = trimmed.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (séparé) return { quantity: parseFloat(séparé[1].replace(",", ".")), unit: séparé[2] };
  // Nombre seul "2", "3"
  const nombre = trimmed.match(/^(\d+(?:[.,]\d+)?)$/);
  if (nombre) return { quantity: parseFloat(nombre[1].replace(",", ".")), unit: "" };
  // Texte seul ("QS", "à goût")
  return { quantity: 1, unit: trimmed };
}

// Configuration globale: niveau chef (par défaut niveau 10 = Chef Étoilé)
let GLOBAL_CHEF_LEVEL = DEFAULT_CHEF_LEVEL;
export function setChefLevel(level) {
  GLOBAL_CHEF_LEVEL = Math.max(1, Math.min(10, Number(level) || DEFAULT_CHEF_LEVEL));
}
export function getChefLevel() {
  return GLOBAL_CHEF_LEVEL;
}

const CULINARY_KNOWLEDGE = [
  {
    key: "bokit",
    aliases: ["bokit", "bokits"],
    cuisine: "antillaise",
    slot: "snack",
    fundamentals: ["pate levee", "friture chaude", "garniture apres cuisson"],
    baseIngredients: ["farine", "levure boulangere", "eau", "sel", "huile"],
  },
  {
    key: "colombo",
    aliases: ["colombo", "colombo poulet", "colombo de poulet"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["marinade", "epices colombo", "mijotage progressif"],
    baseIngredients: ["poulet", "oignon", "ail", "tomate", "citron", "thym"],
  },
  {
    key: "blaff",
    aliases: ["blaff", "blaff poisson", "blaff de poisson"],
    cuisine: "antillaise",
    slot: "dinner",
    fundamentals: ["bouillon aromatique", "pochage doux", "finition citron"],
    baseIngredients: ["poisson", "citron", "oignon", "tomate", "thym"],
  },
  {
    key: "accras",
    aliases: ["accras", "accras morue", "accras crevettes", "accras legumes", "accras malanga", "acras"],
    cuisine: "antillaise",
    slot: "snack",
    fundamentals: ["morue dessalee", "pate epicee", "friture courte"],
    baseIngredients: ["morue", "farine", "oignon", "ail", "levure chimique"],
  },
  {
    key: "poyo",
    aliases: ["poyo", "ti nain", "ti-nain", "banane verte", "tinain", "poyo lentilles", "poyo poisson"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["banane verte bouillie", "accompagnement proteine", "sauce chien ou vinaigrette"],
    baseIngredients: ["banane verte", "morue", "citron vert", "oignon", "cive"],
  },
  {
    key: "agoulou",
    aliases: ["agoulou", "sandwich antillais", "agoulou poulet", "agoulou epice", "agoulou sauce riche"],
    cuisine: "antillaise",
    slot: "snack",
    fundamentals: ["pain croustillant", "sauce chien", "garniture genereuse"],
    baseIngredients: ["baguette", "poulet", "citron vert", "oignon", "cive"],
  },
  {
    key: "poulet-boucane",
    aliases: ["poulet boucane", "poulet-boucane", "boucane", "poulet fume"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["marinade longue", "cuisson lente", "glacage final"],
    baseIngredients: ["poulet", "paprika", "ail", "citron vert", "sauce soja"],
  },
  {
    key: "riz-colle",
    aliases: ["riz colle", "riz-colle", "riz colle haricots", "riz haricots rouges"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["rincage du riz", "lait de coco", "cuisson couverte sans remuer"],
    baseIngredients: ["riz", "haricots rouges", "lait de coco", "oignon", "thym"],
  },
  {
    key: "dombre",
    aliases: ["dombre", "dombré", "dombre crevettes", "dombré crevettes", "dombre haricots", "dombré haricots", "dombre poisson", "dombré poisson", "dombre queue de cochon"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["pate farinee", "sauce mijotee", "cuisson des dombrés dans la sauce"],
    baseIngredients: ["farine", "crevette", "oignon", "tomate", "ail"],
  },
  {
    key: "court-bouillon",
    aliases: ["court-bouillon", "court bouillon", "court-bouillon antillais"],
    cuisine: "antillaise",
    slot: "dinner",
    fundamentals: ["base tomate aromatique", "poisson en fin de cuisson", "mijotage doux"],
    baseIngredients: ["poisson", "tomate", "oignon", "ail", "citron"],
  },
  {
    key: "bebele",
    aliases: ["bebele", "bébélé", "bebele guadeloupe", "tripes banane verte"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["tripes blanchies", "legumes racines", "dombres", "lait de coco"],
    baseIngredients: ["tripes", "banane verte", "malanga", "giraumon", "farine", "lait de coco"],
  },
  {
    key: "matete-crabe",
    aliases: ["matete", "matété", "matete crabe", "matété de crabe", "matoutou", "riz au crabe"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["crabe colore", "riz cuit par absorption", "lait de coco", "aromates antillais"],
    baseIngredients: ["crabe", "riz", "lait de coco", "tomate", "oignon", "thym"],
  },
  {
    key: "chodo",
    aliases: ["chodo", "chaudeau", "chaudeau antillais", "creme antillaise"],
    cuisine: "antillaise",
    slot: "dessert",
    fundamentals: ["creme aux oeufs", "cuisson douce sans ebullition", "parfum amande amere"],
    baseIngredients: ["lait", "oeuf", "cannelle", "vanille", "citron vert", "amande amere"],
  },
  {
    key: "pate-en-pot",
    aliases: ["pate en pot", "pâté en pot", "soupe martiniquaise", "soupe de fete"],
    cuisine: "antillaise",
    slot: "lunch",
    fundamentals: ["abats blanchis et mijoter", "legumes racines", "vermicelles", "aromates forts"],
    baseIngredients: ["abats mouton", "igname", "giraumon", "carotte", "thym", "laurier"],
  },
  {
    key: "gratin",
    aliases: ["gratin", "gratin dauphinois", "gratin de legumes"],
    cuisine: "francaise",
    slot: "lunch",
    fundamentals: ["base liee creme/lait", "cuisson au four", "surface gratinee"],
    baseIngredients: ["farine", "lait", "fromage", "beurre", "oignon"],
  },
  {
    key: "omelette",
    aliases: ["omelette", "omelette fromage", "omelette legumes"],
    cuisine: "francaise",
    slot: "breakfast",
    fundamentals: ["oeufs battus sans excès", "cuisson douce", "pliage en fin"],
    baseIngredients: ["oeuf", "oignon", "fromage", "tomate"],
  },
  {
    key: "quiche",
    aliases: ["quiche", "quiche lorraine", "quiche legumes"],
    cuisine: "francaise",
    slot: "lunch",
    fundamentals: ["appareil oeufs-creme", "fond de tarte", "cuisson four reguliere"],
    baseIngredients: ["farine", "oeuf", "creme", "fromage", "oignon"],
  },
  {
    key: "sauce-creme",
    aliases: ["sauce creme", "sauce a la creme", "sauce creme fraiche"],
    cuisine: "francaise",
    slot: "lunch",
    fundamentals: ["base aromatique douce", "liaison creme", "reduction controlee"],
    baseIngredients: ["creme", "oignon", "ail", "beurre", "poivre"],
  },
  {
    key: "tarte",
    aliases: ["tarte", "tarte salee", "tarte aux legumes", "tarte tomate"],
    cuisine: "francaise",
    slot: "lunch",
    fundamentals: ["fond de pate regulier", "garniture equilibree", "cuisson four stable"],
    baseIngredients: ["farine", "beurre", "oeuf", "tomate", "oignon"],
  },
  {
    key: "pizza",
    aliases: ["pizza", "pizza maison", "margherita"],
    cuisine: "monde",
    slot: "dinner",
    fundamentals: ["pate hydratee", "garniture dosee", "four tres chaud"],
    baseIngredients: ["farine", "levure boulangere", "tomate", "fromage", "huile"],
  },
  {
    key: "burger",
    aliases: ["burger", "hamburger", "cheeseburger"],
    cuisine: "monde",
    slot: "lunch",
    fundamentals: ["pain moelleux", "steak saisi", "montage minute"],
    baseIngredients: ["farine", "levure boulangere", "boeuf", "fromage", "oignon"],
  },
  {
    key: "pain-au-beurre",
    aliases: ["pain au beurre", "pain-au-beurre", "pain beurre antillais"],
    cuisine: "antillaise",
    slot: "breakfast",
    fundamentals: ["pate enrichie", "petrissage progressif", "levage puis cuisson doree"],
    baseIngredients: ["farine", "beurre", "oeuf", "lait", "levure boulangere"],
  },
];

const KNOWLEDGE_RECIPE_FALLBACKS = {
  gratin: {
    id: "classic-gratin-expert",
    name: "Gratin cremeux maison",
    cuisine: "francaise",
    style: "classique",
    difficulty: "Facile",
    prepMinutes: 15,
    cookMinutes: 35,
    restMinutes: 8,
    servings: 2,
    ingredients: ["pomme de terre", "creme", "lait", "fromage", "beurre", "sel", "poivre"],
    steps: [
      "Prechauffer le four a 180C et beurrer un plat allant au four.",
      "Emincer finement les pommes de terre pour une cuisson uniforme.",
      "Melanger creme, lait, sel et poivre puis napper les couches de pommes de terre.",
      "Ajouter le fromage sur le dessus et enfourner 35 minutes jusqu'a surface doree.",
      "Laisser reposer 8 minutes avant de servir pour stabiliser la texture.",
    ],
    nutrition: { kcal: 560, protein: 18, carbs: 42, fat: 34 },
  },
  quiche: {
    id: "classic-quiche-expert",
    name: "Quiche maison facile",
    cuisine: "francaise",
    style: "bistrot",
    difficulty: "Facile",
    prepMinutes: 18,
    cookMinutes: 30,
    restMinutes: 8,
    servings: 2,
    ingredients: ["farine", "oeuf", "creme", "fromage", "oignon", "beurre", "sel", "poivre"],
    steps: [
      "Prechauffer le four a 180C et preparer un moule.",
      "Foncer une pate dans le moule puis piquer le fond a la fourchette.",
      "Faire revenir l'oignon 3 minutes a feu doux.",
      "Battre oeufs et creme, ajouter fromage, oignon, sel et poivre.",
      "Verser dans le moule et cuire 30 minutes jusqu'a coloration reguliere.",
    ],
    nutrition: { kcal: 590, protein: 24, carbs: 36, fat: 38 },
  },
  "sauce-creme": {
    id: "classic-sauce-creme-expert",
    name: "Sauce creme onctueuse",
    cuisine: "francaise",
    style: "classique",
    difficulty: "Facile",
    prepMinutes: 8,
    cookMinutes: 12,
    restMinutes: 0,
    servings: 2,
    ingredients: ["creme", "oignon", "ail", "beurre", "sel", "poivre"],
    steps: [
      "Faire fondre une noix de beurre puis suer oignon et ail 2 minutes a feu doux.",
      "Ajouter la creme et melanger regulierement pour eviter que ca accroche.",
      "Cuire a petits bouillons 6 a 8 minutes jusqu'a texture nappante.",
      "Assaisonner en fin de cuisson et servir immediatement.",
    ],
    nutrition: { kcal: 320, protein: 4, carbs: 6, fat: 31 },
  },
  tarte: {
    id: "classic-tarte-salee-expert",
    name: "Tarte salee maison",
    cuisine: "francaise",
    style: "classique",
    difficulty: "Facile",
    prepMinutes: 20,
    cookMinutes: 30,
    restMinutes: 5,
    servings: 2,
    ingredients: ["farine", "beurre", "oeuf", "tomate", "oignon", "fromage", "sel", "poivre"],
    steps: [
      "Prechauffer le four a 180C et preparer un moule a tarte.",
      "Etaler la pate, foncer le moule et piquer le fond.",
      "Faire revenir l'oignon 3 minutes pour concentrer les saveurs.",
      "Repartir tomate, oignon et fromage de facon homogene.",
      "Cuire 30 minutes puis laisser reposer 5 minutes avant decoupe.",
    ],
    nutrition: { kcal: 520, protein: 18, carbs: 42, fat: 30 },
  },
  pizza: {
    id: "classic-pizza-maison-expert",
    name: "Pizza maison crousti-moelleuse",
    cuisine: "monde",
    style: "street-food",
    difficulty: "Intermediaire",
    prepMinutes: 20,
    cookMinutes: 12,
    restMinutes: 60,
    servings: 2,
    ingredients: ["farine", "levure boulangere", "eau", "tomate", "fromage", "huile", "sel"],
    steps: [
      "Petrir farine, eau, levure, huile et sel jusqu'a pate lisse.",
      "Laisser lever 1 heure couvert pour obtenir une pate souple.",
      "Etaler sans ecraser les bords, ajouter sauce tomate et fromage.",
      "Cuire en four tres chaud 10 a 12 minutes.",
      "Servir immediatement pour garder le contraste croustillant/moelleux.",
    ],
    nutrition: { kcal: 640, protein: 24, carbs: 72, fat: 26 },
  },
  burger: {
    id: "classic-burger-maison-expert",
    name: "Burger maison equilibre",
    cuisine: "monde",
    style: "street-food",
    difficulty: "Facile",
    prepMinutes: 18,
    cookMinutes: 12,
    restMinutes: 2,
    servings: 2,
    ingredients: ["pain burger", "boeuf", "fromage", "oignon", "tomate", "salade", "sel", "poivre"],
    steps: [
      "Former les steaks sans trop tasser pour conserver le moelleux.",
      "Saisir les steaks 2 a 3 minutes par face selon cuisson souhaitee.",
      "Toaster legerement les pains pour eviter qu'ils se ramollissent.",
      "Monter burger avec fromage, legumes et assaisonnement juste avant service.",
      "Servir chaud avec accompagnement leger.",
    ],
    nutrition: { kcal: 700, protein: 34, carbs: 45, fat: 40 },
  },
  "pain-au-beurre": {
    id: "classic-pain-au-beurre-expert",
    name: "Pain au beurre antillais",
    cuisine: "antillaise",
    style: "boulangerie",
    difficulty: "Intermediaire",
    prepMinutes: 25,
    cookMinutes: 28,
    restMinutes: 90,
    servings: 2,
    ingredients: ["farine", "beurre", "oeuf", "lait", "levure boulangere", "sucre", "sel"],
    steps: [
      "Petrir farine, levure, lait, oeuf, sucre et sel jusqu'a debut d'elasticite.",
      "Incorporer le beurre mou progressivement puis petrir jusqu'a pate brillante.",
      "Laisser lever 1 heure a temperature ambiante.",
      "Faconner, dorer a l'oeuf et laisser pousser 30 minutes.",
      "Cuire 25 a 28 minutes a 175C jusqu'a belle coloration doree.",
    ],
    nutrition: { kcal: 560, protein: 13, carbs: 62, fat: 28 },
  },
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toIngredients(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((item) => normalize(typeof item === "string" ? item : item?.name)).filter(Boolean))];
  }
  if (!input) return [];
  return [...new Set(String(input).split(/[,+;/\n]+/).map((value) => normalize(value)).filter(Boolean))];
}

function inferCuisine(query) {
  const q = normalize(query);
  if (q.includes("boulanger") || q.includes("patis")) return "francaise";
  if (q.includes("antill")) return "antillaise";
  if (q.includes("healthy") || q.includes("leger")) return "healthy";
  if (q.includes("rapide") || q.includes("express")) return "rapide";
  if (q.includes("franc")) return "francaise";
  if (q.includes("monde") || q.includes("fusion")) return "monde";
  return "all";
}

function inferSlot(query) {
  const q = normalize(query);
  if (q.includes("croissant") || q.includes("brioche") || q.includes("gateau") || q.includes("patis") || q.includes("boulanger") || q.includes("dessert")) return "snack";
  if (q.includes("soir") || q.includes("diner")) return "dinner";
  if (q.includes("matin") || q.includes("petit")) return "breakfast";
  if (q.includes("collation") || q.includes("snack")) return "snack";
  return "lunch";
}

function inferServings(query) {
  const match = String(query || "").match(/(\d+)\s*personne/i);
  return match ? Number(match[1]) : 2;
}

function findKnowledgeDish(query) {
  const q = normalize(query);
  return CULINARY_KNOWLEDGE.find((dish) => dish.aliases.some((alias) => q.includes(normalize(alias)))) || null;
}

function recipeMatchesDish(recipe, dish) {
  if (!recipe || !dish) return false;
  const haystack = [recipe.id, recipe.name]
    .map((item) => normalize(item))
    .join(" ");
  return dish.aliases.some((alias) => haystack.includes(normalize(alias)));
}

function normalizeKnownRecipe(recipe, dish, servings) {
  const safeRecipe = recipe || KNOWLEDGE_RECIPE_FALLBACKS[dish?.key];
  if (!safeRecipe) return null;
  return {
    ...safeRecipe,
    cuisine: safeRecipe.cuisine || dish?.cuisine || "all",
    servings: Number(safeRecipe.servings || servings || 2),
    matchReason: "Recette issue de la base culinaire experte.",
    score: Number(safeRecipe.score || 95),
    steps: Array.isArray(safeRecipe.steps) ? safeRecipe.steps : [],
    ingredients: Array.isArray(safeRecipe.ingredients) ? safeRecipe.ingredients : [],
    nutrition: safeRecipe.nutrition || { kcal: 500, protein: 20, carbs: 40, fat: 25 },
  };
}

function findExpertRecipeForDish(dish, servings, userProfile) {
  const fromCatalog = ALL_RECIPES.find((recipe) => {
    return recipeMatchesDish(recipe, dish);
  });

  if (fromCatalog) {
    return normalizeKnownRecipe({ ...fromCatalog, servings: fromCatalog.servings || servings }, dish, servings);
  }

  const fallback = normalizeKnownRecipe(null, dish, servings);
  if (fallback) {
    return fallback;
  }

  const generated = generateRecipeCandidates(dish.baseIngredients || [], {
    cuisine: dish.cuisine || "all",
    slot: dish.slot || "lunch",
    servings,
    mode: "chef",
    limit: 10,
  });

  const curated = personalizeRecipes(generated, userProfile)
    .sort((a, b) => {
      const aHit = recipeMatchesDish(a, dish) ? 1 : 0;
      const bHit = recipeMatchesDish(b, dish) ? 1 : 0;
      if (aHit !== bHit) return bHit - aHit;
      return (b.score || 0) - (a.score || 0);
    });

  const strictMatch = curated.find((recipe) => recipeMatchesDish(recipe, dish));
  return normalizeKnownRecipe(strictMatch || null, dish, servings);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function ingredientSet(recipe) {
  const detailed = Array.isArray(recipe?.ingredientsDetailed) ? recipe.ingredientsDetailed.map((item) => item?.name) : [];
  const plain = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  return unique((detailed.length ? detailed : plain).map((item) => normalize(item)).filter(Boolean));
}

function formatIngredientLabel(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function resolveBaseType(recipe) {
  const explicit = normalize(recipe?.baseType || recipe?.blueprintKey || recipe?.dishType || recipe?.dishFamily?.split(":").pop());
  if (explicit) return explicit;
  const knownDish = findKnowledgeDish(recipe?.name || "");
  if (knownDish?.key) return knownDish.key;
  return normalize(recipe?.cookingMethod || "plat");
}

function ingredientSimilarity(left, right) {
  const leftSet = new Set(left || []);
  const rightSet = new Set(right || []);
  if (!leftSet.size || !rightSet.size) return 0;
  let intersection = 0;
  leftSet.forEach((item) => {
    if (rightSet.has(item)) intersection += 1;
  });
  return intersection / Math.max(leftSet.size, rightSet.size);
}

function estimateBudgetLabel(recipe) {
  const cheap = ["farine", "oeuf", "oignon", "tomate", "riz", "pomme de terre", "pomme-terre", "ail", "carotte", "pates", "lentilles", "salade", "tortilla"];
  const premium = ["saumon", "crevette", "chatrou", "boeuf", "sole", "fromage", "creme", "avocat"];
  const ingredients = ingredientSet(recipe);
  const cheapCount = ingredients.filter((item) => cheap.some((entry) => item.includes(normalize(entry)))).length;
  const premiumCount = ingredients.filter((item) => premium.some((entry) => item.includes(normalize(entry)))).length;

  if (premiumCount >= 2) return "Premium";
  if (cheapCount >= Math.max(2, Math.ceil(ingredients.length / 2))) return "Petit budget";
  return "Budget moyen";
}

function pickHighlightIngredients(ingredients) {
  const ignored = new Set(["sel", "poivre", "huile d'olive", "huile", "herbes", "eau", "beurre"]);
  return ingredients.filter((item) => !ignored.has(item)).slice(0, 3);
}

export function generateDishName(dish) {
  const baseType = normalize(dish?.baseType);
  const ingredients = pickHighlightIngredients((dish?.ingredients || []).map((item) => normalize(item)));
  const protein = ingredients.find((item) => ["poulet", "boeuf", "poisson", "oeuf", "tofu", "crevette", "morue"].includes(item));
  const vegetable = ingredients.find((item) => ["tomate", "brocoli", "courgette", "epinards", "carotte", "oignon", "poireau", "salade"].includes(item));
  const proteinLabel = formatIngredientLabel(protein);
  const vegetableLabel = formatIngredientLabel(vegetable);

  switch (baseType) {
    case "omelette":
      return vegetableLabel ? `Omelette ${vegetableLabel} herbes` : "Omelette maison";
    case "poelee":
      return proteinLabel ? `Poelee de ${proteinLabel}` : "Poelee de legumes";
    case "quiche":
      return vegetableLabel ? `Quiche ${vegetableLabel} doree` : "Quiche maison";
    case "bowl":
      return proteinLabel ? `Bowl ${proteinLabel} croquant` : "Bowl veggie croquant";
    case "soupe":
      return vegetableLabel ? `Soupe ${vegetableLabel} veloutee` : "Soupe maison";
    case "blaff":
      return proteinLabel ? `Blaff ${proteinLabel}` : "Blaff creole";
    case "curry":
      return proteinLabel ? `Curry ${proteinLabel} coco` : "Curry coco doux";
    case "pizza":
      return vegetableLabel ? `Pizza ${vegetableLabel} maison` : "Pizza maison";
    case "burger":
      return proteinLabel ? `Burger ${proteinLabel} maison` : "Burger maison";
    case "gratin":
      return vegetableLabel ? `Gratin ${vegetableLabel} dore` : "Gratin maison";
    case "tarte":
      return vegetableLabel ? `Tarte ${vegetableLabel} salee` : "Tarte salee";
    case "bokit":
      return "Bokit maison";
    case "colombo":
      return proteinLabel ? `Colombo ${proteinLabel}` : "Colombo maison";
    case "dombre":
      return proteinLabel ? `Dombre ${proteinLabel}` : "Dombre creole";
    case "pain-au-beurre":
      return "Pain au beurre";
    case "brioche":
      return "Brioche maison";
    case "gateau":
      return "Gateau maison";
    case "viennoiserie":
      return "Viennoiserie maison";
    default:
      return proteinLabel ? `${proteinLabel} cuisine maison` : formatIngredientLabel(dish?.name || "Plat maison");
  }
}

function createDishModel(recipe, variations = []) {
  const ingredients = ingredientSet(recipe);
  const model = {
    id: recipe.id,
    name: recipe.name,
    baseType: resolveBaseType(recipe),
    ingredients,
    tags: unique([recipe.cuisine, ...(recipe.tags || [])]),
    variations,
  };
  return {
    ...model,
    name: generateDishName(model),
  };
}

function summarizeVariation(primaryRecipe, candidateRecipe) {
  const primaryIngredients = ingredientSet(primaryRecipe);
  const candidateIngredients = ingredientSet(candidateRecipe);
  const extra = candidateIngredients.filter((item) => !primaryIngredients.includes(item)).slice(0, 2);
  if (extra.length > 0) {
    return `Ajouter ${extra.map(formatIngredientLabel).join(" & ")}`;
  }
  if (candidateRecipe.cookingMethod && candidateRecipe.cookingMethod !== primaryRecipe.cookingMethod) {
    return `Version ${formatIngredientLabel(candidateRecipe.cookingMethod)}`;
  }
  return null;
}

function mergeRecipeGroup(group) {
  const sortedGroup = [...group].sort((a, b) => (b.score || 0) - (a.score || 0));
  const primary = { ...sortedGroup[0] };
  const groupedVariations = unique(sortedGroup.slice(1).map((item) => summarizeVariation(primary, item)).filter(Boolean));
  const dish = createDishModel(primary, groupedVariations);

  return {
    ...primary,
    name: dish.name,
    baseType: dish.baseType,
    budgetLabel: estimateBudgetLabel(primary),
    dish,
    mergedCount: sortedGroup.length,
    variationOptions: unique([...(primary.variants || []), ...groupedVariations]).slice(0, 4),
  };
}

function dedupeDishResults(recipes, limit = 5) {
  const groups = [];
  const rankedRecipes = [...recipes].sort((a, b) => (b.score || 0) - (a.score || 0));

  rankedRecipes.forEach((recipe) => {
    const recipeBaseType = resolveBaseType(recipe);
    const recipeIngredients = ingredientSet(recipe);
    const existingGroup = groups.find((group) => group.baseType === recipeBaseType && ingredientSimilarity(group.referenceIngredients, recipeIngredients) >= 0.7);

    if (existingGroup) {
      existingGroup.items.push(recipe);
      return;
    }

    groups.push({
      baseType: recipeBaseType,
      referenceIngredients: recipeIngredients,
      items: [recipe],
    });
  });

  const merged = groups
    .map((group) => mergeRecipeGroup(group.items))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const distinct = [];
  const remaining = [];
  const seenBaseTypes = new Set();

  merged.forEach((recipe) => {
    if (seenBaseTypes.has(recipe.baseType)) {
      remaining.push(recipe);
      return;
    }
    seenBaseTypes.add(recipe.baseType);
    distinct.push(recipe);
  });

  return [...distinct, ...remaining].slice(0, Math.min(5, Math.max(1, Number(limit) || 5)));
}

function finalizeRecipeCollection(recipes, limit = 5) {
  return attachAlternatives(dedupeDishResults(recipes, limit));
}

function buildPedagogicDishAnswer(recipe, dish, servings) {
  const beginnerSteps = (recipe.steps || []).slice(0, 6).map((step, index) => `${index + 1}) ${step}`);
  const fundamentals = (dish.fundamentals || []).slice(0, 3).join(" • ");
  return [
    `${recipe.name} (base experte ${dish.key}) pour ${servings} personne${servings > 1 ? "s" : ""}.`,
    `Structure pro a respecter: ${fundamentals}.`,
    "Plan debutant pas-a-pas:",
    ...beginnerSteps,
  ].join("\n");
}

function buildChefStarAnswer(recipe) {
  const ctx = recipe.contextValidation;
  const displayName = recipe.dishProfile?.desireName || recipe.name;
  const premiumBadge = ctx?.premiumLabel || "";
  const plaisirBadge = ctx?.plaisirLabel || "";

  const intentBlock = ctx
    ? [
        `📊 Analyse d'intention: ${ctx.intentSummary}`,
        `✅ Pourquoi ce plat: ${ctx.whyMatch}`,
        `📈 Score: ${ctx.scoreDisplay} | ${ctx.coherenceLabel} | ${plaisirBadge}`,
        `🕐 ${ctx.timeLabel} | 💰 ${ctx.budgetLabel} | 🥩 ${ctx.nutritionLabel} | ${premiumBadge}`,
        ``,
      ]
    : [];

  return [
    `✦ ${displayName} ${premiumBadge}`,
    ``,
    ...intentBlock,
    `Signature culinaire: ${recipe.signature || ""}`,
    ``,
    `Fondamentaux essentiels:`,
    ...recipe.fundamentals?.map((f) => `  • ${f}`) || [],
    ``,
    `Techniques maîtrisées:`,
    ...recipe.techniques?.slice(0, 2)?.map((t) => `  • ${t.name}: ${t.timing} min`) || [],
    ``,
    `Timing total: ${recipe.adaptedTiming?.total || 0} min (Prep: ${recipe.adaptedTiming?.prep || 0}min + Cuisson: ${recipe.adaptedTiming?.cook || 0}min${recipe.adaptedTiming?.rest ? ` + Repos: ${recipe.adaptedTiming.rest}min` : ""})`,
    ``,
    `Conseils professionnels:`,
    ...recipe.tips?.slice(0, 2)?.map((tip) => `  ✓ ${tip}`) || [],
    ``,
    `Erreurs à éviter absolument:`,
    ...recipe.mistakes?.slice(0, 2)?.map((mistake) => `  ✗ ${mistake}`) || [],
  ]
    .filter(Boolean)
    .join("\n");
}

function diversify(recipes) {
  // 🔫 PRO: Groupe par (blueprint + cuisine) pour vraie cohérence
  // Exemple: 2 gratins antillais DIFFERENTS !=  1 gratin + 1 accras
  const grouped = [...recipes].reduce((acc, recipe) => {
    // Clé composite: blueprint + cuisine = univers cohérent
    const key = `${recipe.blueprintKey || "default"}::${recipe.cuisine || "all"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(recipe);
    return acc;
  }, {});

  // Trier chaque groupe par score
  Object.values(grouped).forEach((group) => 
    group.sort((a, b) => (b.score || 0) - (a.score || 0))
  );

  // Rotation intelligente: 1 de chaque type, puis 2de chaque, etc
  const result = [];
  let index = 0;
  const keys = Object.keys(grouped);
  while (keys.some((key) => grouped[key][index])) {
    keys.forEach((key) => {
      if (grouped[key][index]) result.push(grouped[key][index]);
    });
    index += 1;
  }

  return result;
}

function totalTime(recipe) {
  return (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) + (recipe.restMinutes || 0);
}

function nutritionScore(recipe, profile) {
  const kcal = recipe?.nutrition?.kcal || 0;
  const protein = recipe?.nutrition?.protein || 0;
  if (profile.goal === "lose") {
    const kcalScore = kcal <= 560 ? 92 : kcal <= 700 ? 70 : 40;
    return Math.round((kcalScore * 0.55) + Math.min(100, protein * 2) * 0.45);
  }
  if (profile.goal === "gain") {
    const kcalScore = kcal >= 600 && kcal <= 900 ? 90 : kcal >= 480 ? 74 : 50;
    return Math.round((kcalScore * 0.45) + Math.min(100, protein * 2.2) * 0.55);
  }
  const balanced = kcal >= 420 && kcal <= 760 ? 88 : 68;
  return Math.round((balanced * 0.6) + Math.min(100, protein * 1.8) * 0.4);
}

function speedScore(recipe) {
  const time = totalTime(recipe);
  if (time <= 20) return 98;
  if (time <= 30) return 86;
  if (time <= 45) return 70;
  return 52;
}

function complexityScore(recipe) {
  const difficulty = String(recipe?.difficulty || "Facile").toLowerCase();
  const stepCount = recipe?.steps?.length || 0;
  if (difficulty.includes("facile")) return stepCount <= 5 ? 92 : 84;
  if (difficulty.includes("inter")) return stepCount <= 6 ? 76 : 68;
  return 58;
}

function userFitScore(recipe, profile) {
  let score = 70;
  const time = totalTime(recipe);
  const style = String(recipe?.style || "").toLowerCase();
  const tags = (recipe?.tags || []).map((item) => String(item).toLowerCase());
  const ingredients = recipe?.ingredients || [];

  if (recipeBlockedByProfile(ingredients, profile)) return 0;
  if (profile.preferences.includes("healthy") && (recipe.nutrition?.kcal || 0) <= 620) score += 12;
  if (profile.preferences.includes("rapide") && time <= 25) score += 14;
  if (profile.preferences.includes("gourmand") && (style.includes("gastro") || style.includes("bistrot") || tags.includes("bake"))) score += 10;
  if (profile.goal === "lose" && recipe.nutrition?.kcal <= 560) score += 10;
  if (profile.goal === "gain" && recipe.nutrition?.protein >= 28) score += 10;
  return Math.max(0, Math.min(100, score));
}

function describeRecipe(recipe, profile) {
  const time = totalTime(recipe);
  const goalLine = profile.goal === "lose"
    ? "oriente vers un repas maitrise et rassasiant"
    : profile.goal === "gain"
      ? "oriente vers un apport proteine plus soutenu"
      : "equilibre pour un quotidien regulier";
  return `${recipe.name} : ${recipe.style}, ${time} min, ${goalLine}. Texture ${recipe.cookingMethod}, ${recipe.nutrition.kcal} kcal.`;
}

function buildVariants(recipe, profile) {
  const variants = [];
  if (recipe.cuisine !== "healthy") variants.push(`Version healthy de ${recipe.name}`);
  if (!profile.preferences.includes("rapide") && totalTime(recipe) > 25) variants.push(`Version rapide de ${recipe.name}`);
  if (recipe.cuisine !== "antillaise") variants.push(`Variation antillaise de ${recipe.name}`);
  return variants.slice(0, 3);
}

function buildSwaps(recipe, profile) {
  const swaps = [];
  if ((recipe?.ingredients || []).some((item) => String(item).includes("poulet"))) swaps.push("Poulet -> dinde ou tofu");
  if ((recipe?.ingredients || []).some((item) => String(item).includes("creme"))) swaps.push("Creme -> yaourt ou lait de coco leger");
  if (profile.goal === "lose" && (recipe?.ingredients || []).some((item) => String(item).includes("riz"))) swaps.push("Riz -> quinoa ou portion reduite");
  return swaps.slice(0, 3);
}

function attachAlternatives(recipes) {
  return recipes.map((recipe, index) => ({
    ...recipe,
    alternatives: recipes.filter((_, altIndex) => altIndex !== index).slice(0, 3).map((item) => item.name),
  }));
}

function enrichRecipe(recipe, profile) {
  const scores = {
    nutrition: nutritionScore(recipe, profile),
    speed: speedScore(recipe),
    complexity: complexityScore(recipe),
    userFit: userFitScore(recipe, profile),
  };
  const total = Math.round(scores.nutrition * 0.32 + scores.speed * 0.18 + scores.complexity * 0.14 + scores.userFit * 0.36);
  return {
    ...recipe,
    score: total,
    scores,
    description: describeRecipe(recipe, profile),
    variants: buildVariants(recipe, profile),
    substitutions: buildSwaps(recipe, profile),
    premiumHint: `Tu peux aussi faire ${buildVariants(recipe, profile)[0] || recipe.name}.`,
  };
}

function personalizeRecipes(recipes, profile) {
  const normalizedProfile = normalizeUserProfile(profile || getUserProfile());
  const filtered = recipes.filter((recipe) => !recipeBlockedByProfile(recipe.ingredients || [], normalizedProfile));
  const enriched = filtered.map((recipe) => enrichRecipe(recipe, normalizedProfile));
  return enriched.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export { CUISINE_MODES, formatIngredientLine, scaleRecipeForServings };

// ===== UTILISER LES 44 PLATS DE dishKnowledge.ts EN PRIORITÉ =====
function recipesFromDishKnowledge(ingredientQuery, limit = 12, options = {}) {
  try {
    // Vérifier que on a une requête valide
    const query = Array.isArray(ingredientQuery) ? ingredientQuery.join(" ").trim() : String(ingredientQuery || "").trim();
    if (!query) return null; // Pas de requête, fallback à generateRecipeCandidates
    
    // Utiliser matchByIngredients pour trouver les plats pertinents
    const matched = (matchByIngredients && typeof matchByIngredients === "function") 
      ? (matchByIngredients(query) || []) 
      : [];
    
    if (!Array.isArray(matched) || matched.length === 0) return null; // Pas de résultats
    
    // Filtrer par cuisine si spécifié
    let filtered = matched;
    if (options.cuisine && options.cuisine !== "all") {
      filtered = matched.filter(dish => dish && dish.cuisine === options.cuisine);
    }
    
    // Filtrer par slot si spécifié
    if (options.slot) {
      filtered = filtered.filter(dish => dish && dish.slot === options.slot);
    }
    
    // Convertir DishProfile en EngineRecipe format
    const recipes = filtered.slice(0, limit).map((dish, idx) => {
      if (!dish || !dish.id) return null;
      
      // Calculer valeurs nutritionnelles par défaut selon la difficulté et plaisir
      const difficulty = dish.difficulty || 2;
      const plaisir = dish.plaisir || { gourmandise: 3 };
      const baseCal = 400 + (difficulty * 100) + (plaisir.gourmandise * 50);
      
      return {
        id: dish.id,
        name: dish.name || "",
        desireName: dish.desireName || dish.name || "",
        blueprintKey: dish.family || "plat",
        cuisine: dish.cuisine || "all",
        slot: dish.slot || "lunch",
        difficulty: difficulty,
        minChefLevel: dish.minChefLevel || 2,
        family: dish.family || "plat",
        cookingMethod: dish.technique || "braise",
        servings: dish.servings || options.servings || 4,
        timings: dish.timings || { prep: 15, cook: 30 },
        ingredients: Array.isArray(dish.ingredients) ? dish.ingredients.map(ing => typeof ing === "string" ? ing : ing?.name || "") : [],
        ingredientsDetailed: Array.isArray(dish.ingredients) ? dish.ingredients.map(ing => {
          if (typeof ing === "string") return { name: ing, quantity: 1, unit: "portion" };
          const raw = ing?.quantity || "";
          const parsed = parseIngredientQuantity(raw);
          return { name: ing?.name || "", quantity: parsed.quantity, unit: parsed.unit };
        }) : [],
        baseIngredients: dish.baseIngredients || dish.baseFamilies || [],
        steps: Array.isArray(dish.steps) ? dish.steps : [],
        profTips: Array.isArray(dish.profTips) ? dish.profTips : [],
        mistakes: Array.isArray(dish.mistakes) ? dish.mistakes : [],
        signature: dish.signature || "",
        category: dish.category || "plat",
        nutrition: {
          kcal: Math.round(baseCal),
          protein: Math.round(15 + difficulty * 5),
          carbs: Math.round(35 + difficulty * 8),
          fat: Math.round(20 + difficulty * 3)
        },
        dishProfile: dish,
        rank: idx + 1,
      };
    }).filter(Boolean);
    
    return recipes.length > 0 ? recipes : null; // null = fallback à generateRecipeCandidates
  } catch (e) {
    console.error("Error using dishKnowledge recipes:", e);
    return null;
  }
}

export function generateDynamicRecipesFromIngredients(ingredients, options = {}) {
  // D'ABORD: essayer les 44 plats de dishKnowledge
  const knowledgeRecipes = recipesFromDishKnowledge(toIngredients(ingredients), 12, {
    cuisine: options.cuisine || "all",
    slot: options.slot || "lunch",
    servings: options.servings || 2,
  });
  
  // Utiliser dishKnowledge si résultats, sinon fallback generateRecipeCandidates
  const baseRecipes = knowledgeRecipes || generateRecipeCandidates(toIngredients(ingredients), {
    cuisine: options.cuisine || "all",
    mode: options.mode || "chef",
    slot: options.slot || "lunch",
    servings: options.servings || 2,
    limit: Math.max(10, Number(options.limit) || 12),
  });

  const generated = personalizeRecipes(diversify(baseRecipes), options.userProfile);

  const withAdminLayer = applyAdminControls(generated, {
    ingredients: toIngredients(ingredients),
    cuisine: options.cuisine || "all",
  });
  recordGeneratedRecipes(generated);
  return finalizeRecipeCollection(withAdminLayer, options.limit || 5);
}

export function recommendRecipesFromIngredients(ingredients, limit = 12, options = {}) {
  return generateDynamicRecipesFromIngredients(ingredients, {
    cuisine: options.cuisine || "all",
    mode: options.mode || "chef",
    slot: options.slot || "lunch",
    servings: options.servings || 2,
    limit: Math.min(5, Math.max(1, Number(limit) || 5)),
    userProfile: options.userProfile,
  });
}

export function surpriseBalancedRecipe() {
  const pools = [
    ["oeuf", "epinards", "tomate", "oignon"],
    ["poisson", "citron", "carotte", "oignon"],
    ["poulet", "quinoa", "brocoli", "avocat"],
    ["tofu", "brocoli", "courgette", "ail"],
  ];
  const index = new Date().getMinutes() % pools.length;
  return generateRecipeCandidates(pools[index], {
    cuisine: index % 2 === 0 ? "healthy" : "monde",
    mode: "chef",
    slot: "dinner",
    servings: 2,
    limit: 1,
  })[0];
}

export function smartSearchRecipes(query) {
  const q = normalize(query);
  if (!q) return recommendRecipesFromIngredients(["oeuf", "tomate", "oignon", "poulet"], 20, { cuisine: "all" });

  const askedDish = findKnowledgeDish(q);
  if (askedDish) {
    const expertRecipe = findExpertRecipeForDish(askedDish, inferServings(q), getUserProfile());
    if (expertRecipe) return finalizeRecipeCollection([expertRecipe], 1);
  }

  const generated = personalizeRecipes(diversify(
    generateRecipeCandidates(q.split(/\s+/).filter(Boolean), {
      cuisine: inferCuisine(q),
      slot: inferSlot(q),
      servings: inferServings(q),
      mode: q.includes("chef") ? "chef" : "normal",
      limit: 20,
    })
  ));

  const withAdminLayer = applyAdminControls(generated, {
    ingredients: q.split(/\s+/).filter(Boolean),
    cuisine: inferCuisine(q),
    query,
  });
  recordGeneratedRecipes(generated);
  return finalizeRecipeCollection(withAdminLayer, 5);
}

/**
 * 📌 FIX #7: Normalise les types de plats antillais
 * Agoulou → sandwich, Bokit → pain frit, Accras → friture
 */
function normalizeDishType(dish) {
  const normalizedName = (dish.name || "").toLowerCase();
  
  if (normalizedName.includes("agoulou")) {
    dish.type = "sandwich";
  } else if (normalizedName.includes("bokit")) {
    dish.type = "pain frit";
  } else if (normalizedName.includes("accras")) {
    dish.type = "friture";
  }
  
  return dish;
}

/**
 * 📌 FIX #8: Matching amélioré pour trouver les recettes manquantes
 * Remplace recipeMatchesDish par catalogue complet
 */
function findRecipesForDish(dishName) {
  const normalized = (dishName || "").toLowerCase();
  // Alias map: certains plats ont un nom different dans la base
  const aliasMap = {
    "poyo": ["poyo", "ti nain", "ti-nain", "banane verte"],
    "ti nain": ["poyo", "ti nain", "ti-nain", "banane verte"],
    "agoulou": ["agoulou"],
    "accras": ["accras", "acras"],
    "boucane": ["boucane", "poulet boucane"],
    "riz colle": ["riz colle", "riz-colle"],
    "riz-colle": ["riz colle", "riz-colle"],
    "dombre": ["dombre", "dombré"],
    "dombré": ["dombre", "dombré"],
    "bebele": ["bebele", "bébélé"],
    "bébélé": ["bebele", "bébélé"],
    "matete": ["matete", "matété", "matete-crabe", "matoutou", "riz au crabe"],
    "matété": ["matete", "matété", "matete-crabe", "matoutou"],
    "matoutou": ["matete", "matété", "matete-crabe", "matoutou"],
    "chodo": ["chodo", "chaudeau"],
    "chaudeau": ["chodo", "chaudeau"],
    "pate en pot": ["pate-en-pot", "pâté en pot"],
    "pâté en pot": ["pate-en-pot", "pâté en pot"],
  };
  const searchTerms = aliasMap[normalized] || [normalized];
  
  return ALL_RECIPES.filter((recipe) => {
    const recipeName = (recipe.name || "").toLowerCase();
    const recipeId = (recipe.id || "").toLowerCase();
    const recipeTags = (recipe.tags || []).map(t => t.toLowerCase()).join(" ");
    const recipeDesire = (recipe.desireName || "").toLowerCase();
    const haystack = `${recipeName} ${recipeId} ${recipeTags} ${recipeDesire}`;
    
    return searchTerms.some(term => haystack.includes(term));
  });
}

export async function askCookingAssistant(question, context = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const lower = normalize(question);
  const ingredients = toIngredients(context.ingredients || []);
  const userProfile = normalizeUserProfile(context.userProfile || getUserProfile());
  const servings = inferServings(lower);
  const chefLevel = GLOBAL_CHEF_LEVEL;

  // MODE CHEF ÉTOILÉ PRIORITAIRE (niveau 10): Context Intelligence Engine
  if (chefLevel === 10) {
    // 🔥 CORRECTION: Chercher les VRAIES recettes d'abord
    // Avant de générer, regarder si on a un match EXACT dans la base
    const lower = normalize(question);
    const askedDish = findKnowledgeDish(lower);
    
    // Si plat connu (bokit, agoulou, accras, etc.), utiliser les VRAIES variantes
    if (askedDish && (askedDish.key === "bokit" || askedDish.key === "accras" || askedDish.key === "agoulou" || askedDish.key === "poyo" || askedDish.key === "colombo" || askedDish.key === "blaff" || askedDish.key === "dombre" || askedDish.key === "court-bouillon" || askedDish.key === "poulet-boucane" || askedDish.key === "riz-colle" || askedDish.key === "bebele" || askedDish.key === "matete-crabe" || askedDish.key === "chodo" || askedDish.key === "pate-en-pot")) {
      const matchedRecipes = findRecipesForDish(askedDish.key);
      if (matchedRecipes && matchedRecipes.length > 0) {
        const baseCuisine = askedDish.cuisine || "antillaise";
        const personalizedMatches = personalizeRecipes(matchedRecipes, userProfile);
        const diversified = diversify(personalizedMatches).filter((recipe) => {
          return recipe.cuisine === baseCuisine || !baseCuisine;
        });
        
        const sorted = diversified.sort((a, b) => {
          return (b.score || 0) - (a.score || 0);
        });
        
        const finalResults = sorted.slice(0, 5);
        
        const chefAnswerText = `Voici les ${finalResults.length} variations de ${askedDish.key} que je vous propose:`;
        return {
          title: `CHEF ÉTOILÉ - ${askedDish.key?.toUpperCase()}`,
          recipes: finalResults,
          answer: chefAnswerText,
          actions: ["Voir recette", "Technique pro", "Variantes"],
        };
      }
    }
    
    // Fallback: génération IA si pas de match exact
    const generated = generateChefStarRecipes({
      chefLevel,
      query: lower,
      slot: inferSlot(lower),
      cuisine: inferCuisine(lower),
      servings,
      availableIngredients: ingredients.length ? ingredients : undefined,
    });

    if (generated && generated.length > 0) {
      // 📌 FIX #1-3: Restructurer résultats + diversify + tri intelligent
      const results = [];

      // 1️⃣ Fallback: base sans return
      const fallback = generated[0];
      if (fallback) {
        results.push(fallback);
      }

      // 2️⃣ Ajouter les recettes IA générées
      if (generated && generated.length > 0) {
        results.push(...generated);
      }

      // 3️⃣ Sécurité: minimum 3 recettes
      if (results.length < 3 && fallback) {
        results.push({ ...fallback, id: `${fallback.id}-fallback-2` });
        results.push({ ...fallback, id: `${fallback.id}-fallback-3` });
      }

      // 🔁 FIX #2: Utiliser diversify() correctement
      const diversified = diversify(results);

      // 🎯 FIX #3: Tri intelligent (par temps total ou nutrition)
      const sorted = diversified.sort((a, b) => {
        // Priorité: score context > temps total > nutrition
        const scoreA = a.contextValidation?.contextScore?.total || a.score || 0;
        const scoreB = b.contextValidation?.contextScore?.total || b.score || 0;
        
        if (scoreA !== scoreB) return scoreB - scoreA; // Meilleur score d'abord
        
        // Si même score: préférer recettes plus courtes
        return totalTime(a) - totalTime(b);
      });

      // ✂️ FIX #4: Limiter à 5 résultats
      const finalResults = sorted.slice(0, 5);

      // 💥 FIX #5-6: STRUCTURE PROPRE - compatible UI + recipes array
      const chefAnswerText =
        finalResults.length > 0
          ? `Mode CHEF ÉTOILÉ activé. Je vous propose ${finalResults.length} recettes premium personnalisées basées sur votre contexte culinaire.`
          : "Aucune recette trouvée dans ce contexte.";

      return {
        title: `CHEF ÉTOILÉ - Sélection personnalisée`,
        recipes: finalResults,
        answer: chefAnswerText,
        actions: finalResults.length > 0 ? ["Voir recette", "Technique pro", "Variantes"] : [],
      };
    }
  }

  // Fallback mode AMÉLIORÉ (Point 7-8): Matching intelligent + tableau de recettes
  // 🔍 Point 7: Normaliser le type de plat
  const askedDish = findKnowledgeDish(lower);
  if (askedDish) {
    // 🎯 Point 8: Matching intelligent - trouver PLUSIEURS recettes correspondantes
    const matchedRecipes = findRecipesForDish(askedDish.key || askedDish.aliases?.[0] || lower);
    
    if (matchedRecipes && matchedRecipes.length > 0) {
      // Strategie SIMPLE et PROPRE: cohérence culinaire
      const baseCuisine = askedDish.cuisine || "antillaise";
      
      // Personnaliser et filtrer cohérence
      const personalizedMatches = personalizeRecipes(matchedRecipes, userProfile);
      const diversified = diversify(personalizedMatches).filter((recipe) => {
        return recipe.cuisine === baseCuisine || !baseCuisine;
      });
      
      // Trier par score
      const sorted = diversified.sort((a, b) => {
        return (b.score || 0) - (a.score || 0);
      });
      
      // CRITICAL FIX: finalMatches défini
      const finalMatches = sorted.slice(0, 5);
      
      // STRUCTURE PROPRE: pas de mélange alternatives/résultats
      const answerText = `J'ai trouvé ${finalMatches.length} ${askedDish.key} intéressant(s). Voici ma sélection culinaire personnalisée.`;
      
      return {
        title: `Chef expert - ${askedDish.key?.toUpperCase() || "Selection"}`,
        recipes: finalMatches,
        answer: answerText,
        actions: ["Voir recette", "Version debutant", "Verifier cuisson"],
      };
    }
    
    // Fallback si pas trouvé avec findRecipesForDish: utiliser l'ancienne méthode
    const expertRecipe = findExpertRecipeForDish(askedDish, servings, userProfile);
    if (expertRecipe) {
      return {
        title: `Chef expert - ${expertRecipe.name}`,
        answer: buildPedagogicDishAnswer(expertRecipe, askedDish, servings),
        actions: ["Voir recette", "Version debutant", "Verifier cuisson"],
        recipe: expertRecipe,
        suggestions: {
          fundamentals: askedDish.fundamentals || [],
        },
      };
    }
  }

  if (lower.includes("surprend") || lower.includes("surprise")) {
    const pick = personalizeRecipes([surpriseBalancedRecipe()], userProfile)[0];
    return {
      title: "Mode surprise dynamique",
      answer: `Je compose ${pick.name}. ${pick.description} Tu peux aussi faire ${pick.alternatives?.[0] || pick.variants?.[0] || "une variation plus legere"}.`,
      actions: ["Voir recette", ...(pick.variants || []).slice(0, 2)],
      recipe: pick,
    };
  }

  const cuisine = lower.includes("antill") ? "antillaise" : inferCuisine(lower);
  const slot = inferSlot(lower);
  const rankedBase = personalizeRecipes(generateRecipeCandidates(ingredients.length ? ingredients : lower.split(/\s+/), {
    cuisine,
    mode: "chef",
    slot,
    servings,
    limit: 6,
  }), userProfile);
  const ranked = finalizeRecipeCollection(applyAdminControls(rankedBase, {
    ingredients: ingredients.length ? ingredients : lower.split(/\s+/),
    cuisine,
    query: question,
  }), 5);
  recordGeneratedRecipes(rankedBase);
  const pick = ranked[0] || rankedBase[0] || surpriseBalancedRecipe();

  return {
    title: "Composition culinaire intelligente",
    answer: `Je compose ${pick.name} a partir d'un blueprint ${pick.blueprintKey}, avec quantites adaptees, logique ${pick.cookingMethod} et coherence ${pick.cuisine}. ${pick.description} Tu peux aussi faire ${pick.alternatives?.[0] || pick.variants?.[0] || "une autre variante"}.`,
    actions: ["Voir recette", ...(pick.variants || []).slice(0, 2), ...(pick.substitutions || []).slice(0, 1)],
    recipe: pick,
    suggestions: {
      alternatives: ranked.slice(1, 4).map((item) => item.name),
      substitutions: pick.substitutions || [],
    },
  };
}
