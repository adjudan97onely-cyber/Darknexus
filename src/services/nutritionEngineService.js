// Estimation nutritionnelle basée sur les ingrédients
const INGREDIENT_NUTRITION = {
  // Protéines
  "poulet": { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  "poisson": { kcal: 100, protein: 22, carbs: 0, fat: 0.8
 },
  "oeufs": { kcal: 78, protein: 6, carbs: 0.6, fat: 5.3 },
  "fromage": { kcal: 402, protein: 25, carbs: 1.3, fat: 33 },
  "tofu": { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  "lait": { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  
  // Féculents
  "riz": { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "pates": { kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  "pain": { kcal: 265, protein: 9, carbs: 49, fat: 3.4 },
  "farine": { kcal: 364, protein: 10, carbs: 76, fat: 1 },
  
  // Légumes
  "tomate": { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  "oignon": { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  "carotte": { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  "brocoli": { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  
  // Matières grasses
  "huile": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "beurre": { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  
  // Autres
  "sel": { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  "poivre": { kcal: 251, protein: 10, carbs: 64, fat: 3 },
  "ail": { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 },
};

function normalizeIngredientName(ingredient) {
  return ingredient
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .split(/[,;:\s]+/)[0]; // Prend le premier mot
}

function findNutritionData(ingredient) {
  const normalized = normalizeIngredientName(ingredient);
  
  // Recherche exacte
  if (INGREDIENT_NUTRITION[normalized]) {
    return INGREDIENT_NUTRITION[normalized];
  }
  
  // Recherche partielle
  for (const [key, data] of Object.entries(INGREDIENT_NUTRITION)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
  }
  
  // Valeur par défaut (moyenne)
  return { kcal: 50, protein: 2, carbs: 5, fat: 1 };
}

export function estimateRecipeNutrition(ingredients, servings = 1) {
  if (!ingredients || ingredients.length === 0) {
    return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  }
  
  const totals = ingredients.reduce(
    (acc, ingredient) => {
      const nutrition = findNutritionData(ingredient);
      // Diviser par le nombre d'ingrédients pour obtenir une portion
      const portion = 1 / ingredients.length;
      
      return {
        kcal: acc.kcal + nutrition.kcal * portion,
        protein: acc.protein + nutrition.protein * portion,
        carbs: acc.carbs + nutrition.carbs * portion,
        fat: acc.fat + nutrition.fat * portion,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  return {
    kcal: Math.round(totals.kcal * servings),
    protein: Math.round(totals.protein * servings * 10) / 10,
    carbs: Math.round(totals.carbs * servings * 10) / 10,
    fat: Math.round(totals.fat * servings * 10) / 10,
  };
}
