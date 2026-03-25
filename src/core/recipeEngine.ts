import { estimateRecipeNutrition } from "./nutritionEngine";
import {
  analyzeFlavorBalance,
  computeIngredientCompatibilityScore,
  filterRecipesForSlot,
  getIngredientBalance,
  getIngredientProfile,
  normalize,
  type CookingMethod,
  type FlavorNote,
  type IngredientRole,
  type MealSlot,
  type ProteinFamily,
  type RuleRecipe,
} from "./foodRules";
import {
  buildTechniqueDrivenSteps,
  chooseCookingMethod,
  inferDesiredResult,
  planCookingTechniques,
} from "./cookingTechniques";

export type CuisineMode = "all" | "francaise" | "antillaise" | "healthy" | "rapide" | "monde";
type EngineMode = "normal" | "chef";

export interface IngredientLine {
  name: string;
  quantity: number;
  unit: string;
}

interface IngredientSpec {
  quantity: number;
  unit: string;
}

interface BlueprintRole {
  role: IngredientRole;
  min: number;
  max: number;
  required: boolean;
}

interface DishBlueprint {
  key: string;
  family: string;
  slotHints: MealSlot[];
  cuisines: CuisineMode[];
  method: CookingMethod;
  difficulty: string;
  prepMinutes: number;
  cookMinutes: number;
  restMinutes: number;
  baseRoles: BlueprintRole[];
}

export interface EngineRecipe extends RuleRecipe {
  id: string;
  source: string;
  cuisine: CuisineMode;
  mode: EngineMode;
  style: string;
  dishType: string;
  difficulty: string;
  prepMinutes: number;
  cookMinutes: number;
  restMinutes: number;
  servings: number;
  ingredientsDetailed: IngredientLine[];
  ingredients: string[];
  steps: string[];
  tags: string[];
  tips: string[];
  mistakes: string[];
  slotHints: MealSlot[];
  nutrition: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imagePrompt: string;
  imageUrl?: string;  // 🔗 Unsplash image URL
  score: number;
  matchReason: string;
  rank?: number;
  blueprintKey: string;
  cookingMethod: CookingMethod;
  proteinFamily: ProteinFamily;
  primaryProtein?: string;
  dishFamily: string;
  flavorBalance: ReturnType<typeof analyzeFlavorBalance>;
}

interface GenerateOptions {
  cuisine?: CuisineMode;
  slot?: MealSlot;
  mode?: EngineMode;
  servings?: number;
  limit?: number;
}

const DEFAULT_INGREDIENTS = ["oeuf", "tomate", "oignon", "poulet", "riz", "brocoli"];
const CUISINE_MODES_SET = new Set<CuisineMode>(["all", "francaise", "antillaise", "healthy", "rapide", "monde"]);

const PANTRY_BY_CUISINE: Record<CuisineMode, IngredientLine[]> = {
  all: [
    { name: "sel", quantity: 1, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "huile d'olive", quantity: 1, unit: "c. a soupe" },
    { name: "herbes", quantity: 1, unit: "c. a soupe" },
  ],
  francaise: [
    { name: "sel", quantity: 1, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "beurre", quantity: 15, unit: "g" },
    { name: "herbes", quantity: 1, unit: "c. a soupe" },
  ],
  antillaise: [
    { name: "sel", quantity: 1, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "ail", quantity: 1, unit: "gousse" },
    { name: "thym", quantity: 1, unit: "c. a cafe" },
    { name: "piment", quantity: 0.25, unit: "piece" },
  ],
  healthy: [
    { name: "sel", quantity: 0.5, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "huile d'olive", quantity: 1, unit: "c. a soupe" },
    { name: "citron", quantity: 0.5, unit: "piece" },
    { name: "herbes", quantity: 1, unit: "c. a soupe" },
  ],
  rapide: [
    { name: "sel", quantity: 0.5, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "huile d'olive", quantity: 1, unit: "c. a soupe" },
  ],
  monde: [
    { name: "sel", quantity: 1, unit: "c. a cafe" },
    { name: "poivre", quantity: 0.5, unit: "c. a cafe" },
    { name: "ail", quantity: 1, unit: "gousse" },
    { name: "lait de coco", quantity: 40, unit: "ml" },
    { name: "citron", quantity: 0.5, unit: "piece" },
  ],
};

const SUPPORT_INGREDIENTS_BY_FLAVOR: Record<FlavorNote, Record<CuisineMode, string[]>> = {
  acid: {
    all: ["citron", "tomate"],
    francaise: ["citron", "tomate"],
    antillaise: ["citron", "tomate"],
    healthy: ["citron", "tomate"],
    rapide: ["citron", "tomate"],
    monde: ["citron", "tomate"],
  },
  fat: {
    all: ["huile d'olive", "avocat"],
    francaise: ["beurre", "fromage"],
    antillaise: ["lait de coco", "huile"],
    healthy: ["huile d'olive", "avocat"],
    rapide: ["huile d'olive", "fromage"],
    monde: ["lait de coco", "huile d'olive"],
  },
  salty: {
    all: ["sel"],
    francaise: ["sel"],
    antillaise: ["sel"],
    healthy: ["sel"],
    rapide: ["sel"],
    monde: ["sel"],
  },
  spice: {
    all: ["poivre", "ail"],
    francaise: ["poivre", "herbes"],
    antillaise: ["ail", "piment", "thym"],
    healthy: ["poivre", "herbes"],
    rapide: ["poivre", "ail"],
    monde: ["ail", "poivre"],
  },
  fresh: {
    all: ["herbes", "citron"],
    francaise: ["herbes", "citron"],
    antillaise: ["thym", "citron"],
    healthy: ["herbes", "citron"],
    rapide: ["citron", "herbes"],
    monde: ["citron", "herbes"],
  },
};

const SERVING_SPECS: Record<string, IngredientSpec> = {
  oeuf: { quantity: 2, unit: "piece" },
  poulet: { quantity: 160, unit: "g" },
  dinde: { quantity: 160, unit: "g" },
  boeuf: { quantity: 150, unit: "g" },
  poisson: { quantity: 170, unit: "g" },
  saumon: { quantity: 160, unit: "g" },
  thon: { quantity: 120, unit: "g" },
  crevette: { quantity: 150, unit: "g" },
  morue: { quantity: 150, unit: "g" },
  tofu: { quantity: 140, unit: "g" },
  lentilles: { quantity: 110, unit: "g" },
  quinoa: { quantity: 90, unit: "g" },
  riz: { quantity: 100, unit: "g" },
  pates: { quantity: 100, unit: "g" },
  pain: { quantity: 90, unit: "g" },
  farine: { quantity: 70, unit: "g" },
  sucre: { quantity: 22, unit: "g" },
  lait: { quantity: 90, unit: "ml" },
  "levure boulangere": { quantity: 3, unit: "g" },
  "levure chimique": { quantity: 2, unit: "g" },
  chocolat: { quantity: 25, unit: "g" },
  banane: { quantity: 80, unit: "g" },
  tomate: { quantity: 120, unit: "g" },
  oignon: { quantity: 60, unit: "g" },
  ail: { quantity: 1, unit: "gousse" },
  carotte: { quantity: 100, unit: "g" },
  brocoli: { quantity: 120, unit: "g" },
  courgette: { quantity: 120, unit: "g" },
  epinards: { quantity: 90, unit: "g" },
  aubergine: { quantity: 120, unit: "g" },
  avocat: { quantity: 60, unit: "g" },
  citron: { quantity: 0.5, unit: "piece" },
  fromage: { quantity: 35, unit: "g" },
  yaourt: { quantity: 50, unit: "g" },
  creme: { quantity: 40, unit: "g" },
  "lait de coco": { quantity: 70, unit: "ml" },
  beurre: { quantity: 12, unit: "g" },
  "huile d'olive": { quantity: 1, unit: "c. a soupe" },
  huile: { quantity: 1, unit: "c. a soupe" },
  sel: { quantity: 0.5, unit: "c. a cafe" },
  poivre: { quantity: 0.25, unit: "c. a cafe" },
  herbes: { quantity: 1, unit: "c. a soupe" },
  thym: { quantity: 0.5, unit: "c. a cafe" },
  piment: { quantity: 0.25, unit: "piece" },
};

const DISH_BLUEPRINTS: DishBlueprint[] = [
  { key: "omelette", family: "omelette", slotHints: ["breakfast", "dinner"], cuisines: ["francaise", "healthy", "rapide", "all"], method: "saute", difficulty: "Facile", prepMinutes: 8, cookMinutes: 7, restMinutes: 0, baseRoles: [{ role: "protein", min: 1, max: 1, required: true }, { role: "vegetable", min: 1, max: 2, required: false }, { role: "dairy", min: 0, max: 1, required: false }, { role: "aromatic", min: 0, max: 1, required: false }] },
  { key: "quiche", family: "quiche", slotHints: ["lunch"], cuisines: ["francaise", "all"], method: "bake", difficulty: "Intermediaire", prepMinutes: 18, cookMinutes: 28, restMinutes: 5, baseRoles: [{ role: "base", min: 1, max: 1, required: true }, { role: "protein", min: 1, max: 1, required: true }, { role: "vegetable", min: 1, max: 2, required: false }, { role: "dairy", min: 1, max: 1, required: true }, { role: "aromatic", min: 0, max: 1, required: false }] },
  { key: "poelee", family: "poelee", slotHints: ["lunch", "dinner"], cuisines: ["francaise", "antillaise", "healthy", "rapide", "monde", "all"], method: "saute", difficulty: "Facile", prepMinutes: 12, cookMinutes: 15, restMinutes: 0, baseRoles: [{ role: "protein", min: 1, max: 1, required: true }, { role: "vegetable", min: 2, max: 3, required: true }, { role: "aromatic", min: 1, max: 2, required: false }, { role: "spice", min: 0, max: 1, required: false }] },
  { key: "bowl", family: "bowl", slotHints: ["lunch", "dinner"], cuisines: ["healthy", "monde", "rapide", "all"], method: "boil", difficulty: "Facile", prepMinutes: 15, cookMinutes: 14, restMinutes: 0, baseRoles: [{ role: "base", min: 1, max: 1, required: true }, { role: "protein", min: 1, max: 1, required: true }, { role: "vegetable", min: 2, max: 3, required: true }, { role: "topping", min: 0, max: 1, required: false }, { role: "acid", min: 0, max: 1, required: false }] },
  { key: "soupe", family: "soupe", slotHints: ["dinner", "lunch", "snack"], cuisines: ["healthy", "francaise", "antillaise", "all"], method: "broth", difficulty: "Facile", prepMinutes: 12, cookMinutes: 25, restMinutes: 0, baseRoles: [{ role: "protein", min: 0, max: 1, required: false }, { role: "vegetable", min: 2, max: 3, required: true }, { role: "aromatic", min: 1, max: 2, required: true }, { role: "base", min: 0, max: 1, required: false }, { role: "sauce", min: 0, max: 1, required: false }] },
  { key: "blaff", family: "blaff", slotHints: ["dinner", "lunch"], cuisines: ["antillaise", "all"], method: "broth", difficulty: "Intermediaire", prepMinutes: 14, cookMinutes: 16, restMinutes: 6, baseRoles: [{ role: "protein", min: 1, max: 1, required: true }, { role: "acid", min: 1, max: 1, required: true }, { role: "aromatic", min: 1, max: 2, required: true }, { role: "vegetable", min: 1, max: 2, required: false }] },
  { key: "curry", family: "curry", slotHints: ["lunch"], cuisines: ["monde", "antillaise", "all"], method: "boil", difficulty: "Intermediaire", prepMinutes: 15, cookMinutes: 22, restMinutes: 0, baseRoles: [{ role: "protein", min: 1, max: 1, required: true }, { role: "sauce", min: 1, max: 1, required: true }, { role: "aromatic", min: 1, max: 2, required: true }, { role: "vegetable", min: 1, max: 2, required: false }, { role: "base", min: 1, max: 1, required: true }] },
  { key: "brioche", family: "brioche", slotHints: ["breakfast", "snack"], cuisines: ["francaise", "all"], method: "bake", difficulty: "Facile", prepMinutes: 15, cookMinutes: 22, restMinutes: 40, baseRoles: [{ role: "base", min: 2, max: 3, required: true }, { role: "dairy", min: 1, max: 1, required: true }, { role: "fat", min: 1, max: 1, required: true }] },
  { key: "gateau", family: "gateau", slotHints: ["snack", "breakfast"], cuisines: ["francaise", "all"], method: "bake", difficulty: "Facile", prepMinutes: 12, cookMinutes: 28, restMinutes: 10, baseRoles: [{ role: "base", min: 2, max: 3, required: true }, { role: "dairy", min: 1, max: 1, required: true }, { role: "fat", min: 1, max: 1, required: true }, { role: "fruit", min: 0, max: 1, required: false }, { role: "topping", min: 0, max: 1, required: false }] },
  { key: "viennoiserie", family: "viennoiserie", slotHints: ["breakfast", "snack"], cuisines: ["francaise", "all"], method: "bake", difficulty: "Intermediaire", prepMinutes: 18, cookMinutes: 20, restMinutes: 35, baseRoles: [{ role: "base", min: 2, max: 3, required: true }, { role: "fat", min: 1, max: 1, required: true }, { role: "dairy", min: 1, max: 1, required: true }] },
];

export const CUISINE_MODES: CuisineMode[] = ["all", "francaise", "antillaise", "healthy", "rapide", "monde"];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * 🖼️ GENERATE UNSPLASH IMAGE URL
 * Creates a beautiful food image URL from Unsplash
 * Query should be specific: "tarte tatin", "poulet rôti', etc
 */
function generateImageUrl(query: string): string {
  const cleanQuery = query
    .toLowerCase()
    .replace(/mode\s+(debutant|pas-a-pas)/gi, "")
    .replace(/\s+/g, "+")
    .slice(0, 50);
  
  return `https://source.unsplash.com/600x400/?${cleanQuery},food,cuisine,recipe`;
}

function getServingSpec(name: string): IngredientSpec {
  const profile = getIngredientProfile(name);
  return SERVING_SPECS[profile.key] || { quantity: 80, unit: "g" };
}

/**
 * 🔧 NORMALIZE INGREDIENT QUANTITY
 * ✅ Fixes: 0.3 pomme → 1 piece, Decimal decimals, Non-realistic values
 * RULES:
 * - g/ml ALWAYS normalized to base units (no 0.3g decimals)
 * - piece/count: ALWAYS integers (min 1)
 * - c.a.cafe/soupe: ALWAYS normalized decimals (0.5, 1, 1.5, 2, etc)
 * - NEVER output 0.3 pieces, 0.2 grams, etc
 */
function normalizeIngredientQuantity(item: IngredientLine, servings: number = 1): IngredientLine {
  let { quantity, unit, name } = item;

  // Standardize unit names
  const unitNorm = unit.toLowerCase().trim().replace(/s$/, ""); // "pieces" → "piece"

  // RULE 1: Piece/count based units (ALWAYS integers >= 1)
  if (["piece", "count", "entier", "whole"].includes(unitNorm)) {
    const adjusted = Math.round(quantity * servings);
    return { name, quantity: Math.max(1, adjusted), unit: "piece" };
  }

  // RULE 2: Volume/weight units (g, ml) - smart rounding
  if (["g", "gramme", "ml", "millilitre", "l", "litre"].includes(unitNorm)) {
    const targetUnit = unitNorm.includes("ml") || unitNorm.includes("l") ? "ml" : "g";
    let adjusted = targetUnit === "ml" ? quantity * servings : quantity * servings;

    // Smart rounding for weights/volumes
    // 0-10: round to nearest integer
    // 10-50: round to nearest 5
    // 50+: round to nearest 10
    if (adjusted < 10) {
      adjusted = Math.max(1, Math.round(adjusted)); // Never 0
    } else if (adjusted < 50) {
      adjusted = Math.round(adjusted / 5) * 5;
    } else {
      adjusted = Math.round(adjusted / 10) * 10;
    }

    return { name, quantity: adjusted, unit: targetUnit };
  }

  // RULE 3: Spoon measurements (always normalized decimals: 0.25, 0.5, 1, 1.5, 2)
  if (["c. a cafe", "c.a.cafe", "c. a soupe", "c.a.soupe", "cuillere", "soupe"].includes(unitNorm)) {
    const normalized = unit.includes("cafe") ? "c. à café" : "c. à soupe";
    const adjusted = quantity * servings;

    // Round to nearest 0.25
    const rounded = Math.round(adjusted * 4) / 4;
    return { name, quantity: Math.max(0.25, rounded), unit: normalized };
  }

  // RULE 4: Gousse/clove - integer
  if (["gousse", "clove", "clou"].includes(unitNorm)) {
    return { name, quantity: Math.max(1, Math.round(quantity * servings)), unit: "gousse" };
  }

  // DEFAULT: Keep as is but ensure realistic decimal
  const safedQty = Math.max(0.25, Math.round(quantity * servings * 4) / 4);
  return { name, quantity: safedQty, unit };
}

function ingredientLine(name: string, servings: number): IngredientLine {
  const spec = getServingSpec(name);
  const baseQuantity = typeof spec.quantity === "number" ? spec.quantity : 1;
  const rawItem = { name, quantity: baseQuantity, unit: spec.unit };
  return normalizeIngredientQuantity(rawItem, servings);
}

function toIngredientNames(input: Array<string | IngredientLine> | undefined): string[] {
  if (!Array.isArray(input)) return [];
  return unique(input.map((item) => normalize(typeof item === "string" ? item : item.name)).filter(Boolean));
}

function cuisineMatches(blueprint: DishBlueprint, cuisine: CuisineMode): boolean {
  return cuisine === "all" || blueprint.cuisines.includes(cuisine) || blueprint.cuisines.includes("all");
}

function blueprintFitsSlot(blueprint: DishBlueprint, slot: MealSlot): boolean {
  return blueprint.slotHints.includes(slot);
}

function getPoolByRole(ingredients: string[], cuisine: CuisineMode, method: CookingMethod): Record<IngredientRole, string[]> {
  const pool: Record<IngredientRole, string[]> = {
    protein: [], base: [], vegetable: [], aromatic: [], fat: [], acid: [], spice: [], dairy: [], sauce: [], topping: [], fruit: [], other: [],
  };

  for (const ingredient of ingredients) {
    const profile = getIngredientProfile(ingredient);
    const cuisineOk = profile.cuisines.includes("all") || profile.cuisines.includes(cuisine);
    const methodOk = profile.methods.includes(method);
    if (!cuisineOk || !methodOk) continue;
    for (const role of profile.roles) pool[role].push(profile.key);
  }

  return pool;
}

function fillMissingRoles(pool: Record<IngredientRole, string[]>, cuisine: CuisineMode, blueprint: DishBlueprint): Record<IngredientRole, string[]> {
  const defaults: Record<CuisineMode, string[]> = {
    all: ["oeuf", "tomate", "oignon", "riz", "brocoli", "herbes", "farine", "sucre", "lait", "beurre", "levure chimique"],
    francaise: ["oeuf", "oignon", "courgette", "fromage", "herbes", "farine", "sucre", "lait", "beurre", "levure boulangere", "chocolat"],
    antillaise: ["poisson", "citron", "oignon", "tomate", "riz", "thym"],
    healthy: ["poulet", "brocoli", "quinoa", "citron", "herbes"],
    rapide: ["thon", "tomate", "pain", "yaourt", "poivre", "farine", "sucre", "lait"],
    monde: ["crevette", "riz", "lait de coco", "oignon", "citron"],
  };

  const next = { ...pool };
  for (const ingredient of defaults[cuisine]) {
    const profile = getIngredientProfile(ingredient);
    if (!profile.methods.includes(blueprint.method)) continue;
    for (const role of profile.roles) next[role] = unique([...(next[role] || []), profile.key]);
  }
  return next;
}

function combinations<T>(items: T[], count: number): T[][] {
  if (count <= 0) return [[]];
  if (items.length < count) return [];
  if (count === 1) return items.map((item) => [item]);

  const result: T[][] = [];
  items.forEach((item, index) => {
    const tails = combinations(items.slice(index + 1), count - 1);
    for (const tail of tails) result.push([item, ...tail]);
  });
  return result;
}

function selectRoleSets(pool: Record<IngredientRole, string[]>, blueprint: DishBlueprint): string[][] {
  let partials: string[][] = [[]];

  for (const roleRule of blueprint.baseRoles) {
    const source = unique(pool[roleRule.role] || []);
    const picks: string[][] = [];
    if (!roleRule.required) picks.push([]);

    for (let size = roleRule.min; size <= roleRule.max; size += 1) {
      if (size === 0) continue;
      picks.push(...combinations(source, size));
    }

    if (roleRule.required && picks.length === 0) return [];

    const next: string[][] = [];
    for (const partial of partials) {
      for (const pick of picks.length ? picks : [[]]) next.push(unique([...partial, ...pick]));
    }
    partials = next;
  }

  return partials.filter((set) => set.length > 0);
}

function choosePrimaryProtein(ingredients: string[]): { name?: string; family: ProteinFamily } {
  for (const ingredient of ingredients) {
    const profile = getIngredientProfile(ingredient);
    if (profile.roles.includes("protein")) return { name: profile.key, family: profile.proteinFamily };
  }
  return { family: "none" };
}

function determineStyle(cuisine: CuisineMode, slot: MealSlot, blueprint: DishBlueprint, mode: EngineMode): string {
  if (mode === "chef") return `${cuisine} gastro`;
  if (["brioche", "gateau", "viennoiserie"].includes(blueprint.family)) return "debutant pas-a-pas";
  if (slot === "dinner") return cuisine === "healthy" ? "healthy refine" : `${cuisine} bistrot leger`;
  if (blueprint.family === "bowl") return cuisine === "rapide" ? "street food propre" : `${cuisine} healthy bowl`;
  if (blueprint.family === "quiche") return "bistrot dore";
  return cuisine === "antillaise" ? "saveurs creoles structurees" : `${cuisine} chef maison`;
}

function chooseSupportIngredient(note: FlavorNote, cuisine: CuisineMode): string | undefined {
  return SUPPORT_INGREDIENTS_BY_FLAVOR[note]?.[cuisine]?.[0] || SUPPORT_INGREDIENTS_BY_FLAVOR[note]?.all?.[0];
}

function enrichWithFlavorBalance(selected: string[], cuisine: CuisineMode): string[] {
  const current = unique(selected);
  const flavorBalance = analyzeFlavorBalance(current);
  const additions = flavorBalance.missing
    .map((note) => chooseSupportIngredient(note, cuisine))
    .filter(Boolean) as string[];
  return unique([...current, ...additions]);
}

function buildDetailedIngredients(selected: string[], cuisine: CuisineMode, servings: number): IngredientLine[] {
  const lines = selected.map((ingredient) => ingredientLine(ingredient, servings));
  const pantry = (PANTRY_BY_CUISINE[cuisine] || PANTRY_BY_CUISINE.all).map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * servings * 10) / 10,
  }));
  return [...lines, ...pantry].filter((item, index, all) => all.findIndex((other) => normalize(other.name) === normalize(item.name)) === index);
}

function buildRecipeName(ingredients: string[], method: CookingMethod, slot: MealSlot, family?: string): string {
  if (family === "brioche") return "Brioche maison moelleuse (mode debutant)";
  if (family === "gateau") return "Gateau facile du quotidien (mode debutant)";
  if (family === "viennoiserie") return "Viennoiserie maison style croissant (mode debutant)";
  const protein = choosePrimaryProtein(ingredients).name;
  const vegetables = ingredients.filter((ingredient) => getIngredientProfile(ingredient).roles.includes("vegetable")).slice(0, 2);
  const acid = ingredients.find((ingredient) => getIngredientProfile(ingredient).roles.includes("acid"));
  const herb = ingredients.find((ingredient) => ["herbes", "thym"].includes(getIngredientProfile(ingredient).key));

  const proteinLabel = protein ? getIngredientProfile(protein).label : "Legumes";
  const vegLabel = vegetables.length ? vegetables.map((item) => getIngredientProfile(item).label).join(" & ") : "legumes";
  const methodLabels: Record<CookingMethod, string> = {
    saute: "saute",
    bake: "roti au four",
    boil: "cuit minute",
    broth: "en bouillon",
    raw: "marin",
    grill: "grille",
    stirfry: "saute vif",
    steam: "vapeur",
    roast: "roti",
  };
  const accent = [acid ? getIngredientProfile(acid).label : null, herb ? getIngredientProfile(herb).label : null].filter(Boolean).join(" & ");
  const suffix = slot === "dinner" ? `, ${vegLabel}` : `, ${vegLabel} ${slot === "lunch" ? "sautes" : "fondants"}`;
  return `${proteinLabel} ${methodLabels[method]}${accent ? ` ${accent}` : ""}${suffix}`.replace(/\s+/g, " ").trim();
}

function recipeId(blueprint: DishBlueprint, selected: string[], method: CookingMethod, servings: number, index: number): string {
  return `dyn-${blueprint.key}-${method}-${selected.slice(0, 4).join("-")}-${servings}-${index}`.replace(/[^a-z0-9-]/g, "");
}

function scoreRecipe(recipe: EngineRecipe, inputIngredients: string[], slot: MealSlot, cuisine: CuisineMode): number {
  const matches = inputIngredients.filter((ingredient) => recipe.ingredients.some((item) => item.includes(ingredient) || ingredient.includes(item)));
  const coverage = matches.length / Math.max(inputIngredients.length, 1);
  const compatibility = computeIngredientCompatibilityScore(recipe.ingredients, cuisine, recipe.cookingMethod) / 100;
  const flavor = recipe.flavorBalance.score / 100;
  const speed = Math.max(0, (65 - recipe.prepMinutes - recipe.cookMinutes) / 65);
  const dinnerLight = slot === "dinner" && recipe.nutrition.kcal <= 560 ? 0.08 : 0;
  return Math.round(Math.min(1, coverage * 0.32 + compatibility * 0.26 + flavor * 0.18 + speed * 0.1 + dinnerLight + 0.14) * 100);
}

function recipeFromSelection(blueprint: DishBlueprint, selectedRaw: string[], inputIngredients: string[], options: Required<GenerateOptions>, index: number): EngineRecipe {
  const protein = choosePrimaryProtein(selectedRaw);
  const desiredResult = inferDesiredResult(options.slot, blueprint.family, protein.family);
  const cookingMethod = chooseCookingMethod(blueprint.method, protein.family, options.slot, blueprint.family);
  // Famille semantique: proteine + methode + blueprint (ex: "poulet:saute:poelee")
  // "poulet saute tomates" et "poulet saute brocoli" partagent la meme famille
  const dishFamily = [protein.name || protein.family, cookingMethod, blueprint.family].filter(Boolean).join(":");
  const selected = enrichWithFlavorBalance(selectedRaw, options.cuisine);
  const style = determineStyle(options.cuisine, options.slot, blueprint, options.mode);
  const name = buildRecipeName(selected, cookingMethod, options.slot, blueprint.family);
  const ingredientsDetailed = buildDetailedIngredients(selected, options.cuisine, options.servings);
  const flavorBalance = analyzeFlavorBalance(ingredientsDetailed.map((item) => item.name));
  const steps = buildTechniqueDrivenSteps({
    cuisine: options.cuisine,
    slot: options.slot,
    blueprintFamily: blueprint.family,
    ingredients: ingredientsDetailed.map((item) => item.name),
    primaryProtein: protein.name,
    proteinFamily: protein.family,
    cookingMethod,
    desiredResult,
  });
  const nutrition = estimateRecipeNutrition(ingredientsDetailed);
  const techniques = planCookingTechniques({
    cuisine: options.cuisine,
    slot: options.slot,
    blueprintFamily: blueprint.family,
    ingredients: ingredientsDetailed.map((item) => item.name),
    primaryProtein: protein.name,
    proteinFamily: protein.family,
    cookingMethod,
    desiredResult,
  });

  const recipe: EngineRecipe = {
    id: recipeId(blueprint, selected, cookingMethod, options.servings, index),
    source: "dynamic-blueprint",
    cuisine: options.cuisine,
    mode: options.mode,
    style,
    dishType: blueprint.family,
    difficulty: blueprint.difficulty,
    prepMinutes: blueprint.prepMinutes,
    cookMinutes: blueprint.cookMinutes,
    restMinutes: blueprint.restMinutes,
    servings: options.servings,
    ingredientsDetailed,
    ingredients: ingredientsDetailed.map((item) => item.name),
    steps,
    tags: unique([options.cuisine, blueprint.family, cookingMethod, protein.family, style]),
    tips: techniques.map((technique) => `${technique.label}: ${technique.reason}.`).slice(0, 2),
    mistakes: [
      "Cuire toutes les textures au meme rythme.",
      "Sous-assaisonner puis compenser en fin de cuisson seulement.",
    ],
    slotHints: blueprint.slotHints,
    nutrition,
    imagePrompt: `${name}, ${cookingMethod}, ${style}, plated gourmet close-up`,
    imageUrl: generateImageUrl(`${name} ${blueprint.family}`),
    score: 0,
    matchReason: "Raisonnement chef: technique, saveurs et texture choisis selon les ingredients.",
    blueprintKey: blueprint.key,
    cookingMethod,
    proteinFamily: protein.family,
    primaryProtein: protein.name,
    dishFamily,
    name,
    flavorBalance,
  };

  recipe.score = scoreRecipe(recipe, inputIngredients, options.slot, options.cuisine);
  return recipe;
}

function normalizeOptions(options: GenerateOptions): Required<GenerateOptions> {
  const cuisine = options.cuisine && CUISINE_MODES_SET.has(options.cuisine) ? options.cuisine : "all";
  return {
    cuisine,
    slot: options.slot || "lunch",
    mode: options.mode === "chef" ? "chef" : "normal",
    servings: Math.max(1, Number(options.servings) || 2),
    limit: Math.max(6, Number(options.limit) || 12),
  };
}

function sortByVariety(recipes: EngineRecipe[]): EngineRecipe[] {
  const blueprintSeen = new Map<string, number>();
  const methodSeen = new Map<string, number>();
  return [...recipes].sort((a, b) => {
    const aPenalty = (blueprintSeen.get(a.blueprintKey) || 0) + (methodSeen.get(a.cookingMethod) || 0);
    const bPenalty = (blueprintSeen.get(b.blueprintKey) || 0) + (methodSeen.get(b.cookingMethod) || 0);
    if (aPenalty !== bPenalty) return aPenalty - bPenalty;
    const diff = (b.score || 0) - (a.score || 0);
    blueprintSeen.set(a.blueprintKey, (blueprintSeen.get(a.blueprintKey) || 0) + 1);
    methodSeen.set(a.cookingMethod, (methodSeen.get(a.cookingMethod) || 0) + 1);
    blueprintSeen.set(b.blueprintKey, (blueprintSeen.get(b.blueprintKey) || 0) + 1);
    methodSeen.set(b.cookingMethod, (methodSeen.get(b.cookingMethod) || 0) + 1);
    return diff;
  });
}

export function scaleRecipeForServings(recipe: EngineRecipe, servings: number): EngineRecipe {
  const safeServings = Math.max(1, Number(servings) || recipe.servings || 2);
  const factor = safeServings / Math.max(1, recipe.servings || 2);
  
  // 🔧 Apply intelligent normalization to scaled ingredients
  const ingredientsDetailed = recipe.ingredientsDetailed.map((item) => {
    const scaled = { ...item, quantity: item.quantity * factor };
    return normalizeIngredientQuantity(scaled, 1); // 1 because already scaled above
  });

  return {
    ...recipe,
    servings: safeServings,
    ingredientsDetailed,
    ingredients: ingredientsDetailed.map((item) => item.name),
    nutrition: {
      kcal: Math.round(recipe.nutrition.kcal * factor),
      protein: Math.round(recipe.nutrition.protein * factor),
      carbs: Math.round(recipe.nutrition.carbs * factor),
      fat: Math.round(recipe.nutrition.fat * factor),
    },
    flavorBalance: analyzeFlavorBalance(ingredientsDetailed.map((item) => item.name)),
  };
}

export function formatIngredientLine(ingredient: IngredientLine): string {
  if (ingredient.quantity == null || ingredient.quantity === 0) {
    return `${ingredient.unit ? ingredient.unit + " " : ""}${ingredient.name}`.replace(/\s+/g, " ").trim();
  }
  return `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`.replace(/\s+/g, " ").trim();
}

export function generateRecipeCandidates(inputIngredients: Array<string | IngredientLine>, options: GenerateOptions = {}): EngineRecipe[] {
  const normalizedOptions = normalizeOptions(options);
  const ingredients = toIngredientNames(inputIngredients);
  const safeIngredients = ingredients.length ? ingredients : DEFAULT_INGREDIENTS;
  const balance = getIngredientBalance(safeIngredients);

  const recipes: EngineRecipe[] = [];
  for (const blueprint of DISH_BLUEPRINTS) {
    if (!cuisineMatches(blueprint, normalizedOptions.cuisine)) continue;
    if (!blueprintFitsSlot(blueprint, normalizedOptions.slot)) continue;
    if (normalizedOptions.slot === "breakfast" && !["omelette", "bowl", "brioche", "viennoiserie", "gateau"].includes(blueprint.family)) continue;
    if (normalizedOptions.slot === "snack" && !["omelette", "bowl", "soupe", "brioche", "viennoiserie", "gateau"].includes(blueprint.family)) continue;
    if (normalizedOptions.slot === "dinner" && blueprint.family === "quiche") continue;

    const rawPool = getPoolByRole(safeIngredients, normalizedOptions.cuisine, blueprint.method);
    const pool = fillMissingRoles(rawPool, normalizedOptions.cuisine, blueprint);
    if (blueprint.family === "bowl" && balance.base === 0) continue;
    if (blueprint.family === "omelette" && !pool.protein.includes("oeuf")) continue;
    if (blueprint.family === "quiche" && !pool.base.includes("farine")) continue;
    if (blueprint.family === "blaff" && !pool.acid.length) continue;
    if (blueprint.family === "curry" && !pool.sauce.length) continue;
    if (blueprint.family === "brioche" && !pool.base.includes("farine")) continue;
    if (blueprint.family === "gateau" && !pool.base.includes("farine")) continue;
    if (blueprint.family === "viennoiserie" && !pool.base.includes("farine")) continue;

    const sets = selectRoleSets(pool, blueprint);
    for (const [index, selected] of sets.entries()) {
      const recipe = recipeFromSelection(blueprint, selected, safeIngredients, normalizedOptions, recipes.length + index + 1);
      recipes.push(recipe);
    }
  }

  const uniqueRecipes = recipes.reduce<EngineRecipe[]>((acc, recipe) => {
    // 🔧 ROBUST DEDUPLICATION: Title + Core Ingredients Signature
    // Prevents: filet mignon appearing twice, same recipe different name
    const coreIngredients = unique(recipe.ingredients)
      .filter((ing) => !["sel", "poivre", "herbes", "huile", "eau"].includes(ing.toLowerCase())) // Exclude base seasonings
      .slice(0, 5) // Core 5 ingredients
      .sort(); // Normalize order
    
    const signature = `${recipe.blueprintKey}:${recipe.cookingMethod}:${coreIngredients.join("+")}`;
    const titleNorm = recipe.name.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\s]/g, "");
    
    // Check if already in acc
    const isDuplicate = acc.some((item) => {
      const existing = `${item.blueprintKey}:${item.cookingMethod}:${unique(item.ingredients)
        .filter((ing) => !["sel", "poivre", "herbes", "huile", "eau"].includes(ing.toLowerCase()))
        .slice(0, 5)
        .sort()
        .join("+")}`;
      const titleExisting = item.name.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\s]/g, "");
      // Duplicate if: signature matches OR title 70% similar
      return existing === signature || titleNorm === titleExisting;
    });
    
    if (!isDuplicate) acc.push(recipe);
    return acc;
  }, []);

  return sortByVariety(filterRecipesForSlot(uniqueRecipes, normalizedOptions.slot))
    .slice(0, normalizedOptions.limit)
    .map((recipe, index) => ({ ...recipe, rank: index + 1 }));
}
