/**
 * Nutrition Engine Service
 * Calculates daily caloric and macro nutritional needs
 */

/**
 * Calculate daily nutritional needs using Harris-Benedict formula
 * @param {Object} params - User parameters
 * @returns {Object} Nutritional targets
 */
export function calculateDailyNeeds({ weightKg, heightCm, goal, age = 30, sex = "male", activity = "moderate" }) {
  // Harris-Benedict Basal Metabolic Rate formula
  let bmr;
  if (sex === "male") {
    bmr = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    mild: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[activity] || 1.55);

  // Goal adjustments
  let targetCalories;
  switch (goal) {
    case "lose":
      targetCalories = tdee * 0.85; // 15% deficit
      break;
    case "gain":
      targetCalories = tdee * 1.1; // 10% surplus
      break;
    default:
      targetCalories = tdee;
  }

  return {
    bmr,
    tdee,
    targetCalories,
    goal
  };
}

/**
 * Calculate macro targets based on calories and goal
 * @param {number} calories - Daily calorie target
 * @param {string} goal - Diet goal (lose, gain, maintain)
 * @returns {Object} Macro targets in grams
 */
export function calculateMacroTargets(calories, goal = "maintain") {
  let proteinPercent, carbPercent, fatPercent;

  if (goal === "lose") {
    // Higher protein for muscle retention during loss
    proteinPercent = 0.35;
    carbPercent = 0.40;
    fatPercent = 0.25;
  } else if (goal === "gain") {
    // Balanced macros with adequate calories
    proteinPercent = 0.30;
    carbPercent = 0.45;
    fatPercent = 0.25;
  } else {
    // Balanced maintenance
    proteinPercent = 0.30;
    carbPercent = 0.45;
    fatPercent = 0.25;
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 kcal/g
    carbs: Math.round((calories * carbPercent) / 4),      // 4 kcal/g
    fat: Math.round((calories * fatPercent) / 9)          // 9 kcal/g
  };
}

/**
 * Sum nutrition values for a day of recipes
 * @param {Array} recipes - Array of recipe objects with nutrition data
 * @returns {Object} Summed nutrition values
 */
export function sumDayNutrition(recipes = []) {
  return recipes.reduce((total, recipe) => ({
    kcal: total.kcal + (recipe.nutrition?.kcal || 0),
    protein: total.protein + (recipe.nutrition?.protein || 0),
    carbs: total.carbs + (recipe.nutrition?.carbs || 0),
    fat: total.fat + (recipe.nutrition?.fat || 0)
  }), {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
}

/**
 * Calculate nutrition percentage vs targets
 * @param {Object} current - Current nutrition values
 * @param {Object} target - Target nutrition values
 * @returns {Object} Percentages
 */
export function calculateNutritionPercentage(current, target) {
  return {
    kcal: Math.round((current.kcal / target.kcal) * 100),
    protein: Math.round((current.protein / target.protein) * 100),
    carbs: Math.round((current.carbs / target.carbs) * 100),
    fat: Math.round((current.fat / target.fat) * 100)
  };
}
