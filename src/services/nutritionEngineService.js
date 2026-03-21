const ACTIVITY_FACTORS = {
  low: 1.2,
  moderate: 1.5,
  high: 1.75,
};

const INGREDIENT_MACROS = {
  oeuf: { kcal: 143, protein: 13, carbs: 1.1, fat: 9.5 },
  fromage: { kcal: 330, protein: 22, carbs: 1.3, fat: 26 },
  poulet: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  dinde: { kcal: 145, protein: 29, carbs: 0, fat: 2 },
  poisson: { kcal: 120, protein: 23, carbs: 0, fat: 2.5 },
  saumon: { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  thon: { kcal: 132, protein: 29, carbs: 0, fat: 1 },
  boeuf: { kcal: 250, protein: 26, carbs: 0, fat: 15 },
  tofu: { kcal: 120, protein: 13, carbs: 3, fat: 7 },
  riz: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  pates: { kcal: 157, protein: 5.8, carbs: 31, fat: 0.9 },
  quinoa: { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  farine: { kcal: 364, protein: 10, carbs: 76, fat: 1 },
  pain: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  avoine: { kcal: 389, protein: 17, carbs: 66, fat: 7 },
  pomme: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  banane: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  avocat: { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  tomate: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  oignon: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  carotte: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  brocoli: { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  courgette: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  epinards: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  lentilles: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  haricots: { kcal: 127, protein: 8.7, carbs: 23, fat: 0.5 },
  lait: { kcal: 60, protein: 3.2, carbs: 4.8, fat: 3.3 },
  yaourt: { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  huile: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  olive: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
};

const DEFAULT_INGREDIENT = { kcal: 80, protein: 4, carbs: 8, fat: 3 };

const DEFAULT_GRAMS = {
  oeuf: 100,
  fromage: 40,
  poulet: 150,
  poisson: 150,
  saumon: 150,
  thon: 130,
  tofu: 120,
  riz: 150,
  pates: 180,
  farine: 80,
  pain: 60,
  tomate: 120,
  oignon: 70,
  carotte: 80,
  courgette: 100,
  brocoli: 120,
  avocat: 100,
  lentilles: 150,
  haricots: 140,
  yaourt: 125,
  lait: 200,
  huile: 10,
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferKey(text) {
  const normalized = normalizeText(text);
  const direct = Object.keys(INGREDIENT_MACROS).find((key) => normalized.includes(key));
  return direct || null;
}

function inferGrams(text, key) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+)\s*g/);
  if (match) return Number(match[1]);
  return DEFAULT_GRAMS[key] || 100;
}

function addMacro(base, current, grams) {
  const factor = grams / 100;
  return {
    kcal: base.kcal + current.kcal * factor,
    protein: base.protein + current.protein * factor,
    carbs: base.carbs + current.carbs * factor,
    fat: base.fat + current.fat * factor,
  };
}

function roundMacros(macro) {
  return {
    kcal: Math.round(macro.kcal),
    protein: Math.round(macro.protein * 10) / 10,
    carbs: Math.round(macro.carbs * 10) / 10,
    fat: Math.round(macro.fat * 10) / 10,
  };
}

export function estimateRecipeNutrition(ingredients = [], servings = 1) {
  const total = ingredients.reduce(
    (acc, rawItem) => {
      const item = normalizeText(rawItem);
      const key = inferKey(item);
      const macros = (key && INGREDIENT_MACROS[key]) || DEFAULT_INGREDIENT;
      const grams = inferGrams(item, key);
      return addMacro(acc, macros, grams);
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const safeServings = Math.max(1, Number(servings) || 1);
  return roundMacros({
    kcal: total.kcal / safeServings,
    protein: total.protein / safeServings,
    carbs: total.carbs / safeServings,
    fat: total.fat / safeServings,
  });
}

export function calculateDailyNeeds({
  weightKg,
  heightCm,
  goal = "maintain",
  age = 30,
  sex = "male",
  activity = "moderate",
}) {
  const w = Math.max(35, Number(weightKg) || 70);
  const h = Math.max(130, Number(heightCm) || 170);
  const a = Math.max(14, Number(age) || 30);
  const s = sex === "female" ? -161 : 5;

  const bmr = 10 * w + 6.25 * h - 5 * a + s;
  const tdee = bmr * (ACTIVITY_FACTORS[activity] || ACTIVITY_FACTORS.moderate);

  let target = tdee;
  if (goal === "lose") target = tdee - 450;
  if (goal === "gain") target = tdee + 300;

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(tdee),
    targetCalories: Math.round(Math.max(1200, target)),
  };
}

export function calculateMacroTargets(targetCalories, goal = "maintain") {
  const calories = Math.max(1200, Number(targetCalories) || 2000);

  let proteinRatio = 0.28;
  let carbRatio = 0.42;
  let fatRatio = 0.3;

  if (goal === "lose") {
    proteinRatio = 0.32;
    carbRatio = 0.33;
    fatRatio = 0.35;
  }

  if (goal === "gain") {
    proteinRatio = 0.27;
    carbRatio = 0.48;
    fatRatio = 0.25;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  };
}

export function sumDayNutrition(recipes = []) {
  const totals = recipes.reduce(
    (acc, recipe) => ({
      kcal: acc.kcal + (recipe?.nutrition?.kcal || 0),
      protein: acc.protein + (recipe?.nutrition?.protein || 0),
      carbs: acc.carbs + (recipe?.nutrition?.carbs || 0),
      fat: acc.fat + (recipe?.nutrition?.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return roundMacros(totals);
}
