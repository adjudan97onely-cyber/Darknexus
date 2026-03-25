import { filterRecipesForSlot, type ProteinFamily } from "./foodRules";
import { calculateDailyNeeds, calculateMacroTargets, sumDayNutrition } from "./nutritionEngine";
import { generateRecipeCandidates, type CuisineMode, type EngineRecipe } from "./recipeEngine";
import { normalizeUserProfile, recipeBlockedByProfile, type UserProfile } from "./userProfile";
import { ALL_RECIPES } from "../data/recipes";

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
const THEMES = [
  "Energie maitrisee", "Semaine tonique", "Saveurs creoles",
  "Variation proteique", "Equilibre du monde", "Leger mais complet", "Recuperation douce",
];
const CUISINE_ROTATION: CuisineMode[] = ["francaise", "antillaise", "healthy", "monde", "antillaise", "rapide", "francaise"];
const PROTEIN_ROTATION: ProteinFamily[] = ["egg", "poultry", "fish", "vegetarian", "seafood", "meat", "fish"];

// --------------- Static recipe bridge ---------------

const PROTEIN_KEYWORDS: Record<ProteinFamily, string[]> = {
  poultry: ["poulet", "dinde", "volaille", "boucane"],
  fish: ["poisson", "morue", "thon", "saumon", "blaff", "court-bouillon", "escabeche"],
  meat: ["boeuf", "cochon", "porc", "steak", "viande", "tripe"],
  seafood: ["crevette", "crabe", "langouste", "lambi", "oursin", "chatrou"],
  egg: ["oeuf", "omelette"],
  vegetarian: ["legume", "vegetarien", "lentille", "haricot", "pois", "avocat", "banane", "chodo", "dombre-haricot"],
  none: [],
};

function detectProteinFamily(recipe: any): ProteinFamily {
  const blob = [recipe.name || "", ...(recipe.tags || []), ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])].join(" ").toLowerCase();
  for (const [family, keywords] of Object.entries(PROTEIN_KEYWORDS) as [ProteinFamily, string[]][]) {
    if (family === "none") continue;
    if (keywords.some((kw) => blob.includes(kw))) return family;
  }
  return "none";
}

function detectSlot(recipe: any): string {
  const tags = (recipe.tags || []).join(" ").toLowerCase();
  const name = (recipe.name || "").toLowerCase();
  if (tags.includes("dessert") || name.includes("chodo") || name.includes("chaudeau")) return "snack";
  if (tags.includes("street-food") || name.includes("bokit") || name.includes("agoulou")) return "snack";
  if (tags.includes("petit-dej") || tags.includes("breakfast")) return "breakfast";
  return "lunch"; // lunch doubles as dinner candidate
}

function staticRecipeToEngine(r: any, servings: number): EngineRecipe {
  const proteinFamily = detectProteinFamily(r);
  const ingredientNames = Array.isArray(r.ingredients)
    ? r.ingredients.map((i: string) => {
        const m = i.match(/^[\d.,/]+\s*(?:g|kg|ml|cl|L|c\.?\s*[aà]\s*(?:soupe|cafe))?\s*(.+)$/i);
        return m ? m[1].trim() : i;
      })
    : [];
  const cuisineStr = (r.cuisine || "all").toLowerCase();
  const slot = detectSlot(r);
  return {
    id: `static-${r.id}`,
    source: "static-database",
    cuisine: cuisineStr as any,
    mode: "normal",
    style: cuisineStr === "antillaise" ? "saveurs creoles" : `${cuisineStr} maison`,
    dishType: r.tags?.[0] || "plat",
    difficulty: r.difficulty || "Facile",
    prepMinutes: r.prepMinutes || 15,
    cookMinutes: r.cookMinutes || 20,
    restMinutes: r.restMinutes || 0,
    servings,
    ingredientsDetailed: Array.isArray(r.ingredients)
      ? r.ingredients.map((line: string) => {
          const m = line.match(/^([\d.,/]+)\s*(g|kg|ml|cl|L|c\.?\s*a\s*(?:soupe|cafe))?\s*(.+)$/i);
          if (m) return { name: m[3].trim(), quantity: parseFloat(m[1].replace(",", ".")), unit: m[2] || "" };
          return { name: line, quantity: 1, unit: "" };
        })
      : [],
    ingredients: ingredientNames,
    steps: r.steps || [],
    tags: r.tags || [],
    tips: r.tips || [],
    mistakes: r.mistakes || [],
    slotHints: slot === "snack" ? ["snack", "lunch"] : slot === "lunch" ? ["lunch", "dinner"] : [slot as any],
    nutrition: r.nutrition || { kcal: 500, protein: 22, carbs: 50, fat: 20 },
    imagePrompt: r.name || "",
    score: 75,
    matchReason: `Recette verifiee: ${r.name}`,
    blueprintKey: `static-${r.id}`,
    cookingMethod: "saute" as any,
    proteinFamily,
    primaryProtein: ingredientNames[0] || undefined,
    dishFamily: `static:${r.id}`,
    name: r.name,
    flavorBalance: { score: 80, balance: ["acid", "fat", "fresh"], missing: [], notes: [] },
  } as EngineRecipe;
}

let _staticCache: Map<string, EngineRecipe[]> | null = null;

function getStaticPool(slot: string, cuisine: CuisineMode, servings: number): EngineRecipe[] {
  if (!_staticCache) {
    _staticCache = new Map();
    for (const r of ALL_RECIPES) {
      const engine = staticRecipeToEngine(r, 2); // base 2 portions, scaled later if needed
      const s = detectSlot(r);
      const slotKeys = s === "lunch" ? ["lunch", "dinner"] : s === "snack" ? ["snack", "lunch"] : [s];
      for (const sk of slotKeys) {
        const arr = _staticCache.get(sk) || [];
        arr.push(engine);
        _staticCache.set(sk, arr);
      }
    }
  }
  const all = _staticCache.get(slot) || [];
  const pool = cuisine === "all" ? all : (() => {
    const filtered = all.filter((r) => r.cuisine === cuisine || r.cuisine === "all");
    return filtered.length >= 3 ? filtered : all;
  })();
  // Shuffle to avoid always picking the same static recipes first
  return pool.map((r) => ({ ...r, score: r.score + Math.random() * 10 }));
}

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
  const generated = generateRecipeCandidates(ingredients, {
    slot,
    cuisine,
    servings,
    limit: 30,
  });
  const statics = getStaticPool(slot, cuisine, servings);
  // Merge: static recipes first (higher quality), then generated, deduplicated by id
  const seen = new Set<string>();
  const merged: EngineRecipe[] = [];
  for (const r of [...statics, ...generated]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }
  return merged;
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
