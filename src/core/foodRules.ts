export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type IngredientRole = "protein" | "base" | "vegetable" | "aromatic" | "fat" | "acid" | "spice" | "dairy" | "sauce" | "topping" | "fruit" | "other";
export type ProteinFamily = "poultry" | "fish" | "meat" | "vegetarian" | "egg" | "seafood" | "none";
export type CookingMethod = "saute" | "bake" | "boil" | "broth" | "raw" | "grill" | "stirfry" | "steam" | "roast";
export type FlavorNote = "acid" | "fat" | "salty" | "spice" | "fresh";

export interface NutritionLike {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface RuleRecipe {
  name?: string;
  tags?: string[];
  ingredients?: string[];
  style?: string;
  slotHints?: MealSlot[];
  nutrition?: NutritionLike;
  cookingMethod?: CookingMethod;
  proteinFamily?: ProteinFamily;
  blueprintKey?: string;
}

export interface IngredientProfile {
  key: string;
  label: string;
  roles: IngredientRole[];
  proteinFamily: ProteinFamily;
  cuisines: string[];
  methods: CookingMethod[];
  heaviness: number;
  flavors: FlavorNote[];
}

export interface FlavorBalance {
  present: Record<FlavorNote, boolean>;
  missing: FlavorNote[];
  score: number;
}

const HEAVY_KEYWORDS = ["burger", "bokit", "gratin", "frit", "panure", "loaded", "creme", "double cheese", "quiche lorraine"];
const LIGHT_KEYWORDS = ["salade", "soupe", "bowl", "blaff", "grille", "vapeur", "wok", "omelette", "bouillon"];
const ABSURD_PAIRS = [["pizza", "omelette"], ["thon", "yaourt sucre"], ["fraise", "boeuf"], ["cacao", "ail"], ["dessert", "poisson"]];

const INGREDIENT_PROFILES: Record<string, IngredientProfile> = {
  oeuf: { key: "oeuf", label: "oeufs", roles: ["protein"], proteinFamily: "egg", cuisines: ["francaise", "healthy", "all"], methods: ["saute", "bake"], heaviness: 1, flavors: ["salty"] },
  poulet: { key: "poulet", label: "poulet", roles: ["protein"], proteinFamily: "poultry", cuisines: ["francaise", "antillaise", "healthy", "rapide", "monde", "all"], methods: ["saute", "bake", "grill", "stirfry", "boil", "roast"], heaviness: 2, flavors: ["salty"] },
  dinde: { key: "dinde", label: "dinde", roles: ["protein"], proteinFamily: "poultry", cuisines: ["francaise", "healthy", "rapide", "all"], methods: ["saute", "grill", "bake", "roast"], heaviness: 1, flavors: ["salty"] },
  boeuf: { key: "boeuf", label: "boeuf", roles: ["protein"], proteinFamily: "meat", cuisines: ["francaise", "monde", "all"], methods: ["saute", "grill", "stirfry", "bake", "roast"], heaviness: 3, flavors: ["salty"] },
  poisson: { key: "poisson", label: "poisson", roles: ["protein"], proteinFamily: "fish", cuisines: ["antillaise", "healthy", "monde", "francaise", "all"], methods: ["broth", "grill", "bake", "boil", "steam"], heaviness: 1, flavors: ["salty", "fresh"] },
  saumon: { key: "saumon", label: "saumon", roles: ["protein"], proteinFamily: "fish", cuisines: ["healthy", "francaise", "monde", "all"], methods: ["bake", "grill", "saute", "steam"], heaviness: 2, flavors: ["fat", "fresh"] },
  thon: { key: "thon", label: "thon", roles: ["protein"], proteinFamily: "fish", cuisines: ["rapide", "healthy", "monde", "all"], methods: ["raw", "saute", "grill"], heaviness: 1, flavors: ["salty", "fresh"] },
  crevette: { key: "crevette", label: "crevettes", roles: ["protein"], proteinFamily: "seafood", cuisines: ["antillaise", "monde", "healthy", "all"], methods: ["saute", "boil", "broth", "stirfry", "grill"], heaviness: 1, flavors: ["salty", "fresh"] },
  morue: { key: "morue", label: "morue", roles: ["protein"], proteinFamily: "fish", cuisines: ["antillaise", "all"], methods: ["boil", "saute", "broth"], heaviness: 1, flavors: ["salty"] },
  tofu: { key: "tofu", label: "tofu", roles: ["protein"], proteinFamily: "vegetarian", cuisines: ["healthy", "monde", "rapide", "all"], methods: ["saute", "stirfry", "bake", "grill"], heaviness: 1, flavors: ["salty"] },
  lentilles: { key: "lentilles", label: "lentilles", roles: ["protein", "base"], proteinFamily: "vegetarian", cuisines: ["healthy", "francaise", "monde", "all"], methods: ["boil", "broth"], heaviness: 1, flavors: ["salty"] },
  quinoa: { key: "quinoa", label: "quinoa", roles: ["base"], proteinFamily: "none", cuisines: ["healthy", "monde", "all"], methods: ["boil"], heaviness: 1, flavors: ["salty"] },
  riz: { key: "riz", label: "riz", roles: ["base"], proteinFamily: "none", cuisines: ["antillaise", "healthy", "monde", "rapide", "all"], methods: ["boil", "steam"], heaviness: 1, flavors: ["salty"] },
  pates: { key: "pates", label: "pates", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "monde", "rapide", "all"], methods: ["boil"], heaviness: 2, flavors: ["salty"] },
  pain: { key: "pain", label: "pain", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "rapide", "all"], methods: ["bake", "grill"], heaviness: 2, flavors: ["salty"] },
  farine: { key: "farine", label: "farine", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "antillaise", "all"], methods: ["bake", "roast"], heaviness: 2, flavors: ["salty"] },
  sucre: { key: "sucre", label: "sucre", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["bake", "raw"], heaviness: 2, flavors: ["fat"] },
  lait: { key: "lait", label: "lait", roles: ["dairy", "sauce"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["raw", "bake", "boil"], heaviness: 1, flavors: ["fat"] },
  "levure boulangere": { key: "levure boulangere", label: "levure boulangere", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["bake"], heaviness: 0, flavors: [] },
  "levure chimique": { key: "levure chimique", label: "levure chimique", roles: ["base"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["bake"], heaviness: 0, flavors: [] },
  chocolat: { key: "chocolat", label: "chocolat", roles: ["topping", "fat", "base"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["raw", "bake"], heaviness: 2, flavors: ["fat"] },
  banane: { key: "banane", label: "banane", roles: ["fruit", "base"], proteinFamily: "none", cuisines: ["all"], methods: ["raw", "bake"], heaviness: 1, flavors: ["fresh"] },
  tomate: { key: "tomate", label: "tomates", roles: ["vegetable", "acid"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "raw", "bake", "stirfry", "roast"], heaviness: 0, flavors: ["acid", "fresh"] },
  oignon: { key: "oignon", label: "oignon", roles: ["aromatic", "vegetable"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "bake", "stirfry", "roast"], heaviness: 0, flavors: ["salty", "fresh"] },
  ail: { key: "ail", label: "ail", roles: ["aromatic", "spice"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "bake", "stirfry", "roast"], heaviness: 0, flavors: ["spice"] },
  carotte: { key: "carotte", label: "carottes", roles: ["vegetable"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "bake", "stirfry", "steam", "roast"], heaviness: 0, flavors: ["fresh"] },
  brocoli: { key: "brocoli", label: "brocoli", roles: ["vegetable"], proteinFamily: "none", cuisines: ["healthy", "francaise", "monde", "all"], methods: ["saute", "boil", "stirfry", "bake", "steam", "roast"], heaviness: 0, flavors: ["fresh"] },
  courgette: { key: "courgette", label: "courgettes", roles: ["vegetable"], proteinFamily: "none", cuisines: ["francaise", "healthy", "monde", "all"], methods: ["saute", "bake", "stirfry", "steam", "roast"], heaviness: 0, flavors: ["fresh"] },
  epinards: { key: "epinards", label: "epinards", roles: ["vegetable"], proteinFamily: "none", cuisines: ["healthy", "francaise", "all"], methods: ["saute", "boil", "bake", "steam"], heaviness: 0, flavors: ["fresh"] },
  aubergine: { key: "aubergine", label: "aubergine", roles: ["vegetable"], proteinFamily: "none", cuisines: ["antillaise", "francaise", "monde", "all"], methods: ["saute", "bake", "stirfry", "roast"], heaviness: 1, flavors: ["fresh"] },
  avocat: { key: "avocat", label: "avocat", roles: ["topping", "fat", "fruit"], proteinFamily: "none", cuisines: ["healthy", "monde", "all"], methods: ["raw"], heaviness: 1, flavors: ["fat", "fresh"] },
  citron: { key: "citron", label: "citron", roles: ["acid"], proteinFamily: "none", cuisines: ["all"], methods: ["raw", "broth", "grill", "boil", "steam"], heaviness: 0, flavors: ["acid", "fresh"] },
  fromage: { key: "fromage", label: "fromage", roles: ["dairy", "fat", "topping"], proteinFamily: "none", cuisines: ["francaise", "rapide", "all"], methods: ["bake", "saute", "roast"], heaviness: 2, flavors: ["fat", "salty"] },
  yaourt: { key: "yaourt", label: "yaourt", roles: ["dairy", "sauce"], proteinFamily: "none", cuisines: ["healthy", "rapide", "monde", "all"], methods: ["raw"], heaviness: 0, flavors: ["fat", "fresh"] },
  creme: { key: "creme", label: "creme", roles: ["dairy", "sauce", "fat"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["saute", "bake", "roast"], heaviness: 3, flavors: ["fat"] },
  "lait de coco": { key: "lait de coco", label: "lait de coco", roles: ["sauce", "fat"], proteinFamily: "none", cuisines: ["antillaise", "monde", "all"], methods: ["boil", "broth", "saute"], heaviness: 2, flavors: ["fat"] },
  "huile d'olive": { key: "huile d'olive", label: "huile d'olive", roles: ["fat"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "roast"], heaviness: 1, flavors: ["fat"] },
  huile: { key: "huile", label: "huile", roles: ["fat"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "roast"], heaviness: 1, flavors: ["fat"] },
  beurre: { key: "beurre", label: "beurre", roles: ["fat"], proteinFamily: "none", cuisines: ["francaise", "all"], methods: ["saute", "bake", "roast"], heaviness: 2, flavors: ["fat"] },
  sel: { key: "sel", label: "sel", roles: ["spice"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "bake", "raw", "grill", "stirfry", "steam", "roast"], heaviness: 0, flavors: ["salty"] },
  poivre: { key: "poivre", label: "poivre", roles: ["spice"], proteinFamily: "none", cuisines: ["all"], methods: ["saute", "boil", "broth", "bake", "raw", "grill", "stirfry", "steam", "roast"], heaviness: 0, flavors: ["spice"] },
  herbes: { key: "herbes", label: "herbes", roles: ["spice", "topping"], proteinFamily: "none", cuisines: ["all"], methods: ["raw", "saute", "bake", "grill", "roast"], heaviness: 0, flavors: ["fresh"] },
  thym: { key: "thym", label: "thym", roles: ["spice"], proteinFamily: "none", cuisines: ["francaise", "antillaise", "all"], methods: ["saute", "broth", "roast"], heaviness: 0, flavors: ["fresh"] },
  piment: { key: "piment", label: "piment", roles: ["spice"], proteinFamily: "none", cuisines: ["antillaise", "monde", "all"], methods: ["saute", "broth", "raw"], heaviness: 0, flavors: ["spice"] },
};

export function normalize(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getIngredientProfile(name: unknown): IngredientProfile {
  const normalized = normalize(name);
  const direct = INGREDIENT_PROFILES[normalized];
  if (direct) return direct;

  for (const [key, profile] of Object.entries(INGREDIENT_PROFILES)) {
    if (normalized.includes(key) || key.includes(normalized)) return profile;
  }

  return {
    key: normalized || "ingredient",
    label: normalized || "ingredient",
    roles: ["other"],
    proteinFamily: "none",
    cuisines: ["all"],
    methods: ["saute", "boil", "bake"],
    heaviness: 0,
    flavors: [],
  };
}

export function hasAbsurdIngredientPair(ingredients: Array<string | undefined | null> = []): boolean {
  const bag = ingredients.map((item) => normalize(item));
  return ABSURD_PAIRS.some(([a, b]) => bag.some((item) => item.includes(a)) && bag.some((item) => item.includes(b)));
}

export function getIngredientBalance(ingredients: Array<string | undefined | null> = []): Record<IngredientRole, number> {
  const totals: Record<IngredientRole, number> = {
    protein: 0,
    base: 0,
    vegetable: 0,
    aromatic: 0,
    fat: 0,
    acid: 0,
    spice: 0,
    dairy: 0,
    sauce: 0,
    topping: 0,
    fruit: 0,
    other: 0,
  };

  for (const ingredient of ingredients) {
    const profile = getIngredientProfile(ingredient);
    for (const role of profile.roles) totals[role] += 1;
  }
  return totals;
}

export function analyzeFlavorBalance(ingredients: Array<string | undefined | null> = []): FlavorBalance {
  const present: Record<FlavorNote, boolean> = {
    acid: false,
    fat: false,
    salty: false,
    spice: false,
    fresh: false,
  };

  for (const ingredient of ingredients) {
    const profile = getIngredientProfile(ingredient);
    for (const note of profile.flavors) present[note] = true;
  }

  const missing = (Object.keys(present) as FlavorNote[]).filter((note) => !present[note]);
  const score = Math.round((((Object.keys(present).length - missing.length) / Object.keys(present).length) * 100));
  return { present, missing, score };
}

export function isCuisineCompatible(ingredient: string, cuisine: string): boolean {
  const profile = getIngredientProfile(ingredient);
  return profile.cuisines.includes("all") || profile.cuisines.includes(cuisine);
}

export function isMethodCompatible(ingredient: string, method: CookingMethod): boolean {
  return getIngredientProfile(ingredient).methods.includes(method);
}

export function validateIngredientSet(ingredients: Array<string | undefined | null> = []): { valid: boolean; reason: string } {
  const list = ingredients.map((item) => normalize(item)).filter(Boolean);
  if (list.length === 0) return { valid: false, reason: "Aucun ingredient fourni" };
  if (hasAbsurdIngredientPair(list)) return { valid: false, reason: "Combinaison culinaire incoherente" };

  const balance = getIngredientBalance(list);
  const hasStructure = balance.protein + balance.base + balance.vegetable >= 2;
  if (!hasStructure) return { valid: false, reason: "Panier insuffisant pour une composition credible" };

  return { valid: true, reason: "Panier coherent" };
}

export function isHeavyRecipe(recipe: RuleRecipe): boolean {
  const haystack = [recipe?.name, ...(recipe?.tags || []), ...(recipe?.ingredients || []), recipe?.style].join(" ").toLowerCase();
  const kcal = recipe?.nutrition?.kcal || 0;
  return kcal > 650 || HEAVY_KEYWORDS.some((key) => haystack.includes(key));
}

export function isLightRecipe(recipe: RuleRecipe): boolean {
  const haystack = [recipe?.name, ...(recipe?.tags || []), ...(recipe?.ingredients || []), recipe?.style].join(" ").toLowerCase();
  const kcal = recipe?.nutrition?.kcal || 0;
  return kcal <= 520 || LIGHT_KEYWORDS.some((key) => haystack.includes(key));
}

export function computeIngredientCompatibilityScore(ingredients: string[], cuisine: string, method: CookingMethod): number {
  const normalizedIngredients = ingredients.map((item) => normalize(item));
  if (hasAbsurdIngredientPair(normalizedIngredients)) return 0;

  let score = 100;
  for (const ingredient of normalizedIngredients) {
    if (!isCuisineCompatible(ingredient, cuisine)) score -= 8;
    if (!isMethodCompatible(ingredient, method)) score -= 10;
  }

  const fishWithHeavyDairy = normalizedIngredients.some((item) => ["poisson", "saumon", "thon", "morue"].includes(getIngredientProfile(item).key))
    && normalizedIngredients.some((item) => ["creme", "fromage"].includes(getIngredientProfile(item).key));
  if (fishWithHeavyDairy && cuisine !== "francaise") score -= 20;

  const flavorBalance = analyzeFlavorBalance(normalizedIngredients);
  score -= flavorBalance.missing.includes("acid") ? 8 : 0;
  score -= flavorBalance.missing.includes("fat") ? 6 : 0;
  score -= flavorBalance.missing.includes("spice") ? 4 : 0;

  return Math.max(0, score);
}

export function validateRecipeCandidate(recipe: RuleRecipe, slot: MealSlot = "lunch"): { valid: boolean; reason: string } {
  const ingredients = (recipe?.ingredients || []).map((item) => normalize(item));
  if (hasAbsurdIngredientPair(ingredients)) return { valid: false, reason: "Combinaison absurde" };

  const method = recipe?.cookingMethod || "saute";
  const cuisine = (recipe?.tags || []).find((tag) => ["francaise", "antillaise", "healthy", "rapide", "monde"].includes(tag)) || "all";
  if (computeIngredientCompatibilityScore(ingredients, cuisine, method) < 58) return { valid: false, reason: "Compatibilite trop faible" };

  if (slot === "dinner" && isHeavyRecipe(recipe)) return { valid: false, reason: "Diner trop lourd" };
  if (slot === "breakfast" && recipe?.proteinFamily === "meat") return { valid: false, reason: "Petit-dejeuner trop lourd" };
  if (slot === "snack" && (recipe?.nutrition?.kcal || 0) > 420) return { valid: false, reason: "Collation trop lourde" };

  return { valid: true, reason: "Recette valide" };
}

export function slotScore(recipe: RuleRecipe, slot: MealSlot): number {
  const kcal = recipe?.nutrition?.kcal || 0;
  const heavyPenalty = isHeavyRecipe(recipe) ? 22 : 0;
  const lightBonus = isLightRecipe(recipe) ? 12 : 0;
  const proteinDiversityBonus = recipe?.proteinFamily && recipe.proteinFamily !== "none" ? 10 : 0;

  if (slot === "breakfast") return 70 + lightBonus + (kcal <= 500 ? 8 : -12) - heavyPenalty;
  if (slot === "lunch") return 76 + proteinDiversityBonus + (kcal >= 450 && kcal <= 820 ? 10 : -8);
  if (slot === "dinner") return 84 + lightBonus + (kcal <= 560 ? 8 : -25) - heavyPenalty;
  return 72 + lightBonus - heavyPenalty;
}

export function filterRecipesForSlot<T extends RuleRecipe>(recipes: T[] = [], slot: MealSlot): T[] {
  return recipes
    .filter((recipe) => validateRecipeCandidate(recipe, slot).valid)
    .sort((a, b) => slotScore(b, slot) - slotScore(a, slot));
}
