import { recommendRecipesFromIngredients } from "./aiService";
import {
  calculateDailyNeeds,
  calculateMacroTargets,
  sumDayNutrition,
} from "./nutritionEngineService";

// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Nutritionniste Intelligent
// RÈGLES DE VIE RÉELLE :
// - Lundi→Vendredi midi : rapide (max 25 min total)
// - Vendredi soir + Weekend : plats élaborés, festifs
// - Dans une journée : 4 repas TOUJOURS différents
// - Entre les jours : une recette peut revenir, c'est normal
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

// ─── TAGS RAPIDES (midi semaine) ──────────────────────────────
// Recettes faisables en moins de 25 minutes total
const QUICK_TAGS = ["rapide", "leger", "salade", "smoothie", "bowl", "sandwich", "omelette", "healthy"];
const QUICK_MAX_MINUTES = 25; // prep + cook <= 25 min

// ─── TAGS FESTIFS (weekend + vendredi soir) ───────────────────
const FESTIVE_TAGS = ["festif", "tradition", "familial", "weekend", "bbq", "plat", "colombo", "blaff", "matoutou"];

// ─── TAGS INTERDITS au petit-déj ──────────────────────────────
const BREAKFAST_FORBIDDEN = ["frit", "street-food", "bokit", "bbq", "festif", "abats", "gratin", "plat", "poisson", "viande"];

// ─── TAGS INTERDITS en collation ──────────────────────────────
const SNACK_FORBIDDEN = ["frit", "street-food", "bokit", "plat", "bbq", "festif", "abats", "gratin", "poisson"];

// ─── RÈGLES PAR OBJECTIF ─────────────────────────────────────
const GOAL_RULES = {
  lose:     { forbidden: ["frit", "street-food", "bokit", "bbq"], dinner_max_kcal: 550 },
  gain:     { forbidden: [], dinner_max_kcal: 9999 },
  maintain: { forbidden: [], dinner_max_kcal: 700 },
};

// ─── PETIT-DÉJEUNERS DÉDIÉS ──────────────────────────────────
const BREAKFAST_OPTIONS = {
  lose: [
    { id: "pdj-oeufs-brouilles", name: "Oeufs brouilles aux herbes creoles", category: "petit-dej", tags: ["proteine", "leger", "oeuf"], image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "Leger, proteine, parfait pour bien demarrer sans alourdir.", ingredients: ["3 oeufs frais", "Cive et persil haches fin", "Sel, poivre noir", "1 c. a cafe beurre doux"], steps: ["PREPARATION : Bats les 3 oeufs energiquement avec sel et poivre. Ajoute la cive hachee dans l'oeuf battu.", "CUISSON : Fais fondre le beurre dans une poele a feu TRES DOUX — en dessous du frissonnement.", "TEXTURE : Verse les oeufs. Remue LENTEMENT avec une spatule en silicone. Ne laisse jamais l'oeuf coller.", "RETRAIT : Retire du feu quand encore legerement baveux. La chaleur residuelle termine la cuisson.", "SERVICE : Parseme de persil frais et sers immediatement avec une tranche de pain complet grille."], tips: ["Feu doux = oeufs cremeux. Feu fort = oeufs en caoutchouc.", "Retire du feu avant qu'ils semblent cuits — ils continuent 30 secondes."], mistakes: ["Feu trop fort : oeufs granuleux et secs.", "Trop remuer : oeufs en miettes."], nutrition: { kcal: 220, protein: 18, carbs: 4, fat: 14 } },
    { id: "pdj-yaourt-mangue", name: "Yaourt grec mangue citron vert", category: "petit-dej", tags: ["leger", "fruit", "proteine"], image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 0, difficulty: "Facile", description: "Frais, proteine, tropical.", ingredients: ["200 g yaourt grec nature 0%", "1/2 mangue bien mure", "Jus de 1/2 citron vert", "1 c. a cafe miel (optionnel)"], steps: ["Coupe la mangue en petits cubes.", "Verse le yaourt dans un bol.", "Dispose la mangue sur le yaourt.", "Quelques gouttes de citron vert. Miel si besoin."], tips: ["Yaourt grec = 2x plus de proteines qu'un yaourt classique.", "Prepare la veille : encore meilleur froid."], mistakes: ["Yaourt sucre industriel : trop de sucre cache."], nutrition: { kcal: 195, protein: 14, carbs: 24, fat: 2 } },
    { id: "pdj-smoothie-vert", name: "Smoothie vert banane epinards", category: "petit-dej", tags: ["leger", "smoothie", "fruit"], image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 0, difficulty: "Facile", description: "Energisant, vert, plein de nutriments.", ingredients: ["1 banane mure", "1 grosse poignee epinards frais", "200 ml lait vegetal non sucre", "1 c. a soupe graines de lin", "Citron vert"], steps: ["Mets tous les ingredients dans le blender.", "Mixe 60 secondes a pleine puissance.", "Sers avec de la glace."], tips: ["Banane congelee = smoothie plus epais et froid.", "Gingembre rape = boost metabolisme."], mistakes: ["Trop de fruits : pic de glycemie."], nutrition: { kcal: 175, protein: 7, carbs: 28, fat: 4 } },
    { id: "pdj-toast-avocat-oeuf", name: "Toast avocat oeuf poche", category: "petit-dej", tags: ["proteine", "leger", "equilibre"], image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop", prepMinutes: 8, cookMinutes: 5, difficulty: "Facile", description: "Le petit-dej sante par excellence.", ingredients: ["2 tranches pain complet", "2 oeufs", "1/2 avocat mur", "Jus de 1/2 citron vert", "Sel, poivre, piment"], steps: ["Grille le pain a four ou grille-pain.", "Poche les oeufs : eau frissonnante + filet de vinaigre. Glisse l'oeuf casse dans un bol. 3 minutes.", "Ecrase l'avocat avec citron + sel + poivre.", "Tartine sur le pain. Pose les oeufs. Piment."], tips: ["Vinaigre dans l'eau = blanc qui enveloppe le jaune.", "Avocat prepare juste avant : noircit rapidement."], mistakes: ["Eau trop bouillante : oeuf qui s'etale."], nutrition: { kcal: 290, protein: 18, carbs: 28, fat: 12 } },
  ],
  gain: [
    { id: "pdj-omelette-4oeufs", name: "Omelette 4 oeufs jambon fromage", category: "petit-dej", tags: ["proteine", "muscle", "oeuf"], image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "L'omelette de champion. 34g de proteines au petit-dej.", ingredients: ["4 oeufs entiers", "60 g jambon blanc en des", "50 g fromage rape (Gruyere)", "Cive, persil", "Sel, poivre", "1 c. a cafe huile"], steps: ["Bats les 4 oeufs avec sel et poivre.", "Poele chaude a feu moyen avec huile.", "Verse les oeufs. Quand les bords prennent, ajoute jambon + fromage au centre.", "Plie en deux. Sers avec cive hachee."], tips: ["4 oeufs = 24g proteines + fromage = 34g total.", "Ajoute avocat en accompagnement pour les lipides sains."], mistakes: ["Omelette trop cuite : seche."], nutrition: { kcal: 440, protein: 34, carbs: 4, fat: 30 } },
    { id: "pdj-porridge-coco-proteines", name: "Porridge coco avoine + noix", category: "petit-dej", tags: ["proteine", "energie", "fibres"], image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "Dense en calories saines. Parfait avant l'entrainement.", ingredients: ["100 g flocons d'avoine", "300 ml lait de coco", "1 banane", "30 g noix de cajou", "1 c. a cafe cannelle"], steps: ["Chauffe lait de coco a feu moyen.", "Ajoute les flocons. Remue 5 minutes.", "Verse dans un bol. Banane + noix + cannelle."], tips: ["Prepare la veille en overnight oats.", "Ajoute 1 scoop de proteine pour 50g proteines total."], mistakes: ["Trop de lait de coco : tres calorique."], nutrition: { kcal: 520, protein: 18, carbs: 62, fat: 22 } },
    { id: "pdj-pain-oeuf-avocat", name: "Pain beurre antillais oeufs avocat", category: "petit-dej", tags: ["proteine", "antillais", "complet"], image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "Le petit-dej antillais version musculation.", ingredients: ["2 tranches pain au beurre antillais", "3 oeufs", "1/2 avocat", "Sel, poivre"], steps: ["Chauffe poele a feu moyen avec beurre.", "Oeufs au plat : blanc pris, jaune coulant.", "Ecrase l'avocat sur le pain.", "Pose les oeufs. Assaisonne."], tips: ["Jaune coulant = nutriments preserves.", "Pain au beurre antillais = petit bonheur du matin."], mistakes: ["Jaune trop cuit : perd ses vitamines."], nutrition: { kcal: 510, protein: 26, carbs: 40, fat: 28 } },
  ],
  maintain: [
    { id: "pdj-toast-oeuf-maintien", name: "Toast complet oeuf et avocat", category: "petit-dej", tags: ["equilibre", "proteine", "oeuf"], image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", prepMinutes: 8, cookMinutes: 5, difficulty: "Facile", description: "Equilibre parfait : proteines + bons lipides + glucides complexes.", ingredients: ["2 tranches pain complet", "2 oeufs", "1/2 avocat", "Sel, poivre"], steps: ["Grille le pain.", "Oeufs brouilees ou au plat selon preference.", "Avocat ecrase sur le pain.", "Pose les oeufs. Assaisonne."], tips: ["Version festive : ajoute quelques gouttes de sauce chien."], mistakes: ["Avocat prepare trop longtemps a l'avance."], nutrition: { kcal: 340, protein: 18, carbs: 30, fat: 18 } },
    { id: "pdj-porridge-fruits", name: "Porridge avoine fruits tropicaux", category: "petit-dej", tags: ["fibres", "fruit", "doux"], image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "Doux, nourrissant, tropical.", ingredients: ["80 g flocons d'avoine", "250 ml lait demi-ecreme", "1 banane", "Fruits rouges ou mangue", "Cannelle"], steps: ["Chauffe le lait.", "Ajoute les flocons. 5 minutes en remuant.", "Bol + fruits + cannelle."], tips: ["Overnight oats = prepare la veille."], mistakes: [], nutrition: { kcal: 340, protein: 10, carbs: 56, fat: 8 } },
    { id: "pdj-smoothie-mangue-coco", name: "Smoothie mangue coco yaourt", category: "petit-dej", tags: ["fruit", "smoothie", "tropical"], image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 0, difficulty: "Facile", description: "Le smoothie tropical antillais.", ingredients: ["1/2 mangue", "1 banane", "150 ml lait de coco", "100 g yaourt grec", "Citron vert"], steps: ["Tout dans le blender.", "Mixe 1 minute.", "Glace + citron vert."], tips: ["Ajoute graines de chia pour les fibres."], mistakes: [], nutrition: { kcal: 310, protein: 10, carbs: 52, fat: 7 } },
  ],
};

// ─── COLLATIONS DÉDIÉES ──────────────────────────────────────
const SNACK_OPTIONS = {
  lose: [
    { id: "snack-fruit-yaourt", name: "Yaourt 0% + fruit frais", category: "collation", tags: ["leger", "proteine"], image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop", prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["100 g yaourt nature 0%", "1 fruit (pomme, poire, orange)"], steps: ["Coupe le fruit.", "Sers avec le yaourt."], tips: ["Pomme = satiete longue."], mistakes: [], nutrition: { kcal: 125, protein: 7, carbs: 18, fat: 1 } },
    { id: "snack-eau-citron", name: "Eau petillante citron menthe", category: "collation", tags: ["boisson", "leger"], image: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=600&h=400&fit=crop", prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["500 ml eau petillante", "1/2 citron vert", "Menthe fraiche"], steps: ["Presse citron.", "Ajoute menthe + glace."], tips: ["Coupe la faim sans calories."], mistakes: [], nutrition: { kcal: 10, protein: 0, carbs: 2, fat: 0 } },
    { id: "snack-concombre-piment", name: "Concombre citron piment", category: "collation", tags: ["leger", "croquant"], image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop", prepMinutes: 3, cookMinutes: 0, difficulty: "Facile", ingredients: ["1/2 concombre", "Citron vert", "Sel, piment"], steps: ["Rondelles + citron + sel + piment."], tips: [], mistakes: [], nutrition: { kcal: 25, protein: 1, carbs: 5, fat: 0 } },
  ],
  gain: [
    { id: "snack-noix-banane", name: "Noix + banane + yaourt grec", category: "collation", tags: ["proteine", "energie"], image: "https://images.unsplash.com/photo-1559181567-c3190ca9be46?w=600&h=400&fit=crop", prepMinutes: 3, cookMinutes: 0, difficulty: "Facile", ingredients: ["30 g noix de cajou", "1 banane", "150 g yaourt grec"], steps: ["Yaourt + banane + noix."], tips: ["Parfait post-entrainement."], mistakes: [], nutrition: { kcal: 320, protein: 18, carbs: 34, fat: 14 } },
    { id: "snack-pain-cacahuete", name: "Pain complet beurre cacahuete", category: "collation", tags: ["proteine", "energie"], image: "https://images.unsplash.com/photo-1535007813574-0f8d12b6ef3e?w=600&h=400&fit=crop", prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["2 tranches pain complet", "2 c. a soupe beurre de cacahuete 100%", "1 banane"], steps: ["Tartine + banane."], tips: ["Beurre cacahuete 100% sans sucre ajoute."], mistakes: [], nutrition: { kcal: 380, protein: 14, carbs: 44, fat: 16 } },
  ],
  maintain: [
    { id: "snack-fruits-oleagineux", name: "Amandes + fruits secs", category: "collation", tags: ["equilibre", "fibre"], image: "https://images.unsplash.com/photo-1559181567-c3190ca9be46?w=600&h=400&fit=crop", prepMinutes: 1, cookMinutes: 0, difficulty: "Facile", ingredients: ["20 g amandes", "20 g raisins secs"], steps: ["Melange et consomme."], tips: ["30g max d'oleagineux."], mistakes: [], nutrition: { kcal: 190, protein: 5, carbs: 20, fat: 10 } },
    { id: "snack-yaourt-miel", name: "Yaourt grec miel amandes", category: "collation", tags: ["equilibre", "proteine"], image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop", prepMinutes: 2, cookMinutes: 0, difficulty: "Facile", ingredients: ["150 g yaourt grec", "1 c. a cafe miel", "10 amandes"], steps: ["Yaourt + miel + amandes."], tips: [], mistakes: [], nutrition: { kcal: 200, protein: 12, carbs: 18, fat: 8 } },
  ],
};

// ─── MIDIS RAPIDES (semaine uniquement) ──────────────────────
// Recettes faisables en moins de 25 minutes total
const QUICK_LUNCH_OPTIONS = [
  { id: "ql-salade-thon", name: "Salade thon avocat citron", category: "midi-rapide", tags: ["rapide", "proteine", "leger"], image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", prepMinutes: 10, cookMinutes: 0, difficulty: "Facile", description: "5 minutes chrono. Proteine + bons lipides.", ingredients: ["2 boites thon au naturel", "1 avocat", "1 tomate", "Citron vert", "Cive, persil", "Sel, poivre"], steps: ["Egoutte le thon.", "Coupe avocat et tomate en cubes.", "Melange tout. Citron + sel + poivre + cive.", "Sers immediatement."], tips: ["Prepare le soir : garde au frigo sans l'avocat."], mistakes: ["Avocat trop longtemps : noircit."], nutrition: { kcal: 380, protein: 36, carbs: 10, fat: 22 } },
  { id: "ql-oeuf-riz", name: "Riz saute oeufs et legumes", category: "midi-rapide", tags: ["rapide", "equilibre"], image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 12, difficulty: "Facile", description: "Classique rapide. Riz du soir utilise le midi.", ingredients: ["150 g riz cuit", "2 oeufs", "1 poignee petits pois", "Sauce soja", "Ail, cive"], steps: ["Poele chaude avec huile.", "Oeuf brouille dans la poele.", "Ajoute riz + petits pois + ail.", "Sauce soja + cive. 5 minutes a feu vif."], tips: ["Riz froid de la veille = meilleur pour cette recette."], mistakes: [], nutrition: { kcal: 420, protein: 16, carbs: 58, fat: 12 } },
  { id: "ql-wrap-poulet", name: "Wrap poulet crudites sauce chien", category: "midi-rapide", tags: ["rapide", "proteine"], image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&h=400&fit=crop", prepMinutes: 10, cookMinutes: 0, difficulty: "Facile", description: "Faisable en 10 minutes avec du poulet cuit la veille.", ingredients: ["150 g poulet cuit emiette", "1 grande tortilla", "Laitue, tomate, concombre", "Sauce chien ou mayo"], steps: ["Dispose les ingredients sur la tortilla.", "Sauce chien + sel + poivre.", "Roule serre."], tips: ["Poulet cuit la veille = zero cuisson."], mistakes: [], nutrition: { kcal: 400, protein: 30, carbs: 38, fat: 12 } },
  { id: "ql-salade-accras", name: "Salade verte accras froids", category: "midi-rapide", tags: ["rapide", "creole"], image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop", prepMinutes: 8, cookMinutes: 0, difficulty: "Facile", description: "Les accras du soir en salade le midi. Anti-gaspi.", ingredients: ["4 accras (restes)", "Salade verte", "Tomate", "Citron vert", "Vinaigrette legere"], steps: ["Prepare la salade.", "Pose les accras dessus.", "Citron + vinaigrette."], tips: ["Les accras froids ont leur charme."], mistakes: [], nutrition: { kcal: 320, protein: 18, carbs: 26, fat: 14 } },
  { id: "ql-omelette-legumes", name: "Omelette aux legumes 10 minutes", category: "midi-rapide", tags: ["rapide", "proteine", "leger"], image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 8, difficulty: "Facile", description: "Rapide, nourrissant, varie.", ingredients: ["3 oeufs", "1/2 poivron", "1 tomate", "Cive, persil", "Sel, poivre", "Fromage rape (optionnel)"], steps: ["Bats les oeufs.", "Saute les legumes 3 minutes.", "Verse les oeufs. Fromage si desire.", "Plie et sers."], tips: ["Change les legumes selon ce que tu as."], mistakes: [], nutrition: { kcal: 340, protein: 24, carbs: 10, fat: 22 } },
  { id: "ql-soupe-legumes", name: "Soupe legumes express", category: "midi-rapide", tags: ["rapide", "leger", "soupe"], image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop", prepMinutes: 5, cookMinutes: 15, difficulty: "Facile", description: "Rechauffant et leger. Parfait l'hiver.", ingredients: ["2 carottes", "1 courgette", "1 oignon", "500 ml bouillon", "Cive, persil", "Sel, poivre"], steps: ["Coupe les legumes en des.", "Porte le bouillon a ebullition.", "Ajoute les legumes. 12 minutes.", "Mixer partiellement si desire."], tips: ["Ajoute un oeuf poche pour les proteines."], mistakes: [], nutrition: { kcal: 180, protein: 6, carbs: 28, fat: 4 } },
];

// ─── UTILITAIRES ─────────────────────────────────────────────
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

// Vérifie si c'est un jour de semaine (Lundi=1 à Vendredi=5)
function isWeekday(dayIndex) {
  // dayIndex : 0=Dimanche, 1=Lundi, ..., 6=Samedi
  return dayIndex >= 1 && dayIndex <= 5;
}

// Vérifie si c'est le weekend ou vendredi soir
function isWeekend(dayIndex) {
  return dayIndex === 0 || dayIndex === 6; // Dimanche ou Samedi
}

// ─── SÉLECTION UNIQUE DANS LA JOURNÉE ────────────────────────
function pickUnique(pool, offset, usedIds) {
  if (!pool || !pool.length) return null;
  let i = Math.abs(offset) % pool.length;
  let attempts = 0;
  while (usedIds.has(pool[i]?.id) && attempts < pool.length) {
    i = (i + 1) % pool.length;
    attempts++;
  }
  if (pool[i]) usedIds.add(pool[i].id);
  return pool[i] || null;
}

// ─── FILTRE CATALOGUE ────────────────────────────────────────
function filterCatalog(allRecipes, options = {}) {
  const { goal = "maintain", mealType = "lunch", weekday = true } = options;
  const rules = GOAL_RULES[goal] || GOAL_RULES.maintain;

  return allRecipes.filter(recipe => {
    const tags = recipe.tags || [];
    const totalMin = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0);
    const kcal = recipe.nutrition?.kcal || 500;

    // Interdits selon objectif
    if (rules.forbidden.some(t => tags.includes(t))) return false;

    // Petit-dej : interdictions strictes
    if (mealType === "breakfast" && BREAKFAST_FORBIDDEN.some(t => tags.includes(t))) return false;

    // Collation : interdictions
    if (mealType === "snack" && SNACK_FORBIDDEN.some(t => tags.includes(t))) return false;

    // Midi semaine : max 25 minutes
    if (mealType === "lunch" && weekday && totalMin > QUICK_MAX_MINUTES) return false;

    // Dîner perte de poids : max calories
    if (mealType === "dinner" && kcal > rules.dinner_max_kcal) return false;

    return true;
  });
}

// ─── SÉLECTION INTELLIGENTE PAR JOUR ────────────────────────
function selectSmartMeals(allRecipes, goal, dayOffset, dayOfWeek) {
  const goalKey = ["lose", "gain", "maintain"].includes(goal) ? goal : "maintain";
  const weekday = isWeekday(dayOfWeek);
  const weekend = isWeekend(dayOfWeek);
  const usedIds = new Set(); // Garantit l'unicité dans la journée

  // 1. PETIT-DEJ : toujours rapide, depuis les options dédiées
  const breakfastPool = BREAKFAST_OPTIONS[goalKey] || BREAKFAST_OPTIONS.maintain;
  const breakfast = pickUnique(breakfastPool, dayOffset, usedIds);

  // 2. COLLATION : toujours légère, depuis les options dédiées
  const snackPool = SNACK_OPTIONS[goalKey] || SNACK_OPTIONS.maintain;
  const snack = pickUnique(snackPool, dayOffset + 2, usedIds);

  // 3. DÉJEUNER :
  // - Semaine (Lun-Ven) → rapide (max 25 min)
  // - Weekend → plat complet, festif si possible
  let lunch;
  if (weekday) {
    // Midi semaine : d'abord les options rapides dédiées
    const quickPool = QUICK_LUNCH_OPTIONS;
    lunch = pickUnique(quickPool, dayOffset + 1, usedIds);
  } else {
    // Midi weekend : plats complets du catalogue
    const weekendLunchPool = filterCatalog(allRecipes, { goal, mealType: "lunch", weekday: false });
    lunch = pickUnique(weekendLunchPool.length ? weekendLunchPool : allRecipes, dayOffset + 1, usedIds);
  }

  // 4. DÎNER :
  // - Semaine : plat complet mais pas trop lourd
  // - Weekend : festif, élaboré, antillais authentique
  let dinner;
  if (weekend) {
    // Vendredi soir ou weekend : plats festifs
    const festivePool = allRecipes.filter(r =>
      (r.tags || []).some(t => FESTIVE_TAGS.includes(t)) &&
      !(GOAL_RULES[goalKey]?.forbidden || []).some(t => (r.tags || []).includes(t))
    );
    dinner = pickUnique(festivePool.length ? festivePool : allRecipes, dayOffset + 3, usedIds);
  } else {
    // Semaine : plat complet filtré selon objectif
    const dinnerPool = filterCatalog(allRecipes, { goal, mealType: "dinner", weekday });
    dinner = pickUnique(dinnerPool.length ? dinnerPool : allRecipes, dayOffset + 3, usedIds);
  }

  // 5. ALTERNATIVE DÎNER
  const altPool = filterCatalog(allRecipes, { goal, mealType: "dinner", weekday });
  const altDinner = pickUnique(altPool.length ? altPool : allRecipes, dayOffset + 4, usedIds);

  return { breakfast, lunch, snack, dinner, altDinner };
}

// ─── HYDRATATION ─────────────────────────────────────────────
export function answerHydrationQuestion(question, goal = "maintain") {
  const q = (question || "").toLowerCase();
  if (q.includes("coca") || q.includes("soda")) {
    return goal === "lose"
      ? "A 16h, evite le coca classique. Prends eau petillante + citron vert ou infusion froide. Zero sucre = zero sabotage."
      : "Tu peux prendre un soda zero occasionnel. Mais eau > tout le reste.";
  }
  if (q.includes("soif") || q.includes("16h")) {
    return "A 16h : 300-400 ml d'eau d'abord. Si faim persistante : fruit + yaourt ou oeuf dur.";
  }
  if (q.includes("boire") || q.includes("boisson")) {
    return "Priorite : eau, eau citron, infusion menthe, the glace sans sucre, eau coco nature.";
  }
  return "Hydrate par petites gorgees : eau au reveil, avant chaque repas, boisson sans sucre a 16h.";
}

// ─── PROGRAMME HEBDOMADAIRE ──────────────────────────────────
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

  const safeIngredients = ingredients?.length
    ? ingredients
    : ["poulet", "poisson", "legumes", "riz", "tomate"];

  const allRecipes = recommendRecipesFromIngredients(safeIngredients, 50, { cuisine: "all" });
  const weekStart = getWeekStart(today);

  // Offset global basé sur le numéro de semaine → rotation automatique semaine après semaine
  const weekNumber = Math.floor(
    (today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
  );
  const weekBaseOffset = weekNumber * 11;

  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + idx);
    const dayOfWeek = date.getDay(); // 0=Dim, 1=Lun...6=Sam
    const dayOffset = weekBaseOffset + idx * 7;
    const dayTheme = DAILY_COACH_THEMES[idx % DAILY_COACH_THEMES.length];

    const selected = selectSmartMeals(allRecipes, goal, dayOffset, dayOfWeek);

    const meals = {
      breakfast: selected.breakfast,
      lunch: selected.lunch,
      snack: selected.snack,
      dinner: selected.dinner,
      backup: selected.altDinner,
    };

    const totals = sumDayNutrition([meals.breakfast, meals.lunch, meals.snack, meals.dinner]);

    // Label contextuel selon le jour
    const dayContext = isWeekend(dayOfWeek)
      ? "Weekend : profite de plats elabores !"
      : dayOfWeek === 5
        ? "Vendredi : midi rapide, soir festif !"
        : "Semaine : midi rapide, soir complet.";

    return {
      dateKey: formatDateKey(date),
      dayName: DAY_NAMES[dayOfWeek],
      dateLabel: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      theme: dayTheme,
      dayContext,
      isWeekend: isWeekend(dayOfWeek),
      calories: needs.targetCalories,
      meals,
      dailyTotals: totals,
      beverage: {
        morning: "Eau + boisson chaude sans sucre",
        afternoon: goal === "lose" ? "Eau petillante citron / infusion froide" : "Eau coco nature ou the glace",
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

// ─── COACH TEMPS RÉEL ────────────────────────────────────────
export function getRealtimeCoach(programDay, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotWithMinutes = SLOTS.map(slot => ({
    ...slot,
    value: toTimeMinutes(slot.time),
  }));

  let current = slotWithMinutes[0];
  let next = slotWithMinutes[0];

  for (let i = 0; i < slotWithMinutes.length; i++) {
    if (currentMinutes >= slotWithMinutes[i].value) {
      current = slotWithMinutes[i];
      next = slotWithMinutes[i + 1] || slotWithMinutes[0];
    }
  }

  const nextMinutes = next.value >= currentMinutes
    ? next.value - currentMinutes
    : 24 * 60 - currentMinutes + next.value;

  return {
    nowLabel: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    currentSlot: current,
    nextSlot: next,
    minutesToNext: nextMinutes,
    message: programDay
      ? `Maintenant : ${current.label}. Prochaine etape dans ${nextMinutes} min (${next.label} ${next.time}).`
      : "Genere ton programme pour activer le suivi en direct.",
  };
}

// ─── PLAN JOURNALIER ─────────────────────────────────────────
export function buildDietPlan({ ingredients, goal, weightKg, heightCm }) {
  const targetCalories = calculateCalories({ weightKg, heightCm, goal });
  const safeIngredients = ingredients?.length ? ingredients : ["poulet", "poisson", "riz"];
  const allRecipes = recommendRecipesFromIngredients(safeIngredients, 20, { cuisine: "all" });

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOffset = dayOfWeek * 7;
  const selected = selectSmartMeals(allRecipes, goal, dayOffset, dayOfWeek);
  const theme = DAILY_COACH_THEMES[dayOfWeek % DAILY_COACH_THEMES.length];
  const macroTargets = calculateMacroTargets(targetCalories, goal);

  const meals = {
    breakfast: selected.breakfast,
    lunch: selected.lunch,
    snack1: selected.snack,
    dinner: selected.dinner,
  };

  const dailyTotals = sumDayNutrition([meals.breakfast, meals.lunch, meals.snack1, meals.dinner]);

  const advice = {
    lose: "Deficit doux : legumes + proteines prioritaires. Bokits et fritures = weekend seulement. Midi rapide en semaine, soir equilibre.",
    gain: "Objectif muscle : collation proteinee 16h obligatoire. Diner complet + glucides complexes. Petit-dej calorique chaque matin.",
    maintain: "Maintien : portions stables, variete, hydratation. Midi rapide semaine, plaisir weekend.",
  };

  return {
    targetCalories,
    macroTargets,
    dailyTheme: theme,
    advice: advice[goal] || advice.maintain,
    hydration: "Eau au reveil + avant chaque repas + boisson sans sucre a 16h.",
    schedule: {
      breakfast: "07h30 - 08h30",
      lunch: "12h30 - 13h30",
      snack: "16h00",
      dinner: "19h00 - 20h00",
    },
    beveragePlan: {
      morning: "Eau + cafe/the non sucre",
      at16h: goal === "lose" ? "Eau petillante citron / infusion" : "Eau coco ou the glace",
      evening: "Infusion menthe/verveine",
      sodaRule: "Soda classique = exceptionnel. Zero ou eau maison = okay.",
    },
    meals,
    dailyTotals,
    coachMessage: answerHydrationQuestion("soif a 16h coca", goal),
  };
}
