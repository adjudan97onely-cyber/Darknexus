import { normalize } from "./foodRules.ts";

type Goal = "lose" | "maintain" | "gain";
type ActivityLevel = "low" | "moderate" | "high";

interface MacroValues {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface IngredientAmount {
  name: string;
  quantity: number;
  unit: string;
}

interface BodyProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex?: string;
  activity?: ActivityLevel;
  goal?: Goal;
}

interface RecipeLike {
  nutrition?: MacroValues;
  ingredients?: Array<string | IngredientAmount>;
}

const INGREDIENT_MACROS_PER_100G: Record<string, MacroValues> = {
  poulet: { kcal: 165, protein: 31, carbs: 0, fat: 4 },
  dinde: { kcal: 135, protein: 29, carbs: 0, fat: 2 },
  boeuf: { kcal: 250, protein: 26, carbs: 0, fat: 17 },
  poisson: { kcal: 120, protein: 24, carbs: 0, fat: 2 },
  saumon: { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  thon: { kcal: 144, protein: 30, carbs: 0, fat: 2 },
  crevette: { kcal: 99, protein: 24, carbs: 0, fat: 0.3 },
  oeuf: { kcal: 143, protein: 13, carbs: 1, fat: 10 },
  tofu: { kcal: 85, protein: 9, carbs: 2, fat: 5 },
  lentilles: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  haricots: { kcal: 127, protein: 9, carbs: 22, fat: 0.5 },
  riz: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  pates: { kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  quinoa: { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  pain: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  farine: { kcal: 364, protein: 10, carbs: 76, fat: 1 },
  tomate: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  carotte: { kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  oignon: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  brocoli: { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  epinards: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  courgette: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  avocat: { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  banane: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  mangue: { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  ananas: { kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  fromage: { kcal: 350, protein: 24, carbs: 1.5, fat: 27 },
  yaourt: { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  creme: { kcal: 340, protein: 2, carbs: 3, fat: 36 },
  "lait de coco": { kcal: 230, protein: 2.3, carbs: 5.5, fat: 24 },
  huile: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  low: 1.25,
  moderate: 1.45,
  high: 1.7,
};

const GOAL_CALORIE_OFFSETS: Record<Goal, number> = {
  lose: -350,
  maintain: 0,
  gain: 280,
};

function round(value: number): number {
  return Math.max(0, Math.round(value));
}

function findMacroForIngredient(name: string): MacroValues {
  const n = normalize(name);
  const direct = INGREDIENT_MACROS_PER_100G[n];
  if (direct) return direct;

  for (const [key, value] of Object.entries(INGREDIENT_MACROS_PER_100G)) {
    if (n.includes(key)) return value;
  }
  return { kcal: 120, protein: 5, carbs: 12, fat: 4 };
}

function parseApproxWeight(ingredient: string | IngredientAmount): number {
  if (typeof ingredient === "string") {
    const explicitGram = ingredient.match(/(\d+(?:[\.,]\d+)?)\s*g/i);
    if (explicitGram) return Number(explicitGram[1].replace(",", "."));

    const explicitMl = ingredient.match(/(\d+(?:[\.,]\d+)?)\s*ml/i);
    if (explicitMl) return Number(explicitMl[1].replace(",", "."));

    if (ingredient.toLowerCase().includes("oeuf")) return 60;
    if (ingredient.toLowerCase().includes("c\. a soupe") || ingredient.toLowerCase().includes("cas")) return 15;
    if (ingredient.toLowerCase().includes("c\. a cafe") || ingredient.toLowerCase().includes("cac")) return 5;
    return 90;
  }

  const qty = Number(ingredient?.quantity || 0);
  if (!qty) return 90;
  const unit = normalize(ingredient?.unit || "g");
  if (unit === "g") return qty;
  if (unit === "kg") return qty * 1000;
  if (unit === "ml") return qty;
  if (unit === "l") return qty * 1000;
  if (unit === "piece") return qty * 90;
  if (unit === "c. a soupe") return qty * 15;
  if (unit === "c. a cafe") return qty * 5;
  return qty * 100;
}

export function estimateRecipeNutrition(ingredients: Array<string | IngredientAmount> = []): MacroValues {
  const totals: MacroValues = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  for (const ingredient of ingredients) {
    const label = typeof ingredient === "string" ? ingredient : ingredient.name || "ingredient";
    const grams = parseApproxWeight(ingredient);
    const macro = findMacroForIngredient(label);
    const ratio = grams / 100;
    totals.kcal += macro.kcal * ratio;
    totals.protein += macro.protein * ratio;
    totals.carbs += macro.carbs * ratio;
    totals.fat += macro.fat * ratio;
  }

  return {
    kcal: round(totals.kcal),
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fat: round(totals.fat),
  };
}

export function calculateBMR({ weightKg, heightCm, age, sex = "male" }: BodyProfile): number {
  const w = Number(weightKg) || 70;
  const h = Number(heightCm) || 170;
  const a = Number(age) || 30;
  const sexOffset = String(sex).toLowerCase() === "female" ? -161 : 5;
  const bmr = 10 * w + 6.25 * h - 5 * a + sexOffset;
  return round(bmr);
}

export function calculateDailyNeeds({ weightKg, heightCm, age, sex = "male", activity = "moderate", goal = "maintain" }: BodyProfile): { bmr: number; maintenanceCalories: number; targetCalories: number } {
  const bmr = calculateBMR({ weightKg, heightCm, age, sex });
  const factor = ACTIVITY_FACTORS[activity] || ACTIVITY_FACTORS.moderate;
  const maintenanceCalories = round(bmr * factor);
  const targetCalories = round(maintenanceCalories + (GOAL_CALORIE_OFFSETS[goal] || 0));
  return { bmr, maintenanceCalories, targetCalories };
}

export function calculateMacroTargets(targetCalories: number, goal: Goal = "maintain"): { protein: number; carbs: number; fat: number } {
  const kcal = Number(targetCalories) || 2000;
  const splits = {
    lose: { protein: 0.33, carbs: 0.32, fat: 0.35 },
    maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
    gain: { protein: 0.28, carbs: 0.47, fat: 0.25 },
  };
  const split = splits[goal] || splits.maintain;

  return {
    protein: round((kcal * split.protein) / 4),
    carbs: round((kcal * split.carbs) / 4),
    fat: round((kcal * split.fat) / 9),
  };
}

export function sumDayNutrition(recipes: Array<RecipeLike | undefined | null> = []): MacroValues {
  return recipes.reduce(
    (acc: MacroValues, recipe: RecipeLike | undefined | null) => {
      const nutrition = recipe?.nutrition || estimateRecipeNutrition(recipe?.ingredients || []);
      acc.kcal += nutrition.kcal || 0;
      acc.protein += nutrition.protein || 0;
      acc.carbs += nutrition.carbs || 0;
      acc.fat += nutrition.fat || 0;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
