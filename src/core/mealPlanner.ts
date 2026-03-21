import { filterRecipesForSlot, type ProteinFamily } from "./foodRules";
import { calculateDailyNeeds, calculateMacroTargets, sumDayNutrition } from "./nutritionEngine";
import { generateRecipeCandidates, type CuisineMode, type EngineRecipe } from "./recipeEngine";
import { normalizeUserProfile, recipeBlockedByProfile, type UserProfile } from "./userProfile";

type Goal = "lose" | "maintain" | "gain";
type ActivityLevel = "low" | "moderate" | "high";

interface MealPlannerInput {
  ingredients: string[];
  goal: Goal;
  weightKg: number;
  heightCm: number;
  age?: number;
  sex?: string;
  activity?: ActivityLevel;
  servings?: number;
  today?: Date;
  cuisine?: CuisineMode;
  userProfile?: Partial<UserProfile>;
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const THEMES = ["Energie maitrisee", "Semaine tonique", "Digestion propre", "Variation proteique", "Equilibre antillais", "Leger mais complet", "Recuperation douce"];
const CUISINE_ROTATION: CuisineMode[] = ["francaise", "healthy", "antillaise", "monde", "healthy", "rapide", "antillaise"];
const PROTEIN_ROTATION: ProteinFamily[] = ["egg", "poultry", "fish", "vegetarian", "seafood", "poultry", "fish"];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(input: Date = new Date()): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function similarityScore(current: EngineRecipe, previous?: EngineRecipe | null): number {
  if (!previous) return 0;
  let score = 0;
  if (current.proteinFamily === previous.proteinFamily) score += 3;
  if (current.blueprintKey === previous.blueprintKey) score += 4;
  if (current.cookingMethod === previous.cookingMethod) score += 2;
  if (current.primaryProtein && current.primaryProtein === previous.primaryProtein) score += 3;
  return score;
}

// Calcule la similitude semantique entre deux recettes (proteine + methode + blueprint)
function dishFamilySimilarity(a: EngineRecipe, b?: EngineRecipe | null): number {
  if (!b) return 0;
  let score = 0;
  // Meme famille complete (ex: "poulet:saute:poelee") — tres forte penalite
  if (a.dishFamily && a.dishFamily === b.dishFamily) score += 12;
  // Meme proteine principale et meme methode de cuisson — plats du meme registre
  else if (a.primaryProtein && a.primaryProtein === b.primaryProtein && a.cookingMethod === b.cookingMethod) score += 8;
  // Meme proteine principale seulement
  else if (a.primaryProtein && a.primaryProtein === b.primaryProtein) score += 5;
  // Meme famille de proteine (ex: volaille) + meme methode
  else if (a.proteinFamily === b.proteinFamily && a.cookingMethod === b.cookingMethod) score += 4;
  // Meme methode de cuisson uniquement
  if (a.cookingMethod === b.cookingMethod) score += 2;
  // Meme blueprint (structure de plat)
  if (a.blueprintKey === b.blueprintKey) score += 3;
  return score;
}

function profileBoost(recipe: EngineRecipe, userProfile: UserProfile): number {
  let score = 0;
  if (userProfile.preferences.includes("healthy") && (recipe.nutrition?.kcal || 0) <= 620) score += 10;
  if (userProfile.preferences.includes("rapide") && ((recipe.prepMinutes || 0) + (recipe.cookMinutes || 0)) <= 25) score += 10;
  if (userProfile.preferences.includes("gourmand") && String(recipe.style || "").includes("gastro")) score += 8;
  if (userProfile.goal === "lose" && (recipe.nutrition?.kcal || 0) <= 560) score += 8;
  if (userProfile.goal === "gain" && (recipe.nutrition?.protein || 0) >= 28) score += 8;
  return score;
}

function pickRecipe(pool: EngineRecipe[], usedIds: Set<string>, targetProtein: ProteinFamily, userProfile: UserProfile, previous?: EngineRecipe | null): EngineRecipe | null {
  const candidates = pool.filter((item) => !usedIds.has(item.id));
  const sorted = [...candidates].sort((a, b) => {
    const proteinPenaltyA = a.proteinFamily === targetProtein ? 0 : 3;
    const proteinPenaltyB = b.proteinFamily === targetProtein ? 0 : 3;
    const similarityA = similarityScore(a, previous);
    const similarityB = similarityScore(b, previous);
    const blockedA = recipeBlockedByProfile(a.ingredients || [], userProfile) ? 1000 : 0;
    const blockedB = recipeBlockedByProfile(b.ingredients || [], userProfile) ? 1000 : 0;
    const scoreA = (a.score || 0) + profileBoost(a, userProfile) - proteinPenaltyA - similarityA * 6 - blockedA;
    const scoreB = (b.score || 0) + profileBoost(b, userProfile) - proteinPenaltyB - similarityB * 6 - blockedB;
    return scoreB - scoreA;
  });
  const selected = sorted[0] || null;
  if (selected) usedIds.add(selected.id);
  return selected;
}

// Calcule si deux recettes appartiennent a la meme "famille de plat" semantique
function sameDishFamily(a: EngineRecipe, b: EngineRecipe): boolean {
  if (!a.dishFamily || !b.dishFamily) return false;
  return a.dishFamily === b.dishFamily;
}

// Choisit la meilleure recette en evitant les familles deja utilisees dans la journee
// et en penalisant la similitude avec les repas precedents (jour precedent ET meme jour)
function pickRecipeWithFamilyControl(
  pool: EngineRecipe[],
  usedIds: Set<string>,
  usedFamiliesInDay: Set<string>,
  targetProtein: ProteinFamily,
  userProfile: UserProfile,
  previousInSequence?: EngineRecipe | null,
  currentDayMeals: Array<EngineRecipe | null> = [],
): EngineRecipe | null {
  const candidates = pool.filter((item) => !usedIds.has(item.id));
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => {
    // Penalite famille: meme famille dans la journee = tres forte penalite
    const dayFamilyPenaltyA = usedFamiliesInDay.has(a.dishFamily || "") ? 60 : 0;
    const dayFamilyPenaltyB = usedFamiliesInDay.has(b.dishFamily || "") ? 60 : 0;

    // Similitude avec le repas precedent dans la sequence (planificateur inter-jours)
    const seqSimilarityA = dishFamilySimilarity(a, previousInSequence);
    const seqSimilarityB = dishFamilySimilarity(b, previousInSequence);

    // Similitude avec tous les repas deja choisis dans la journee courante
    const dayMaxSimilarityA = currentDayMeals.reduce((max, meal) => Math.max(max, meal ? dishFamilySimilarity(a, meal) : 0), 0);
    const dayMaxSimilarityB = currentDayMeals.reduce((max, meal) => Math.max(max, meal ? dishFamilySimilarity(b, meal) : 0), 0);

    // Penalite proteine cible
    const proteinPenaltyA = a.proteinFamily === targetProtein ? 0 : 3;
    const proteinPenaltyB = b.proteinFamily === targetProtein ? 0 : 3;

    // Profil utilisateur
    const blockedA = recipeBlockedByProfile(a.ingredients || [], userProfile) ? 1000 : 0;
    const blockedB = recipeBlockedByProfile(b.ingredients || [], userProfile) ? 1000 : 0;

    const scoreA = (a.score || 0) + profileBoost(a, userProfile)
      - proteinPenaltyA
      - seqSimilarityA * 5
      - dayMaxSimilarityA * 7
      - dayFamilyPenaltyA
      - blockedA;
    const scoreB = (b.score || 0) + profileBoost(b, userProfile)
      - proteinPenaltyB
      - seqSimilarityB * 5
      - dayMaxSimilarityB * 7
      - dayFamilyPenaltyB
      - blockedB;

    return scoreB - scoreA;
  });

  const selected = sorted[0] || null;
  if (selected) {
    usedIds.add(selected.id);
    if (selected.dishFamily) usedFamiliesInDay.add(selected.dishFamily);
  }
  return selected;
}

function buildPoolFor(slot: "breakfast" | "lunch" | "dinner" | "snack", ingredients: string[], cuisine: CuisineMode, servings: number): EngineRecipe[] {
  return generateRecipeCandidates(ingredients, {
    slot,
    cuisine,
    servings,
    limit: 24,
  });
}

export function generateWeeklyMealPlan({
  ingredients,
  goal,
  weightKg,
  heightCm,
  age = 30,
  sex = "male",
  activity = "moderate",
  servings = 2,
  today = new Date(),
  cuisine = "all",
  userProfile,
}: MealPlannerInput) {
  const normalizedProfile = normalizeUserProfile({ goal, ...(userProfile || {}) });
  const needs = calculateDailyNeeds({ weightKg, heightCm, age, sex, activity, goal });
  const macroTargets = calculateMacroTargets(needs.targetCalories, goal);
  const usedIds = new Set<string>();
  const weekStart = getWeekStart(today);
  let previousLunch: EngineRecipe | null = null;
  let previousDinner: EngineRecipe | null = null;

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    const targetCuisine = cuisine === "all" ? CUISINE_ROTATION[index % CUISINE_ROTATION.length] : cuisine;
    const lunchProtein = PROTEIN_ROTATION[index % PROTEIN_ROTATION.length];
    const dinnerProtein: ProteinFamily = lunchProtein === "fish" || lunchProtein === "seafood" ? "vegetarian" : (index % 2 === 0 ? "fish" : "vegetarian");

    const breakfastPool = filterRecipesForSlot(buildPoolFor("breakfast", ingredients, targetCuisine, servings), "breakfast");
    const lunchPool = filterRecipesForSlot(buildPoolFor("lunch", ingredients, targetCuisine, servings), "lunch");
    const dinnerPool = filterRecipesForSlot(buildPoolFor("dinner", ingredients, targetCuisine, servings), "dinner");
    const snackPool = filterRecipesForSlot(buildPoolFor("snack", ingredients, "healthy", servings), "snack").filter((item) => (item.nutrition.kcal || 0) <= 380);

    const breakfast = pickRecipe(breakfastPool, usedIds, index % 2 === 0 ? "egg" : "vegetarian", normalizedProfile, previousDinner);
    // Familles de plats deja choisies dans cette journee — reinitialise a chaque jour
    const dayUsedFamilies = new Set<string>();
    if (breakfast?.dishFamily) dayUsedFamilies.add(breakfast.dishFamily);

    const lunch = pickRecipeWithFamilyControl(
      lunchPool, usedIds, dayUsedFamilies, lunchProtein, normalizedProfile,
      previousLunch,
      [breakfast],
    );

    // Dinner compare contre le dejeuner du MEME jour (pas seulement j-1)
    // pour eviter "poulet saute X" le midi et "poulet saute Y" le soir
    const dinner = pickRecipeWithFamilyControl(
      dinnerPool, usedIds, dayUsedFamilies, dinnerProtein, normalizedProfile,
      previousDinner,
      [breakfast, lunch],
    );

    const snack = pickRecipeWithFamilyControl(
      snackPool, usedIds, dayUsedFamilies, "vegetarian", normalizedProfile,
      breakfast,
      [breakfast, lunch, dinner],
    );

    const backup = pickRecipeWithFamilyControl(
      dinnerPool, usedIds, dayUsedFamilies, lunchProtein, normalizedProfile,
      dinner || lunch,
      [breakfast, lunch, dinner, snack],
    );

    previousLunch = lunch;
    previousDinner = dinner;

    return {
      dateKey: formatDateKey(date),
      dayName: DAY_NAMES[date.getDay()],
      dateLabel: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      theme: `${THEMES[index % THEMES.length]} • ${targetCuisine}`,
      calories: needs.targetCalories,
      meals: { breakfast, lunch, snack, dinner, backup },
      dailyTotals: sumDayNutrition([breakfast, lunch, snack, dinner]),
      beverage: {
        morning: "Eau + boisson chaude sans sucre",
        afternoon: goal === "lose" ? "Eau petillante citron" : "Eau coco ou infusion froide",
        evening: "Infusion digestive",
      },
    };
  });

  return {
    targetCalories: needs.targetCalories,
    maintenanceCalories: needs.maintenanceCalories,
    bmr: needs.bmr,
    macroTargets,
    weekStart: formatDateKey(weekStart),
    days,
  };
}
