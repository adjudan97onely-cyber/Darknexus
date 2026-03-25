import { generateWeeklyMealPlan } from "../core/mealPlanner";
import {
  calculateDailyNeeds,
  calculateMacroTargets,
  sumDayNutrition,
} from "../core/nutritionEngine";
import { recommendRecipesFromIngredients } from "./aiService";
import { getUserProfile } from "./userProfileService";

export { calculateDailyNeeds, calculateMacroTargets, sumDayNutrition };

export function calculateCalories({ weightKg, heightCm, goal, age = 30, sex = "male", activity = "moderate" }) {
  const needs = calculateDailyNeeds({ weightKg, heightCm, age, sex, activity, goal });
  return needs.targetCalories;
}

export function answerHydrationQuestion(question, goal = "maintain") {
  const q = String(question || "").toLowerCase();

  if (q.includes("coca") || q.includes("soda")) {
    return goal === "lose"
      ? "Le soir ou a 16h, prefere eau petillante citron. Soda classique exceptionnel seulement."
      : "Soda zero occasionnel possible, mais l'hydratation principale doit rester eau/infusion.";
  }

  if (q.includes("16h") || q.includes("soif")) {
    return "A 16h: commence par 300 ml d'eau. Si faim, ajoute fruit + source proteique legere.";
  }

  return "Hydrate-toi a chaque repas + entre les repas: objectif 6 a 10 verres selon ton activite.";
}

export function buildWeeklyNutritionProgram({
  ingredients,
  goal,
  weightKg,
  heightCm,
  age = 30,
  sex = "male",
  activity = "moderate",
  today = new Date(),
  servings = 2,
  cuisine = "all",
  userProfile,
}) {
  const profile = userProfile || getUserProfile();
  return generateWeeklyMealPlan({
    ingredients,
    goal,
    weightKg,
    heightCm,
    age,
    sex,
    activity,
    today,
    servings,
    cuisine,
    userProfile: profile,
  });
}

export function getRealtimeCoach(programDay, now = new Date()) {
  const slots = [
    { key: "breakfast", label: "Petit-dej", time: "08:00" },
    { key: "lunch", label: "Midi", time: "12:30" },
    { key: "snack", label: "Collation", time: "16:00" },
    { key: "dinner", label: "Soir", time: "19:30" },
  ];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const values = slots.map((slot) => ({
    ...slot,
    minuteValue: Number(slot.time.slice(0, 2)) * 60 + Number(slot.time.slice(3, 5)),
  }));

  let current = values[0];
  let next = values[0];
  for (let i = 0; i < values.length; i += 1) {
    if (currentMinutes >= values[i].minuteValue) {
      current = values[i];
      next = values[i + 1] || values[0];
    }
  }

  const delta = next.minuteValue >= currentMinutes ? next.minuteValue - currentMinutes : 24 * 60 - currentMinutes + next.minuteValue;

  return {
    nowLabel: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    currentSlot: current,
    nextSlot: next,
    minutesToNext: delta,
    message: programDay
      ? `Maintenant ${current.label}. Prochaine etape dans ${delta} min (${next.label}).`
      : "Genere ton programme pour activer le coach temps reel.",
  };
}

export function buildDietPlan({ ingredients, goal, weightKg, heightCm, age = 30, sex = "male", activity = "moderate" }) {
  const profile = getUserProfile();
  const needs = calculateDailyNeeds({ weightKg, heightCm, age, sex, activity, goal });
  const macroTargets = calculateMacroTargets(needs.targetCalories, goal);
  const meals = recommendRecipesFromIngredients(ingredients, 6, { cuisine: "all", slot: "lunch", servings: 2, userProfile: profile });
  const dailyTotals = sumDayNutrition(meals.slice(0, 4));

  return {
    targetCalories: needs.targetCalories,
    maintenanceCalories: needs.maintenanceCalories,
    bmr: needs.bmr,
    macroTargets,
    meals,
    dailyTotals,
    hydration: "Eau reguliere + boisson non sucree a 16h.",
    coachMessage: answerHydrationQuestion("j'ai soif a 16h", goal),
  };
}
