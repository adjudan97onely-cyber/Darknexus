import { ALL_RECIPES, recommendRecipesFromIngredients } from "./aiService";
import {
  calculateDailyNeeds,
  calculateMacroTargets,
  sumDayNutrition,
} from "./nutritionEngineService";

export function calculateCalories({ weightKg, heightCm, goal, age = 30, sex = "male", activity = "moderate" }) {
  const needs = calculateDailyNeeds({ weightKg, heightCm, goal, age, sex, activity });
  return needs.targetCalories;
}

const DAILY_COACH_THEMES = [
  "Jour energie propre",
  "Jour hydratation et fibres",
  "Jour performance douce",
  "Jour digestion legere",
  "Jour focus mental",
  "Jour recuperation",
  "Jour equilibre plaisir",
];

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const SLOTS = [
  { key: "breakfast", label: "Petit-dej", time: "08:00" },
  { key: "lunch", label: "Midi", time: "12:30" },
  { key: "snack", label: "Collation 16h", time: "16:00" },
  { key: "dinner", label: "Soir", time: "19:30" },
];

// ─── RÈGLES NUTRITIONNISTE ────────────────────────────────────────────────────
const BREAKFAST_FORBIDDEN_TAGS = [
  "frit", "street-food", "bokit", "bbq", "festif", "abats", "gratin"
];

const SNACK_FORBIDDEN_TAGS = [
  "frit", "street-food", "bokit", "plat", "bbq", "festif", "abats"
];

const MEAL_RULES = {
  lose: {
    breakfast: ["leger", "proteine", "fruit", "yaourt", "oeuf", "smoothie"],
    lunch: ["poisson", "legumes", "salade", "leger", "soupe", "equilibre"],
    snack: ["fruit", "leger", "sans-alcool", "boisson"],
    dinner: ["poisson", "legumes", "leger", "soupe", "proteine"],
    forbidden_always: ["frit", "street-food", "bokit", "bbq"],
  },
  gain: {
    breakfast: ["proteine", "complet", "oeuf", "pain"],
    lunch: ["plat", "complet", "proteine", "riz"],
    snack: ["proteine", "fruit", "leger"],
    dinner: ["plat", "proteine", "complet", "riz"],
    forbidden_always: [],
  },
  maintain: {
    breakfast: ["leger", "proteine", "oeuf", "fruit"],
    lunch: ["plat", "equilibre", "proteine"],
    snack: ["fruit", "leger", "boisson"],
    dinner: ["plat", "poisson", "legumes"],
    forbidden_always: [],
  },
};

const BREAKFAST_OPTIONS = {
  lose: [
    { id: "pdj-oeufs-brouilles", name: "Oeufs brouilles aux herbes", category: "petit-dej", tags: ["proteine", "leger", "oeuf"], nutrition: { kcal: 220, protein: 18, carbs: 4, fat: 14 }, prepMinutes: 8, cookMinutes: 5, difficulty: "Facile", ingredients: ["3 oeufs", "Cive, persil", "Sel, poivre", "1 c. a cafe beurre"], steps: ["Bats les oeufs avec sel et poivre.", "Fais fondre le beurre a feu doux.", "Verse les oeufs. Remue doucement jusqu'a prise moelleuse.", "Parseme d'herbes fraiches et sers."], tips: ["Feu doux = oeufs moelleux. Feu fort = oeufs secs."], mistakes: ["Feu trop fort : oeufs caoutchouteux."], image: "https://source.unsplash.com/600x400/?scrambled-eggs-herbs" },
    { id: "pdj-yaourt-fruits", name: "Yaourt nature fruits frais", category: "petit-dej", tags: ["leger", "fruit", "proteine"], nutrition: { kcal: 180, protein: 12, carbs: 22, fat: 4 }, prepMinutes: 5, cookMinutes: 0, difficulty: "Facile", ingredients: ["200 g yaourt nature 0%", "1 banane", "Quelques fraises ou mangue", "1 c. a cafe miel (optionnel)"], steps: ["Verse le yaourt dans un bol.", "Coupe les fruits en morceaux.", "Dispose sur le yaourt. Miel si besoin."], tips: ["Choisis un yaourt grec pour plus de proteines."], mistakes: ["Yaourt sucre industriel : trop de sucre."], image: "https://source.unsplash.com/600x400/?yogurt-fresh-fruits" },
    { id: "pdj-smoothie-vert", name: "Smoothie vert energisant", category: "petit-dej", tags: ["leger", "fruit", "smoothie"], nutrition: { kcal: 160, protein: 8, carbs: 28, fat: 2 }, prepMinutes: 5, cookMinutes: 0, difficulty: "Facile", ingredients: ["1 banane", "1 poignee epinards frais", "200 ml lait vegetal", "1 c. a soupe graines de lin", "Citron vert"], steps: ["Mets tous les ingredients dans le blender.", "Mixe 1 minute.", "Sers immediatement."], tips: ["Ajoute du gingembre rape pour booster."], mistakes: ["Trop de fruits : trop sucre pour un regime."], image: "https://source.unsplash.com/600x400/?green-smoothie-healthy" },
  ],
  gain: [
    { id: "pdj-oeufs-pain", name: "Oeufs au plat pain complet", category: "petit-dej", tags: ["proteine", "complet", "oeuf"], nutrition: { kcal: 420, protein: 28, carbs: 36, fat: 18 }, prepMinutes: 10, cookMinutes: 8, difficulty: "Facile", ingredients: ["3 oeufs", "2 tranches pain complet", "1 avocat", "Sel, poivre, cive"], steps: ["Grille le pain.", "Fais cuire les oeufs au plat.", "Ecrase l'avocat sur le pain. Pose les oeufs par-dessus.", "Sel, poivre, cive."], tips: ["Ajoute du fromage pour encore plus de proteines."], mistakes: ["Blanc d'oeuf cru : risque sanitaire."], image: "https://source.unsplash.com/600x400/?eggs-avocado-toast" },
    { id: "pdj-omelette-proteines", name: "Omelette haute proteine", category: "petit-dej", tags: ["proteine", "oeuf", "muscle"], nutrition: { kcal: 380, protein: 32, carbs: 6, fat: 24 }, prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", ingredients: ["4 oeufs", "50 g fromage rape", "Jambon en des", "Cive, persil", "Sel, poivre"], steps: ["Bats les oeufs avec sel et poivre.", "Verse dans une poele chaude huilee.", "Ajoute fromage et jambon au centre.", "Plie l'omelette. Sers avec cive."], tips: ["4 oeufs = 24g de proteines = excellent pour la prise de masse."], mistakes: ["Omelette trop cuite : seche."], image: "https://source.unsplash.com/600x400/?protein-omelette-cheese" },
  ],
  maintain: [
    { id: "pdj-oeuf-toast", name: "Oeuf poche toast avocat", category: "petit-dej", tags: ["equilibre", "proteine", "oeuf"], nutrition: { kcal: 320, protein: 18, carbs: 28, fat: 16 }, prepMinutes: 10, cookMinutes: 5, difficulty: "Facile", ingredients: ["2 oeufs", "2 tranches pain complet", "1/2 avocat", "Citron vert", "Sel, poivre"], steps: ["Grille le pain.", "Poche les oeufs : eau frissonnante avec vinaigre, 3 minutes.", "Ecrase l'avocat sur le pain.", "Pose les oeufs poches par-dessus. Citron, sel, poivre."], tips: ["L'oeuf poche = moins de matiere grasse que frit."], mistakes: ["Eau qui bout trop fort : oeuf qui s'etale."], image: "https://source.unsplash.com/600x400/?poached-eggs-avocado-toast" },
    { id: "pdj-porridge-coco", name: "Porridge avoine lait de coco", category: "petit-dej", tags: ["fibres", "equilibre", "doux"], nutrition: { kcal: 340, protein: 10, carbs: 52, fat: 10 }, prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", ingredients: ["80 g flocons d'avoine", "250 ml lait de coco", "1 banane", "1 c. a cafe cannelle", "Fruits rouges"], steps: ["Chauffe le lait de coco dans une casserole.", "Ajoute les flocons. Cuis 5 minutes en remuant.", "Verse dans un bol. Banane en rondelles + fruits rouges + cannelle."], tips: ["Prepare la veille en overnight oats."], mistakes: ["Trop de lait de coco : tres calorique."], image: "https://source.unsplash.com/600x400/?oatmeal-coconut-tropical" },
  ],
};

const SNACK_OPTIONS = {
  lose: [
    { id: "snack-fruit-yaourt", name: "Fruit + yaourt nature", category: "collation", tags: ["leger", "fruit"], nutrition: { kcal: 120, protein: 8, carbs: 16, fat: 2 }, prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["1 fruit de saison", "100 g yaourt nature"], steps: ["Coupe le fruit.", "Sers avec le yaourt."], tips: ["Pomme ou poire = satiete longue."], mistakes: [], image: "https://source.unsplash.com/600x400/?fruit-yogurt-snack" },
    { id: "snack-eau-citron", name: "Eau petillante citron menthe", category: "collation", tags: ["boisson", "sans-alcool", "leger"], nutrition: { kcal: 10, protein: 0, carbs: 2, fat: 0 }, prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["500 ml eau petillante", "1/2 citron vert", "Feuilles de menthe"], steps: ["Presse le citron dans l'eau.", "Ajoute la menthe. Glace."], tips: ["Coupe la faim sans calories."], mistakes: [], image: "https://source.unsplash.com/600x400/?sparkling-water-lemon-mint" },
  ],
  gain: [
    { id: "snack-proteine-noix", name: "Noix + fruit + yaourt grec", category: "collation", tags: ["proteine", "energie"], nutrition: { kcal: 280, protein: 16, carbs: 22, fat: 14 }, prepMinutes: 3, cookMinutes: 0, difficulty: "Facile", ingredients: ["30 g noix de cajou", "1 banane", "150 g yaourt grec"], steps: ["Verse le yaourt.", "Ajoute banane et noix."], tips: ["Collation parfaite post-entrainement."], mistakes: [], image: "https://source.unsplash.com/600x400/?nuts-banana-protein-snack" },
  ],
  maintain: [
    { id: "snack-fruit-sec", name: "Fruits secs et oleagineux", category: "collation", tags: ["energie", "fibre"], nutrition: { kcal: 180, protein: 6, carbs: 20, fat: 10 }, prepMinutes: 1, cookMinutes: 0, difficulty: "Facile", ingredients: ["30 g amandes", "30 g raisins secs"], steps: ["Melange et consomme."], tips: ["Portion controlee : 30g max de chaque."], mistakes: [], image: "https://source.unsplash.com/600x400/?mixed-nuts-dried-fruits" },
  ],
};

function toTimeMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(inputDate = new Date()) {
  const date = new Date(inputDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function pickWithOffset(items, offset) {
  if (!items || !items.length) return null;
  return items[Math.abs(offset) % items.length];
}

// ─── SÉLECTION INTELLIGENTE PAR REPAS ET OBJECTIF ────────────────────────────
function filterByMealType(recipes, mealType, goal) {
  const rules = MEAL_RULES[goal] || MEAL_RULES.maintain;
  const forbiddenAlways = rules.forbidden_always || [];

  const allowed = recipes.filter(recipe => {
    const tags = recipe.tags || [];
    const hasForbidenTag = forbiddenAlways.some(t => tags.includes(t));
    if (hasForbidenTag) return false;

    if (mealType === "breakfast") {
      const hasForbiddenBreakfastTag = BREAKFAST_FORBIDDEN_TAGS.some(t => tags.includes(t));
      if (hasForbiddenBreakfastTag) return false;
    }

    if (mealType === "snack") {
      const hasForbiddenSnackTag = SNACK_FORBIDDEN_TAGS.some(t => tags.includes(t));
      if (hasForbiddenSnackTag) return false;
    }

    return true;
  });

  return allowed;
}

function selectSmartMeals(allRecipes, goal, offset) {
  const goalKey = goal === "lose" ? "lose" : goal === "gain" ? "gain" : "maintain";

  // Petit-déj : toujours depuis les options dédiées
  const breakfastPool = BREAKFAST_OPTIONS[goalKey] || BREAKFAST_OPTIONS.maintain;
  const breakfast = pickWithOffset(breakfastPool, offset);

  // Collation : toujours depuis les options dédiées
  const snackPool = SNACK_OPTIONS[goalKey] || SNACK_OPTIONS.maintain;
  const snack = pickWithOffset(snackPool, offset + 1);

  // Déjeuner : recettes du catalogue filtrées
  const lunchPool = filterByMealType(allRecipes, "lunch", goal);
  const lunch = pickWithOffset(lunchPool, offset + 2);

  // Dîner : recettes légères le soir pour perte de poids
  const dinnerPool = goal === "lose"
    ? filterByMealType(allRecipes, "dinner", goal).filter(r => {
        const kcal = r.nutrition?.kcal || 500;
        return kcal < 550;
      })
    : filterByMealType(allRecipes, "dinner", goal);

  const dinner = pickWithOffset(dinnerPool.length ? dinnerPool : lunchPool, offset + 3);
  const altDinner = pickWithOffset(dinnerPool.length ? dinnerPool : lunchPool, offset + 4);

  return { breakfast, lunch, snack, dinner, altDinner };
}

export function answerHydrationQuestion(question, goal = "maintain") {
  const q = (question || "").toLowerCase();

  if (q.includes("coca") || q.includes("soda")) {
    return goal === "lose"
      ? "A 16h, evite le coca classique. Prends eau petillante + citron vert ou infusion froide. Si envie forte : mini canette zero occasionnelle."
      : "Tu peux prendre un soda zero occasionnel, mais priorite eau, infusion ou eau coco sans sucre ajoute.";
  }

  if (q.includes("soif") || q.includes("16h")) {
    return "A 16h : commence par 300-400 ml d'eau. Si faim associee, ajoute une collation simple (fruit + yaourt nature ou oeuf dur).";
  }

  if (q.includes("boire") || q.includes("boisson")) {
    return "Boissons recommandees : eau, eau citron, infusion menthe, the glace sans sucre, eau coco naturelle en petite portion.";
  }

  return "Hydrate-toi par petites gorgees toute la journee : eau au reveil, eau avant repas, boisson sans sucre l'apres-midi.";
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
}) {
  const needs = calculateDailyNeeds({ weightKg, heightCm, goal, age, sex, activity });
  const macroTargets = calculateMacroTargets(needs.targetCalories, goal);

  const allRecipes = recommendRecipesFromIngredients(
    ingredients && ingredients.length ? ingredients : ["poulet", "poisson", "legumes", "riz"],
    50,
    { cuisine: "all" }
  );

  const weekStart = getWeekStart(today);

  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + idx);
    const offset = idx * 5;
    const dayTheme = DAILY_COACH_THEMES[idx % DAILY_COACH_THEMES.length];

    const selected = selectSmartMeals(allRecipes, goal, offset);

    const meals = {
      breakfast: selected.breakfast,
      lunch: selected.lunch,
      snack: selected.snack,
      dinner: selected.dinner,
      backup: selected.altDinner,
    };

    const totals = sumDayNutrition([meals.breakfast, meals.lunch, meals.snack, meals.dinner]);

    return {
      dateKey: formatDateKey(date),
      dayName: DAY_NAMES[date.getDay()],
      dateLabel: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      theme: dayTheme,
      calories: needs.targetCalories,
      meals,
      dailyTotals: totals,
      beverage: {
        morning: "Eau + boisson chaude sans sucre",
        afternoon: goal === "lose"
          ? "Eau petillante citron / infusion froide"
          : "Eau coco nature ou the glace sans sucre",
        evening: "Infusion menthe/verveine",
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

export function getRealtimeCoach(programDay, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotWithMinutes = SLOTS.map((slot) => ({
    ...slot,
    value: toTimeMinutes(slot.time),
  }));

  let current = slotWithMinutes[0];
  let next = slotWithMinutes[0];

  for (let i = 0; i < slotWithMinutes.length; i += 1) {
    const slot = slotWithMinutes[i];
    if (currentMinutes >= slot.value) {
      current = slot;
      next = slotWithMinutes[i + 1] || slotWithMinutes[0];
    }
  }

  const nextMinutes =
    next.value >= currentMinutes
      ? next.value - currentMinutes
      : 24 * 60 - currentMinutes + next.value;

  const isTodayProgram = Boolean(programDay);

  return {
    nowLabel: now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    currentSlot: current,
    nextSlot: next,
    minutesToNext: nextMinutes,
    message: isTodayProgram
      ? `Maintenant : ${current.label}. Prochaine etape dans ${nextMinutes} min (${next.label} ${next.time}).`
      : "Genere ton programme pour activer le suivi en direct.",
  };
}

export function buildDietPlan({ ingredients, goal, weightKg, heightCm }) {
  const targetCalories = calculateCalories({ weightKg, heightCm, goal });
  const allRecipes = recommendRecipesFromIngredients(
    ingredients && ingredients.length ? ingredients : ["poulet", "poisson", "riz"],
    20,
    { cuisine: "all" }
  );

  const offset = new Date().getDay();
  const selected = selectSmartMeals(allRecipes, goal, offset);
  const theme = DAILY_COACH_THEMES[offset % DAILY_COACH_THEMES.length];

  const meals = {
    breakfast: selected.breakfast,
    lunch: selected.lunch,
    snack1: selected.snack,
    dinner: selected.dinner,
  };

  const dailyTotals = sumDayNutrition([meals.breakfast, meals.lunch, meals.snack1, meals.dinner]);
  const macroTargets = calculateMacroTargets(targetCalories, goal);

  const adviceByGoal = {
    lose: "Deficit doux : legumes + proteines en priorite. Bokits et fritures reserves au weekend uniquement. Petit-dej leger et proteine pour bien demarrer sans pic de glycemie.",
    gain: "Objectif muscle : ajoute une collation proteinee 16h-17h. Diner complet avec glucides complexes. Petit-dej calorique et proteine obligatoire.",
    maintain: "Maintien : portions stables, variete des sources de proteines, hydratation reguliere et constance quotidienne.",
  };

  return {
    targetCalories,
    macroTargets,
    dailyTheme: theme,
    advice: adviceByGoal[goal] || adviceByGoal.maintain,
    hydration: "Hydratation guidee : eau au reveil, eau avant repas, boisson sans sucre l'apres-midi.",
    schedule: {
      breakfast: "07h30 - 08h30",
      lunch: "12h30 - 13h30",
      snack: "16h00",
      dinner: "19h00 - 20h00",
      lateSnack: "21h30 (optionnel si objectif prise de masse)",
    },
    beveragePlan: {
      morning: "Eau + cafe/the non sucre",
      at16h: goal === "lose"
        ? "Eau petillante citron / infusion froide"
        : "Eau coco ou the glace non sucre",
      evening: "Infusion menthe/verveine",
      sodaRule: "Soda classique exceptionnel uniquement. Prefere zero ou eau aromatisee maison.",
    },
    meals,
    dailyTotals,
    coachMessage: answerHydrationQuestion("j'ai soif a 16h, je peux boire un coca ?", goal),
  };
}
