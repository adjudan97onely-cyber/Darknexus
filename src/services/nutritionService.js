import { recommendRecipesFromIngredients } from "./aiService";
import {
  calculateDailyNeeds,
  calculateMacroTargets,
  sumDayNutrition,
} from "./nutritionEngineService";

// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Service Nutrition Intelligent
// Règle : dans une même journée, les 4 repas sont TOUJOURS différents
// Entre les jours/semaines : une recette peut revenir, c'est normal
// ═══════════════════════════════════════════════════════════════

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

// ─── RÈGLES PAR OBJECTIF ─────────────────────────────────────────────────────
const BREAKFAST_FORBIDDEN_TAGS = ["frit", "street-food", "bokit", "bbq", "festif", "abats", "gratin", "plat"];
const SNACK_FORBIDDEN_TAGS = ["frit", "street-food", "bokit", "plat", "bbq", "festif", "abats", "gratin"];

const GOAL_RULES = {
  lose: {
    forbidden_always: ["frit", "street-food", "bokit", "bbq"],
    dinner_max_kcal: 550,
  },
  gain: {
    forbidden_always: [],
    dinner_max_kcal: 9999,
  },
  maintain: {
    forbidden_always: [],
    dinner_max_kcal: 700,
  },
};

// ─── PETIT-DÉJEUNERS DÉDIÉS ───────────────────────────────────────────────────
const BREAKFAST_OPTIONS = {
  lose: [
    {
      id: "pdj-oeufs-brouilles",
      name: "Oeufs brouilles aux herbes creoles",
      category: "petit-dej",
      tags: ["proteine", "leger", "oeuf"],
      image: "https://source.unsplash.com/600x400/?scrambled-eggs-herbs",
      prepMinutes: 5, cookMinutes: 8, difficulty: "Facile",
      ingredients: ["3 oeufs", "Cive et persil haches", "Sel, poivre", "1 c. a cafe beurre"],
      steps: [
        "Bats les oeufs avec sel, poivre et cive hachee.",
        "Fais fondre le beurre a feu TRES DOUX.",
        "Verse les oeufs. Remue doucement avec une spatule.",
        "Retire du feu quand encore legerement baveaux — ils finissent de cuire avec la chaleur residuelle.",
        "Parseme de persil frais et sers immediatement.",
      ],
      tips: ["Feu doux = oeufs cremeux. Feu fort = oeufs secs."],
      mistakes: ["Feu trop fort : oeufs caoutchouteux."],
      nutrition: { kcal: 220, protein: 18, carbs: 4, fat: 14 },
    },
    {
      id: "pdj-yaourt-fruits-tropicaux",
      name: "Yaourt nature fruits tropicaux",
      category: "petit-dej",
      tags: ["leger", "fruit", "proteine"],
      image: "https://source.unsplash.com/600x400/?yogurt-tropical-fruits",
      prepMinutes: 5, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["200 g yaourt grec nature 0%", "1/2 mangue", "1/2 banane", "Jus de citron vert", "1 c. a cafe miel (optionnel)"],
      steps: [
        "Verse le yaourt dans un bol.",
        "Coupe mangue et banane en morceaux.",
        "Dispose sur le yaourt.",
        "Quelques gouttes de citron vert et miel si besoin.",
      ],
      tips: ["Yaourt grec = 2x plus de proteines qu'un yaourt classique."],
      mistakes: ["Yaourt sucre industriel : trop de sucre ajoutE."],
      nutrition: { kcal: 200, protein: 14, carbs: 26, fat: 2 },
    },
    {
      id: "pdj-smoothie-vert",
      name: "Smoothie vert energisant",
      category: "petit-dej",
      tags: ["leger", "fruit", "smoothie"],
      image: "https://source.unsplash.com/600x400/?green-smoothie-healthy",
      prepMinutes: 5, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["1 banane", "1 poignee epinards frais", "200 ml lait vegetal non sucre", "1 c. a soupe graines de lin", "Citron vert"],
      steps: [
        "Mets tous les ingredients dans le blender.",
        "Mixe 1 minute jusqu'a consistance lisse.",
        "Sers immediatement.",
      ],
      tips: ["Ajoute du gingembre rape pour booster le metabolisme."],
      mistakes: ["Trop de fruits : trop sucre pour un regime perte de poids."],
      nutrition: { kcal: 180, protein: 8, carbs: 28, fat: 4 },
    },
    {
      id: "pdj-oeuf-poche-toast",
      name: "Oeuf poche sur toast complet",
      category: "petit-dej",
      tags: ["proteine", "leger", "oeuf"],
      image: "https://source.unsplash.com/600x400/?poached-egg-whole-grain-toast",
      prepMinutes: 5, cookMinutes: 5, difficulty: "Facile",
      ingredients: ["2 oeufs", "2 tranches pain complet", "Vinaigre blanc", "Sel, poivre", "Cive hachee"],
      steps: [
        "Grille les tranches de pain complet.",
        "Porte de l'eau a ebullition avec un filet de vinaigre.",
        "Reduis a feu doux (frissonnant). Casse un oeuf dans un bol puis glisse dans l'eau.",
        "Cuis 3 minutes. L'oeuf doit etre ferme dehors, coulant dedans.",
        "Pose sur le toast. Sel, poivre, cive.",
      ],
      tips: ["Vinaigre dans l'eau = blanc qui se resserre autour du jaune."],
      mistakes: ["Eau qui bout fort : oeuf qui s'etale partout."],
      nutrition: { kcal: 280, protein: 18, carbs: 30, fat: 8 },
    },
  ],
  gain: [
    {
      id: "pdj-omelette-proteines",
      name: "Omelette haute proteine jambon-fromage",
      category: "petit-dej",
      tags: ["proteine", "oeuf", "muscle"],
      image: "https://source.unsplash.com/600x400/?protein-omelette-cheese",
      prepMinutes: 5, cookMinutes: 8, difficulty: "Facile",
      ingredients: ["4 oeufs", "50 g fromage rape (Gruyere)", "60 g jambon en des", "Cive, persil", "Sel, poivre"],
      steps: [
        "Bats les oeufs avec sel et poivre.",
        "Verse dans une poele chaude huilee a feu moyen.",
        "Quand les bords prennent, ajoute fromage + jambon au centre.",
        "Plie l'omelette en deux. Sers avec cive.",
      ],
      tips: ["4 oeufs = 24g de proteines — parfait pour la prise de masse matinale."],
      mistakes: ["Omelette trop cuite : seche et sans plaisir."],
      nutrition: { kcal: 420, protein: 34, carbs: 4, fat: 28 },
    },
    {
      id: "pdj-pain-beurre-oeuf",
      name: "Pain beurre antillais + oeufs au plat",
      category: "petit-dej",
      tags: ["proteine", "complet", "oeuf", "antillais"],
      image: "https://source.unsplash.com/600x400/?eggs-bread-butter-breakfast",
      prepMinutes: 5, cookMinutes: 10, difficulty: "Facile",
      ingredients: ["2 tranches pain au beurre antillais", "3 oeufs", "1/2 avocat", "Sel, poivre"],
      steps: [
        "Chauffe une poele a feu moyen avec un peu de beurre.",
        "Casse les oeufs et cuis au plat — blanc pris, jaune coulant.",
        "Ecrase l'avocat sur le pain.",
        "Pose les oeufs par-dessus. Sel et poivre.",
      ],
      tips: ["Le pain au beurre antillais + oeuf = petit-dej de champion."],
      mistakes: ["Jaune trop cuit : perd ses nutriments."],
      nutrition: { kcal: 520, protein: 28, carbs: 42, fat: 28 },
    },
    {
      id: "pdj-porridge-proteines",
      name: "Porridge avoine proteines coco",
      category: "petit-dej",
      tags: ["proteine", "fibres", "energie"],
      image: "https://source.unsplash.com/600x400/?oatmeal-protein-coconut",
      prepMinutes: 5, cookMinutes: 8, difficulty: "Facile",
      ingredients: ["100 g flocons d'avoine", "300 ml lait de coco", "1 scoop proteine vanille (optionnel)", "1 banane", "30 g noix de cajou"],
      steps: [
        "Chauffe le lait de coco dans une casserole.",
        "Ajoute les flocons. Cuis 5 minutes en remuant.",
        "Ajoute la proteine si utilise. Melange bien.",
        "Dans un bol : porridge + banane + noix de cajou.",
      ],
      tips: ["Prepare la veille en overnight oats pour gagner du temps."],
      mistakes: ["Trop de lait de coco : tres calorique, ajuste selon tes besoins."],
      nutrition: { kcal: 520, protein: 24, carbs: 62, fat: 18 },
    },
  ],
  maintain: [
    {
      id: "pdj-oeuf-avocat-toast",
      name: "Toast avocat oeuf poche",
      category: "petit-dej",
      tags: ["equilibre", "proteine", "oeuf"],
      image: "https://source.unsplash.com/600x400/?avocado-toast-poached-egg",
      prepMinutes: 8, cookMinutes: 5, difficulty: "Facile",
      ingredients: ["2 tranches pain complet", "2 oeufs", "1/2 avocat", "Citron vert", "Sel, poivre, piment"],
      steps: [
        "Grille le pain.",
        "Poche les oeufs 3 minutes dans eau frissonnante + vinaigre.",
        "Ecrase l'avocat avec citron + sel + poivre.",
        "Tartine sur le pain. Pose les oeufs. Piment selon gout.",
      ],
      tips: ["Version signature : ajoute quelques gouttes de sauce chien."],
      mistakes: ["Avocat prepare trop longtemps a l'avance : noircit."],
      nutrition: { kcal: 340, protein: 18, carbs: 30, fat: 18 },
    },
    {
      id: "pdj-porridge-coco-fruits",
      name: "Porridge coco fruits tropicaux",
      category: "petit-dej",
      tags: ["fibres", "equilibre", "fruits"],
      image: "https://source.unsplash.com/600x400/?oatmeal-coconut-tropical-fruits",
      prepMinutes: 5, cookMinutes: 8, difficulty: "Facile",
      ingredients: ["80 g flocons d'avoine", "250 ml lait de coco", "1 banane", "1 c. a cafe cannelle", "Fruits rouges ou mangue"],
      steps: [
        "Chauffe le lait de coco.",
        "Ajoute les flocons. Cuis 5 minutes en remuant.",
        "Verse dans un bol. Banane + fruits + cannelle.",
      ],
      tips: ["Overnight oats = prepare la veille au frigo."],
      mistakes: ["Trop de lait de coco : calorique."],
      nutrition: { kcal: 360, protein: 10, carbs: 56, fat: 12 },
    },
    {
      id: "pdj-smoothie-mangue",
      name: "Smoothie mangue banane proteines",
      category: "petit-dej",
      tags: ["fruit", "smoothie", "proteine"],
      image: "https://source.unsplash.com/600x400/?mango-banana-smoothie",
      prepMinutes: 5, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["1 mangue", "1 banane", "200 ml lait de coco", "100 g yaourt grec", "Citron vert"],
      steps: [
        "Mets tout dans le blender.",
        "Mixe 1 minute.",
        "Sers avec de la glace.",
      ],
      tips: ["Ajoute des graines de chia pour les fibres."],
      mistakes: ["Mangue pas mure : smoothie sans saveur."],
      nutrition: { kcal: 320, protein: 12, carbs: 54, fat: 6 },
    },
  ],
};

// ─── COLLATIONS DÉDIÉES ────────────────────────────────────────────────────────
const SNACK_OPTIONS = {
  lose: [
    {
      id: "snack-fruit-yaourt-lose",
      name: "Fruit + yaourt nature 0%",
      category: "collation",
      tags: ["leger", "fruit", "proteine"],
      image: "https://source.unsplash.com/600x400/?fruit-yogurt-healthy-snack",
      prepMinutes: 2, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["1 fruit (pomme, poire ou orange)", "100 g yaourt nature 0%"],
      steps: ["Coupe le fruit en morceaux.", "Sers avec le yaourt."],
      tips: ["Pomme ou poire = satiete longue grace aux fibres."],
      mistakes: ["Yaourt sucre : trop de sucres caches."],
      nutrition: { kcal: 130, protein: 8, carbs: 18, fat: 1 },
    },
    {
      id: "snack-eau-citron-menthe",
      name: "Eau petillante citron-menthe",
      category: "collation",
      tags: ["boisson", "sans-alcool", "leger"],
      image: "https://source.unsplash.com/600x400/?sparkling-water-lemon",
      prepMinutes: 2, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["500 ml eau petillante", "1/2 citron vert", "Feuilles de menthe fraiche", "Glace"],
      steps: ["Presse le citron.", "Ajoute menthe et glace.", "Bois lentement."],
      tips: ["Coupe la faim sans aucune calorie — ideal a 16h."],
      mistakes: [],
      nutrition: { kcal: 10, protein: 0, carbs: 2, fat: 0 },
    },
    {
      id: "snack-concombre-citron",
      name: "Concombre citron vert piment",
      category: "collation",
      tags: ["leger", "croquant", "legumes"],
      image: "https://source.unsplash.com/600x400/?cucumber-lime-snack",
      prepMinutes: 3, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["1/2 concombre", "Jus de citron vert", "Sel", "Piment en poudre (optionnel)"],
      steps: ["Coupe le concombre en rondelles.", "Arrose de citron + sel + piment."],
      tips: ["Croquant, hydratant, quasiment 0 calorie."],
      mistakes: [],
      nutrition: { kcal: 30, protein: 1, carbs: 6, fat: 0 },
    },
  ],
  gain: [
    {
      id: "snack-noix-banane-yaourt",
      name: "Noix + banane + yaourt grec",
      category: "collation",
      tags: ["proteine", "energie", "muscle"],
      image: "https://source.unsplash.com/600x400/?nuts-banana-yogurt-protein",
      prepMinutes: 3, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["30 g noix de cajou", "1 banane", "150 g yaourt grec"],
      steps: ["Verse le yaourt.", "Ajoute banane en rondelles et noix."],
      tips: ["Collation parfaite post-entrainement : proteines + glucides rapides."],
      mistakes: [],
      nutrition: { kcal: 320, protein: 18, carbs: 34, fat: 14 },
    },
    {
      id: "snack-pain-beurre-cacahuete",
      name: "Pain complet beurre de cacahuete",
      category: "collation",
      tags: ["proteine", "energie", "lipides"],
      image: "https://source.unsplash.com/600x400/?peanut-butter-toast",
      prepMinutes: 2, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["2 tranches pain complet", "2 c. a soupe beurre de cacahuete 100%", "1 banane"],
      steps: ["Tartine le pain de beurre de cacahuete.", "Ajoute rondelles de banane."],
      tips: ["Beurre de cacahuete 100% = sans sucre ajoute."],
      mistakes: ["Beurre de cacahuete industriel : plein de sucre."],
      nutrition: { kcal: 380, protein: 16, carbs: 44, fat: 16 },
    },
  ],
  maintain: [
    {
      id: "snack-fruits-secs-oleagineux",
      name: "Fruits secs et oleagineux",
      category: "collation",
      tags: ["energie", "fibre", "equilibre"],
      image: "https://source.unsplash.com/600x400/?mixed-nuts-dried-fruits",
      prepMinutes: 1, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["20 g amandes", "20 g noix", "30 g raisins secs"],
      steps: ["Melange et consomme tranquillement."],
      tips: ["Portion controlee : 30g max d'oleagineux par collation."],
      mistakes: ["Trop de quantite : tres dense en calories."],
      nutrition: { kcal: 200, protein: 6, carbs: 22, fat: 12 },
    },
    {
      id: "snack-fruit-amandes",
      name: "Fruit frais + amandes",
      category: "collation",
      tags: ["leger", "equilibre", "fruit"],
      image: "https://source.unsplash.com/600x400/?apple-almonds-snack",
      prepMinutes: 2, cookMinutes: 0, difficulty: "Facile",
      ingredients: ["1 pomme ou poire", "20 g amandes"],
      steps: ["Mange la pomme avec les amandes."],
      tips: ["Fibre + lipides = satiete 2-3 heures."],
      mistakes: [],
      nutrition: { kcal: 170, protein: 5, carbs: 22, fat: 8 },
    },
  ],
};

// ─── FONCTIONS UTILITAIRES ────────────────────────────────────────────────────
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

// ─── SÉLECTION INTELLIGENTE ───────────────────────────────────────────────────
// Règle : dans une même journée, les 4 repas doivent être TOUS différents
// Entre les jours : une recette peut revenir, c'est normal

function pickUnique(pool, offset, usedIds) {
  if (!pool || !pool.length) return null;
  let i = Math.abs(offset) % pool.length;
  let attempts = 0;
  // Cherche une recette pas encore utilisée ce jour-là
  while (usedIds.has(pool[i]?.id) && attempts < pool.length) {
    i = (i + 1) % pool.length;
    attempts++;
  }
  // Même si toutes utilisées, prend quand même (évite le null)
  if (pool[i]) usedIds.add(pool[i].id);
  return pool[i] || null;
}

function filterCatalogForMeal(allRecipes, mealType, goal) {
  const rules = GOAL_RULES[goal] || GOAL_RULES.maintain;
  const forbiddenAlways = rules.forbidden_always || [];

  return allRecipes.filter(recipe => {
    const tags = recipe.tags || [];
    const kcal = recipe.nutrition?.kcal || 500;

    // Interdit selon l'objectif
    if (forbiddenAlways.some(t => tags.includes(t))) return false;

    // Interdit au petit-dej
    if (mealType === "breakfast") {
      if (BREAKFAST_FORBIDDEN_TAGS.some(t => tags.includes(t))) return false;
    }

    // Interdit en collation
    if (mealType === "snack") {
      if (SNACK_FORBIDDEN_TAGS.some(t => tags.includes(t))) return false;
    }

    // Limite calories pour le dîner en perte de poids
    if (mealType === "dinner" && kcal > rules.dinner_max_kcal) return false;

    return true;
  });
}

function selectSmartMeals(allRecipes, goal, dayOffset) {
  const goalKey = ["lose", "gain", "maintain"].includes(goal) ? goal : "maintain";

  // Set des IDs utilisés ce jour — garantit unicité dans la journée
  const usedIds = new Set();

  // 1. Petit-déj : toujours depuis les options dédiées (jamais du catalogue)
  const breakfastPool = BREAKFAST_OPTIONS[goalKey] || BREAKFAST_OPTIONS.maintain;
  const breakfast = pickUnique(breakfastPool, dayOffset, usedIds);

  // 2. Collation : toujours depuis les options dédiées
  const snackPool = SNACK_OPTIONS[goalKey] || SNACK_OPTIONS.maintain;
  const snack = pickUnique(snackPool, dayOffset + 2, usedIds);

  // 3. Déjeuner : catalogue filtré
  const lunchPool = filterCatalogForMeal(allRecipes, "lunch", goal);
  const lunch = pickUnique(lunchPool.length ? lunchPool : allRecipes, dayOffset + 1, usedIds);

  // 4. Dîner : catalogue filtré (différent du déjeuner obligatoirement)
  const dinnerPool = filterCatalogForMeal(allRecipes, "dinner", goal);
  const dinner = pickUnique(dinnerPool.length ? dinnerPool : allRecipes, dayOffset + 3, usedIds);

  // 5. Alternative dîner (backup)
  const altDinner = pickUnique(dinnerPool.length ? dinnerPool : allRecipes, dayOffset + 4, usedIds);

  return { breakfast, lunch, snack, dinner, altDinner };
}

// ─── QUESTION HYDRATATION ─────────────────────────────────────────────────────
export function answerHydrationQuestion(question, goal = "maintain") {
  const q = (question || "").toLowerCase();

  if (q.includes("coca") || q.includes("soda")) {
    return goal === "lose"
      ? "A 16h, evite le coca classique. Prends eau petillante + citron vert ou infusion froide. Si envie forte : mini canette zero occasionnelle maximum."
      : "Tu peux prendre un soda zero occasionnel, mais priorite eau, infusion ou eau coco sans sucre ajoute.";
  }
  if (q.includes("soif") || q.includes("16h")) {
    return "A 16h : commence par 300-400 ml d'eau. Si faim associee, ajoute une collation simple (fruit + yaourt ou oeuf dur).";
  }
  if (q.includes("boire") || q.includes("boisson")) {
    return "Boissons recommandees : eau, eau citronnee, infusion menthe, the glace sans sucre, eau coco naturelle en petite portion.";
  }
  return "Hydrate-toi par petites gorgees toute la journee : eau au reveil, eau avant chaque repas, boisson sans sucre l'apres-midi.";
}

// ─── PROGRAMME HEBDOMADAIRE ───────────────────────────────────────────────────
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

  const safeIngredients = ingredients && ingredients.length
    ? ingredients
    : ["poulet", "poisson", "legumes", "riz", "tomate"];

  const allRecipes = recommendRecipesFromIngredients(safeIngredients, 50, { cuisine: "all" });
  const weekStart = getWeekStart(today);

  // Calcul de l'offset global basé sur la semaine de l'année
  // → garantit que la semaine prochaine commence avec un offset différent
  const weekNumber = Math.floor(
    (today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
  );
  const weekBaseOffset = weekNumber * 13; // décale de 13 à chaque semaine

  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + idx);

    // Offset unique pour ce jour dans cette semaine
    const dayOffset = weekBaseOffset + idx * 7;
    const dayTheme = DAILY_COACH_THEMES[idx % DAILY_COACH_THEMES.length];

    const selected = selectSmartMeals(allRecipes, goal, dayOffset);

    const meals = {
      breakfast: selected.breakfast,
      lunch: selected.lunch,
      snack: selected.snack,
      dinner: selected.dinner,
      backup: selected.altDinner,
    };

    const totals = sumDayNutrition([
      meals.breakfast,
      meals.lunch,
      meals.snack,
      meals.dinner,
    ]);

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

// ─── COACH EN TEMPS RÉEL ──────────────────────────────────────────────────────
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

  return {
    nowLabel: now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    currentSlot: current,
    nextSlot: next,
    minutesToNext: nextMinutes,
    message: programDay
      ? `Maintenant : ${current.label}. Prochaine etape dans ${nextMinutes} min (${next.label} ${next.time}).`
      : "Genere ton programme pour activer le suivi en direct.",
  };
}

// ─── PLAN JOURNALIER ─────────────────────────────────────────────────────────
export function buildDietPlan({ ingredients, goal, weightKg, heightCm }) {
  const targetCalories = calculateCalories({ weightKg, heightCm, goal });

  const safeIngredients = ingredients && ingredients.length
    ? ingredients
    : ["poulet", "poisson", "riz", "legumes"];

  const allRecipes = recommendRecipesFromIngredients(safeIngredients, 20, { cuisine: "all" });

  const dayOffset = new Date().getDay() * 7;
  const selected = selectSmartMeals(allRecipes, goal, dayOffset);
  const theme = DAILY_COACH_THEMES[new Date().getDay() % DAILY_COACH_THEMES.length];

  const meals = {
    breakfast: selected.breakfast,
    lunch: selected.lunch,
    snack1: selected.snack,
    dinner: selected.dinner,
  };

  const dailyTotals = sumDayNutrition([
    meals.breakfast,
    meals.lunch,
    meals.snack1,
    meals.dinner,
  ]);

  const macroTargets = calculateMacroTargets(targetCalories, goal);

  const adviceByGoal = {
    lose: "Deficit doux : legumes + proteines en priorite. Bokits et fritures reserves au weekend. Petit-dej leger et proteine pour eviter les pics de glycemie.",
    gain: "Objectif muscle : ajoute une collation proteinee 16h-17h et un diner complet avec glucides complexes. Petit-dej calorique obligatoire.",
    maintain: "Maintien : portions stables, variete des proteines, hydratation reguliere et constance quotidienne.",
  };

  return {
    targetCalories,
    macroTargets,
    dailyTheme: theme,
    advice: adviceByGoal[goal] || adviceByGoal.maintain,
    hydration: "Hydratation : eau au reveil, eau avant chaque repas, boisson sans sucre a 16h.",
    schedule: {
      breakfast: "07h30 - 08h30",
      lunch: "12h30 - 13h30",
      snack: "16h00",
      dinner: "19h00 - 20h00",
      lateSnack: "21h30 (optionnel si prise de masse)",
    },
    beveragePlan: {
      morning: "Eau + cafe/the non sucre",
      at16h: goal === "lose"
        ? "Eau petillante citron / infusion froide"
        : "Eau coco ou the glace non sucre",
      evening: "Infusion menthe/verveine",
      sodaRule: "Soda classique exceptionnel. Prefere zero ou eau aromatisee maison.",
    },
    meals,
    dailyTotals,
    coachMessage: answerHydrationQuestion("j'ai soif a 16h, je peux boire un coca ?", goal),
  };
}
