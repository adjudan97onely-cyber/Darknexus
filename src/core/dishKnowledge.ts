/**
 * Base de connaissance culinaire complète
 * Structurée par vraies logiques professionnelles
 * Fichiers séparés par cuisine: dishes/antillais.ts, dishes/francais.ts
 * Pas de génération aléatoire - selection de plats réels
 */

import { PLATS_ANTILLAIS } from "./dishes/antillais";
import { PLATS_FRANCAIS } from "./dishes/francais";

export interface DishProfile {
  id: string;
  name: string;
  desireName: string; // Nom appétissant qui donne envie
  aliases: string[]; // Variantes de nom
  cuisine: string;
  region?: string;
  slot: "breakfast" | "snack" | "lunch" | "dinner" | "dessert";
  difficulty: 1 | 2 | 3 | 4 | 5;
  minChefLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  family: string; // Catégorie (soupe, viande, poisson, pâtes, etc.)
  technique: string; // Technique principale
  baseFamilies: string[]; // Familles d'ingrédients (protéine, légume, etc.)
  fundamentals: string[]; // Règles métier essentielles
  timings: {
    prep: number; // minutes
    cook: number;
    rest?: number;
  };
  servings: number; // Base
  portionAdaptation: "linear" | "moderate" | "complex"; // Complexité d'adaptation aux portions
  signature: string; // L'âme du plat
  profTips: string[];
  mistakes: string[];
  premiumTier: "signature" | "classique" | "essentiel";
  plaisir: {
    gourmandise: 1 | 2 | 3 | 4 | 5;
    texture: 1 | 2 | 3 | 4 | 5;
    visuel: 1 | 2 | 3 | 4 | 5;
    arome: 1 | 2 | 3 | 4 | 5;
  };
  // === KNOWLEDGE LAYER (optionnel, enrichi progressivement) ===
  ingredients?: { name: string; quantity?: string; optional?: boolean }[];
  steps?: string[];
  techniques?: string[];
  tags?: string[];
  baseIngredients?: string[];
  category?: "plat" | "street_food" | "pâte" | "riz" | "poisson" | "viande" | "dessert" | "sauce";
}

/**
 * Type strict pour recette complète (Knowledge Layer)
 * Chaque champ est obligatoire — utilisé pour les plats enrichis
 */
export type Dish = {
  name: string;
  cuisine: "antillaise" | "française";
  category: "plat" | "street_food" | "pâte" | "riz" | "poisson" | "viande" | "dessert" | "sauce";
  ingredients: { name: string; quantity?: string; optional?: boolean }[];
  steps: string[];
  techniques: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  baseIngredients: string[];
};

/** Convertit un DishProfile enrichi en Dish strict */
export function toDish(profile: DishProfile): Dish | null {
  if (!profile.ingredients || !profile.steps) return null;
  return {
    name: profile.name,
    cuisine: profile.cuisine as "antillaise" | "française",
    category: profile.category || "plat",
    ingredients: profile.ingredients,
    steps: profile.steps,
    techniques: profile.techniques || [profile.technique],
    cookingTime: profile.timings.cook,
    difficulty: profile.difficulty <= 2 ? "easy" : profile.difficulty <= 3 ? "medium" : "hard",
    tags: profile.tags || [],
    baseIngredients: profile.baseIngredients || profile.baseFamilies,
  };
}

// ============================================
// PLATS ANTILLAIS — importés depuis dishes/antillais.ts
// ============================================
const ANTILLAIS: DishProfile[] = PLATS_ANTILLAIS;

// ============================================
// PLATS FRANÇAIS — importés depuis dishes/francais.ts
// ============================================
const FRANCAISE: DishProfile[] = PLATS_FRANCAIS;


const MONDIAUX: DishProfile[] = [
  {
    id: "pizza-margherita",
    name: "Pizza margherita",
    desireName: "Pizza margherita croustillante, mozzarella filante",
    aliases: ["pizza", "pizza margherita", "pizza classique"],
    cuisine: "italienne",
    region: "Napoli",
    slot: "lunch",
    difficulty: 3,
    minChefLevel: 3,
    family: "pizza",
    technique: "bake",
    baseFamilies: ["farine", "levure", "tomate", "fromage"],
    fundamentals: ["pate hydratee", "levage 60-90 min", "four tres chaud 280C"],
    timings: { prep: 20, cook: 12, rest: 90 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Pizza croustillante dehors moelleuse dedans, tomate fromage simple",
    profTips: [
      "Pate hydratee (70%) pour moelleux",
      "Levage 60-90 min till double volume",
      "Four 280C+ minimum pour croustillant/mou contraste",
    ],
    mistakes: [
      "Pate pas assez hydratee = pain sec",
      "Levage insuff = pizza dense",
      "Four pas chaud = pizza caoutchouc",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 },
  },
  {
    id: "burger-classique",
    name: "Burger maison",
    desireName: "Burger smashé juteux, fromage fondant, bun toasté",
    aliases: ["burger", "hamburger", "cheeseburger"],
    cuisine: "americaine",
    region: "USA",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "sandwich-viande",
    technique: "sear",
    baseFamilies: ["boeuf", "pain", "fromage", "legumes"],
    fundamentals: ["pain toaste", "steak saisi 2-3 min", "montage minute"],
    timings: { prep: 10, cook: 8, rest: 0 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Burger savoureux steak saisir, pain moelleux toaste, legumes frais",
    profTips: [
      "Pain toaster legerement for resistance humidite",
      "Steak saisir 2-3 min per side exactement",
      "Montage juste avant servir = pain tendre, legumes frais",
    ],
    mistakes: [
      "Pain pas toaste = imbibe de jus",
      "Steak trop longtemps = viande seche",
      "Montage d'avance = pain degoute",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 },
  },
  {
    id: "curry-poulet",
    name: "Curry de poulet",
    desireName: "Curry de poulet onctueux au lait de coco & épices",
    aliases: ["curry", "curry poulet", "curry de poulet"],
    cuisine: "indienne",
    region: "Inde",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "curry",
    technique: "braise",
    baseFamilies: ["poulet", "oignon", "ail", "gingembre", "epices"],
    fundamentals: ["oignon fondant", "poudre curry toastee", "coco lent reduction"],
    timings: { prep: 20, cook: 35, rest: 5 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Poulet tendre sauce curry coco onctueuse, aromatique equilibre",
    profTips: [
      "Oignon fondant 5 min avant ajouter poulet",
      "Poudre curry toaster 1 min pour reveiller",
      "Lait coco reduction lente 25 min pour onctueuse",
    ],
    mistakes: [
      "Oignon pas fondu = texture desagreable",
      "Poudre pas toastee = gout cru",
      "Trop rapide = poulet sec et sauce liquide",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 5, texture: 4, visuel: 4, arome: 5 },
  },
  {
    id: "pad-thai",
    name: "Pad thai",
    desireName: "Pad thaï aux crevettes, cacahuètes & citron vert",
    aliases: ["pad thai", "nouilles thai"],
    cuisine: "thaï",
    region: "Thaïlande",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "nouilles-sautees",
    technique: "sear",
    baseFamilies: ["nouilles-riz", "arachide", "citron", "crevette"],
    fundamentals: ["wok tres chaud", "mouvement constant", "sauce balance sucre-acide"],
    timings: { prep: 15, cook: 8, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Nouilles riz croustillantes, sauce equilibree sucre-acide-pique",
    profTips: [
      "Wok TRES chaud avant commencer",
      "Mouvement constant = cuisson uniforme",
      "Sauce liquide avant ajouter = rien ne reste colle",
    ],
    mistakes: [
      "Wok pas assez chaud = nouilles molles",
      "Mouvement insuff = cuisson inegale",
      "Sauce trop epaisse au debut = colles",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 },
  },
  {
    id: "bouillabaisse",
    name: "Bouillabaisse",
    desireName: "Bouillabaisse marseillaise, rouille safranée & croûtons",
    aliases: ["bouillabaisse", "soupe poisson"],
    cuisine: "francaise",
    region: "Provence",
    slot: "lunch",
    difficulty: 4,
    minChefLevel: 4,
    family: "soupe-poisson",
    technique: "braise",
    baseFamilies: ["poisson-blanc", "crustace", "tomate", "ail", "safran"],
    fundamentals: ["stock poisson fort", "safran & ail essentiels", "cuisson 20 min"],
    timings: { prep: 40, cook: 60, rest: 5 },
    servings: 6,
    portionAdaptation: "moderate",
    signature: "Soupe poisson aromatique riche safran, morceaux tendre, rouille pain",
    profTips: [
      "Stock poisson doit etre fort & aromatique",
      "Safran & ail brayer dans pilon & mortier",
      "Poisson ajoute fin de cuisson pour juste tendre",
    ],
    mistakes: [
      "Stock faible = plat sans caractere",
      "Poisson trop longtemps = chair cassante seche",
      "Safran insuffisant = perte couleur & saveur",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 },
  },
];

// ============================================
// PLATS PROTÉINÉS / SPORT (rapides, riches)
// ============================================
const PROTEINES: DishProfile[] = [
  {
    id: "poulet-grille",
    name: "Poulet grillé épicé",
    desireName: "Poulet grillé croustillant aux épices, jus doré",
    aliases: ["poulet grille", "poulet grillé", "grilled chicken"],
    cuisine: "mondiale",
    region: "International",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "viande-grillee",
    technique: "sear",
    baseFamilies: ["poulet", "epices", "citron"],
    fundamentals: ["saisir haute temperature", "repos 3 min apres cuisson", "assaisonnement avant"],
    timings: { prep: 5, cook: 10, rest: 3 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Poulet juteux croûte épicée dorée, tendre à coeur",
    profTips: [
      "Aplatir les filets pour cuisson uniforme",
      "Poêle très chaude, pas toucher pendant 4 min",
      "Repos 3 min pour redistribution des jus",
    ],
    mistakes: [
      "Poêle pas assez chaude = poulet bouilli",
      "Trop manipuler = pas de croûte",
      "Couper direct = jus perdu",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 4, texture: 5, visuel: 4, arome: 4 },
  },
  {
    id: "steak-minute",
    name: "Steak minute",
    desireName: "Steak saisi à la perfection, beurre d\u0027herbes fondant",
    aliases: ["steak", "steak minute", "bavette"],
    cuisine: "francaise",
    region: "Classique",
    slot: "dinner",
    difficulty: 2,
    minChefLevel: 2,
    family: "viande-grillee",
    technique: "sear",
    baseFamilies: ["boeuf", "beurre", "poivre"],
    fundamentals: ["viande temperature ambiante", "poele fumante", "repos obligatoire"],
    timings: { prep: 3, cook: 6, rest: 3 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Steak saisi parfait, croûte caramélisée, rosé à coeur",
    profTips: [
      "Sortir viande 20 min avant pour temperature ambiante",
      "Assaisonner JUSTE avant cuisson, pas 1h avant",
      "Beurre noisette en fin pour arôme",
    ],
    mistakes: [
      "Viande froide = cuisson inégale",
      "Feu trop bas = viande bouillie grise",
      "Pas de repos = jus dans assiette pas dans viande",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 },
  },
  {
    id: "saumon-poele",
    name: "Saumon poêlé",
    desireName: "Pavé de saumon peau croustillante, beurre citronné",
    aliases: ["saumon", "saumon poele", "pavé de saumon"],
    cuisine: "mondiale",
    region: "International",
    slot: "dinner",
    difficulty: 2,
    minChefLevel: 2,
    family: "poisson-grille",
    technique: "sear",
    baseFamilies: ["saumon", "citron", "aneth"],
    fundamentals: ["peau croustillante cote peau d'abord", "pas trop cuire", "assaisonnement simple"],
    timings: { prep: 3, cook: 8, rest: 0 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Pavé de saumon peau croustillante, chair fondante rosée",
    profTips: [
      "Commencer côté peau 5 min pour croustillant",
      "Retourner 2-3 min only — jamais trop cuit",
      "Citron frais EN FIN, pas pendant cuisson",
    ],
    mistakes: [
      "Commencer côté chair = peau molle",
      "Trop cuit = sec et farineux",
      "Poêle pas chaude = peau colle",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 4 },
  },
  {
    id: "oeufs-brouilles-proteines",
    name: "Oeufs brouillés protéinés",
    desireName: "Œufs brouillés crémeux, ciboulette fraîche",
    aliases: ["oeufs brouilles", "scrambled eggs", "oeufs proteines"],
    cuisine: "mondiale",
    region: "International",
    slot: "breakfast",
    difficulty: 1,
    minChefLevel: 1,
    family: "oeuf",
    technique: "sear",
    baseFamilies: ["oeuf", "beurre", "ciboulette"],
    fundamentals: ["feu doux obligatoire", "remuer constamment", "retirer avant fin cuisson"],
    timings: { prep: 2, cook: 5, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Oeufs crémeux fondants, texture soyeuse",
    profTips: [
      "Feu DOUX — jamais moyen ou fort",
      "Spatule constante pour texture cremeux",
      "Retirer du feu 30 sec AVANT texture finale",
    ],
    mistakes: [
      "Feu trop fort = oeufs caoutchouc",
      "Pas remuer = bloc compact",
      "Trop cuire = secs et granuleux",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 3, texture: 4, visuel: 2, arome: 3 },
  },
  {
    id: "bowl-quinoa-poulet",
    name: "Bowl quinoa poulet",
    desireName: "Bowl protéiné quinoa, poulet grillé & avocat",
    aliases: ["bowl", "buddha bowl", "bowl quinoa", "bowl proteine"],
    cuisine: "mondiale",
    region: "International",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "bowl-complet",
    technique: "boil",
    baseFamilies: ["quinoa", "poulet", "avocat", "tomate"],
    fundamentals: ["quinoa rince avant", "poulet saisi separe", "assemblage equilibre"],
    timings: { prep: 10, cook: 15, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Bowl coloré quinoa-poulet-avocat, nutritif et complet",
    profTips: [
      "Rincer quinoa pour retirer amertume",
      "Poulet émincé + saisir rapide pour juteux",
      "Equilibre: 1/3 quinoa, 1/3 proteine, 1/3 legumes",
    ],
    mistakes: [
      "Quinoa pas rincé = amer",
      "Poulet émincé trop fin = sec",
      "Trop de sauce = plat noyé",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 4, texture: 3, visuel: 5, arome: 3 },
  },
];

// ============================================
// PLATS BUDGET / ÉCONOMIQUES
// ============================================
const BUDGET: DishProfile[] = [
  {
    id: "pates-aglio-olio",
    name: "Pâtes aglio e olio",
    desireName: "Spaghetti à l\u0027ail doré, huile d\u0027olive & piment",
    aliases: ["pates", "pates ail", "aglio olio", "spaghetti ail"],
    cuisine: "italienne",
    region: "Napoli",
    slot: "dinner",
    difficulty: 1,
    minChefLevel: 1,
    family: "pates",
    technique: "boil",
    baseFamilies: ["pates", "ail", "huile-olive", "piment"],
    fundamentals: ["ail dore pas brule", "eau de cuisson reservee", "emulsion huile-eau"],
    timings: { prep: 5, cook: 12, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Spaghetti al dente, ail doré, huile parfumée, piment subtil",
    profTips: [
      "Ail tranche fin, doré PAS brulé (30 sec feu moyen)",
      "Garder 1 louche eau de cuisson pour emulsion",
      "Mélanger pâtes dans poele avec huile, PAS égoutter simplement",
    ],
    mistakes: [
      "Ail brulé = amertume totale",
      "Pas d'eau de cuisson = sec",
      "Pâtes trop cuites = pâteux",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 4, texture: 3, visuel: 3, arome: 5 },
  },
  {
    id: "riz-saute-legumes",
    name: "Riz sauté aux légumes",
    desireName: "Riz sauté au wok, légumes croquants & sauce soja",
    aliases: ["riz saute", "riz sauté", "fried rice"],
    cuisine: "asiatique",
    region: "Asie",
    slot: "dinner",
    difficulty: 1,
    minChefLevel: 1,
    family: "riz-saute",
    technique: "sear",
    baseFamilies: ["riz", "oeuf", "carotte", "soja"],
    fundamentals: ["riz froid obligatoire", "wok tres chaud", "sauce soja en fin"],
    timings: { prep: 5, cook: 8, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Riz sauté wok, grains séparés, légumes croquants",
    profTips: [
      "Riz de la veille FROID — jamais chaud, sinon collant",
      "Wok maximum chaleur, mouvement constant",
      "Sauce soja EN FIN seulement, jamais au debut",
    ],
    mistakes: [
      "Riz chaud = bouillie collante",
      "Feu bas = riz mou, pas grillé",
      "Trop de sauce = riz trempé salé",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 3, texture: 4, visuel: 3, arome: 3 },
  },
  {
    id: "soupe-legumes",
    name: "Soupe de légumes maison",
    desireName: "Velouté de légumes de saison, touche de crème",
    aliases: ["soupe", "soupe legumes", "veloute"],
    cuisine: "francaise",
    region: "Classique",
    slot: "dinner",
    difficulty: 1,
    minChefLevel: 1,
    family: "soupe",
    technique: "boil",
    baseFamilies: ["carotte", "pomme-terre", "poireau", "navet"],
    fundamentals: ["legumes coupes reguliers", "cuisson 20 min", "mixer ou laisser morceaux"],
    timings: { prep: 10, cook: 20, rest: 0 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Soupe veloutée maison, saveurs naturelles des légumes de saison",
    profTips: [
      "Couper légumes même taille pour cuisson uniforme",
      "Suer oignon 3 min avant ajouter eau",
      "Assaisonner EN FIN, goûter avant servir",
    ],
    mistakes: [
      "Légumes trop gros = cuisson inégale",
      "Trop eau = soupe diluée sans goût",
      "Saler au début = trop salé à la fin (concentration)",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 3, texture: 3, visuel: 2, arome: 3 },
  },
  {
    id: "crepes-garnies",
    name: "Crêpes garnies",
    desireName: "Crêpes fines & moelleuses, garniture gourmande",
    aliases: ["crepes", "crêpes", "galettes"],
    cuisine: "francaise",
    region: "Bretagne",
    slot: "dinner",
    difficulty: 1,
    minChefLevel: 1,
    family: "crepe",
    technique: "sear",
    baseFamilies: ["farine", "oeuf", "lait"],
    fundamentals: ["pate reposee 30 min", "poele chaude huilée", "retourner quand bord dore"],
    timings: { prep: 10, cook: 15, rest: 0 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Crêpes fines et moelleuses, garniture au choix salée ou sucrée",
    profTips: [
      "Pâte lisse sans grumeaux, repos 30 min pour hydratation",
      "Poele chaude + huile fine pour premiere crepe",
      "Retourner quand bords se décollent naturellement",
    ],
    mistakes: [
      "Pâte pas reposée = crêpes cassantes",
      "Feu trop fort = crêpes brûlées dehors, crues dedans",
      "Trop de pâte = crêpes épaisses",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 4, texture: 4, visuel: 3, arome: 3 },
  },
  {
    id: "lentilles-curry",
    name: "Dhal de lentilles",
    desireName: "Dhal onctueux au curcuma doré, naan chaud",
    aliases: ["dhal", "lentilles", "lentilles curry", "dal"],
    cuisine: "indienne",
    region: "Inde",
    slot: "dinner",
    difficulty: 1,
    minChefLevel: 1,
    family: "legumineuse",
    technique: "braise",
    baseFamilies: ["lentilles", "oignon", "ail", "curcuma"],
    fundamentals: ["lentilles rincees", "epices toastees", "mijotage doux"],
    timings: { prep: 5, cook: 20, rest: 0 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Dhal onctueux doré au curcuma, réconfortant et nourrissant",
    profTips: [
      "Rincer lentilles corail jusqu'à eau claire",
      "Toaster curcuma + cumin 30 sec pour arômes",
      "Lentilles corail cuisent en 15-18 min, pas besoin de trempage",
    ],
    mistakes: [
      "Lentilles pas rincées = mousse et amertume",
      "Feu trop fort = accroche au fond",
      "Pas assez d'eau = purée sèche",
    ],
    premiumTier: "classique",
    plaisir: { gourmandise: 4, texture: 4, visuel: 4, arome: 5 },
  },
];

// ============================================
// PLATS IMPRESSIONNANTS / GASTRONOMIQUES
// ============================================
const GASTRONOMIQUES: DishProfile[] = [
  {
    id: "filet-mignon-sauce",
    name: "Filet mignon en croûte",
    desireName: "Filet mignon en croûte dorée, duxelles de champignons",
    aliases: ["filet mignon", "filet mignon en croute", "wellington"],
    cuisine: "francaise",
    region: "Gastronomique",
    slot: "dinner",
    difficulty: 5,
    minChefLevel: 5,
    family: "viande-noble",
    technique: "bake",
    baseFamilies: ["porc", "champignon", "pate-feuilletee", "moutarde"],
    fundamentals: ["saisir avant enrober", "duxelles champignon", "cuisson four precise"],
    timings: { prep: 30, cook: 35, rest: 10 },
    servings: 4,
    portionAdaptation: "moderate",
    signature: "Filet mignon doré en croûte feuilletée, duxelles champignon, rosé à coeur",
    profTips: [
      "Saisir filet sur toutes les faces avant enrobag",
      "Duxelles bien asséchée sinon pâte ramollit",
      "Thermomètre: 58C à coeur pour rosé parfait",
    ],
    mistakes: [
      "Duxelles humide = pâte molle détrempée",
      "Pas saisir avant = viande grise sans saveur",
      "Trop cuire = viande sèche, pas de rosé",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 },
  },
  {
    id: "risotto-champignons",
    name: "Risotto aux champignons",
    desireName: "Risotto crémeux aux champignons, copeaux de parmesan",
    aliases: ["risotto", "risotto champignons", "risotto porcini"],
    cuisine: "italienne",
    region: "Lombardie",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "riz-cremeux",
    technique: "braise",
    baseFamilies: ["riz-arborio", "champignon", "parmesan", "vin-blanc"],
    fundamentals: ["louche par louche", "remuer constamment", "mantecatura finale"],
    timings: { prep: 10, cook: 25, rest: 2 },
    servings: 2,
    portionAdaptation: "moderate",
    signature: "Risotto crémeux al'onda, champignons fondants, parmesan umami",
    profTips: [
      "Ajouter bouillon LOUCHE par louche, attendre absorption",
      "Remuer régulièrement mais pas frénétiquement",
      "Mantecatura: beurre froid + parmesan hors feu pour crémeux",
    ],
    mistakes: [
      "Tout le bouillon en 1 fois = riz bouilli pas crémeux",
      "Pas remuer = riz collé au fond",
      "Oublier mantecatura = risotto sec",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 },
  },
  {
    id: "tartare-boeuf",
    name: "Tartare de boeuf",
    desireName: "Tartare de bœuf au couteau, jaune d\u0027œuf coulant",
    aliases: ["tartare", "tartare boeuf", "steak tartare"],
    cuisine: "francaise",
    region: "Gastronomique",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "viande-crue",
    technique: "raw",
    baseFamilies: ["boeuf", "oeuf", "echalote", "capres"],
    fundamentals: ["viande ultra fraiche", "couteau pas hachoir", "assaisonnement minute"],
    timings: { prep: 15, cook: 0, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Tartare tranché au couteau, assaisonnement vif, jaune d'oeuf coulant",
    profTips: [
      "Viande du jour UNIQUEMENT, demander au boucher",
      "Couper au couteau en brunoise, JAMAIS au hachoir",
      "Assaisonner au dernier moment, servir immédiatement",
    ],
    mistakes: [
      "Viande pas fraîche = danger sanitaire",
      "Hachoir = purée de viande, pas de texture",
      "Assaisonner à l'avance = viande cuit dans acide",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 4 },
  },
  {
    id: "tatin-tarte",
    name: "Tarte tatin",
    desireName: "Tarte tatin caramélisée, pommes fondantes dorées",
    aliases: ["tatin", "tarte tatin", "tarte renversee"],
    cuisine: "francaise",
    region: "Sologne",
    slot: "dessert",
    difficulty: 3,
    minChefLevel: 3,
    family: "tarte-dessert",
    technique: "bake",
    baseFamilies: ["pomme", "beurre", "sucre", "pate-feuilletee"],
    fundamentals: ["caramel blond", "pommes caramelisees avant pate", "retourner chaud"],
    timings: { prep: 20, cook: 35, rest: 5 },
    servings: 6,
    portionAdaptation: "linear",
    signature: "Tarte renversée pommes caramélisées dorées, pâte croustillante",
    profTips: [
      "Caramel blond doré, PAS brun (amer)",
      "Pommes en quartiers serrés car elles réduisent",
      "Retourner sur plat CHAUD immédiatement à la sortie du four",
    ],
    mistakes: [
      "Caramel trop foncé = amer",
      "Pommes pas assez serrées = tarte creuse",
      "Attendre pour retourner = colle au moule",
    ],
    premiumTier: "signature",
    plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 },
  },
];

// ============================================
// PLATS RAPIDES (< 15 min)
// ============================================
const RAPIDES: DishProfile[] = [
  {
    id: "tartine-avocat",
    name: "Tartine avocat-oeuf",
    desireName: "Tartine croquante avocat crémeux & œuf coulant",
    aliases: ["tartine avocat", "avocado toast", "toast avocat"],
    cuisine: "mondiale",
    region: "International",
    slot: "breakfast",
    difficulty: 1,
    minChefLevel: 1,
    family: "tartine",
    technique: "raw",
    baseFamilies: ["avocat", "pain", "oeuf", "citron"],
    fundamentals: ["avocat mur", "pain toaste", "oeuf au choix"],
    timings: { prep: 5, cook: 3, rest: 0 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Tartine croquante, avocat crémeux, oeuf coulant",
    profTips: [
      "Avocat mûr: cède légèrement à la pression",
      "Toaster pain pour contraste croustillant/crémeux",
      "Oeuf poché ou mollet pour effet coulant",
    ],
    mistakes: [
      "Avocat pas mûr = dur et amer",
      "Pain pas toasté = s'imbibe et se ramollit",
      "Écraser trop = purée, garder des morceaux",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 4, texture: 4, visuel: 5, arome: 3 },
  },
  {
    id: "wrap-poulet",
    name: "Wrap poulet crudités",
    desireName: "Wrap croustillant poulet grillé & crudités fraîches",
    aliases: ["wrap", "wrap poulet", "tortilla poulet"],
    cuisine: "mondiale",
    region: "International",
    slot: "lunch",
    difficulty: 1,
    minChefLevel: 1,
    family: "wrap",
    technique: "raw",
    baseFamilies: ["tortilla", "poulet", "salade", "tomate"],
    fundamentals: ["poulet emince", "crudites fraiches", "rouler serre"],
    timings: { prep: 8, cook: 0, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Wrap croustillant, poulet émincé, crudités fraîches croquantes",
    profTips: [
      "Poulet restes de la veille = parfait pour wrap rapide",
      "Essorer salade et crudités pour éviter wrap mouillé",
      "Rouler serré en pliant les côtés d'abord",
    ],
    mistakes: [
      "Crudités mouillées = wrap qui fuit",
      "Trop garnir = impossible à rouler",
      "Tortilla froide = se casse en pliant",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 3, texture: 4, visuel: 3, arome: 3 },
  },
  {
    id: "salade-composee",
    name: "Salade composée complète",
    desireName: "Salade fraîche poulet grillé, vinaigrette citron maison",
    aliases: ["salade", "salade composee", "salade complete"],
    cuisine: "francaise",
    region: "Classique",
    slot: "lunch",
    difficulty: 1,
    minChefLevel: 1,
    family: "salade",
    technique: "raw",
    baseFamilies: ["salade", "oeuf", "tomate", "thon"],
    fundamentals: ["ingredients frais", "vinaigrette a part", "equilibre couleurs"],
    timings: { prep: 10, cook: 0, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Salade colorée complète, fraîche et rassasiante",
    profTips: [
      "Vinaigrette séparée jusqu'au dernier moment",
      "Oeuf dur 9 min exactement pour jaune pas vert",
      "Équilibrer: vert (salade), rouge (tomate), protéine (thon/oeuf)",
    ],
    mistakes: [
      "Vinaigrette trop tôt = salade flétrie",
      "Oeuf trop cuit = jaune verdâtre sec",
      "Ingrédients pas frais = goût plat",
    ],
    premiumTier: "essentiel",
    plaisir: { gourmandise: 3, texture: 3, visuel: 4, arome: 3 },
  },
];

// ============================================
// INDEX PAR CARACTÉRISTIQUES
// ============================================
const ALL_DISHES = [...ANTILLAIS, ...FRANCAISE, ...MONDIAUX, ...PROTEINES, ...BUDGET, ...GASTRONOMIQUES, ...RAPIDES];

export function getDishes(): DishProfile[] {
  return ALL_DISHES;
}

export function getDish(id: string): DishProfile | undefined {
  return ALL_DISHES.find((dish) => dish.id === id);
}

export function findDishesBySlot(slot: DishProfile["slot"]): DishProfile[] {
  return ALL_DISHES.filter((dish) => dish.slot === slot);
}

export function findDishesByFamily(family: string): DishProfile[] {
  return ALL_DISHES.filter((dish) => dish.family === family);
}

export function findDishesByChefLevel(minLevel: number, maxLevel: number = 10): DishProfile[] {
  return ALL_DISHES.filter((dish) => dish.minChefLevel >= minLevel && dish.minChefLevel <= maxLevel);
}

export function findDishesByCuisine(cuisine: string): DishProfile[] {
  return ALL_DISHES.filter((dish) => dish.cuisine === cuisine);
}

export function searchDishes(query: string): DishProfile[] {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALL_DISHES.filter((dish) => {
    const haystack = [
      dish.name,
      ...dish.aliases,
      dish.family,
      dish.cuisine,
      ...(dish.baseIngredients || []),
      ...(dish.baseFamilies || []),
    ]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return haystack.includes(q);
  });
}

/**
 * Matching intelligent par baseIngredients.
 * Si l'utilisateur tape "pâtes fromage", "omelette", "bokit", "colombo"
 * → recherche dans baseIngredients + aliases + name
 * Retourne les plats triés par pertinence (nombre de mots matchés)
 * Bonus antillais: +1 point de pertinence pour plats antillais (sans forcer)
 */
export function matchByIngredients(query: string): DishProfile[] {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const words = norm(query).split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return [];

  const scored = ALL_DISHES.map((dish) => {
    const searchable = [
      dish.name,
      ...dish.aliases,
      ...(dish.baseIngredients || []),
      ...dish.baseFamilies,
      dish.family,
    ].map(norm);

    let score = 0;
    for (const word of words) {
      if (searchable.some((s) => s.includes(word))) score++;
    }
    // Bonus antillais (priorité douce, ne force jamais)
    if (score > 0 && norm(dish.cuisine) === "antillaise") score += 0.5;

    return { dish, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.dish);
}

export function canCookRecipe(dishId: string, chefLevel: number): boolean {
  const dish = getDish(dishId);
  if (!dish) return false;
  return chefLevel >= dish.minChefLevel;
}

export function getDishSignature(dish: DishProfile): string {
  return dish.signature;
}

export function getDishFundamentals(dish: DishProfile): string[] {
  return dish.fundamentals;
}

export function getDishTips(dish: DishProfile): string[] {
  return dish.profTips;
}

export function getDishMistakes(dish: DishProfile): string[] {
  return dish.mistakes;
}
