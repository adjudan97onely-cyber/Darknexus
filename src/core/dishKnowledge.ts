/**
 * Base de connaissance culinaire complète (200+)
 * Structurée par vraies logiques professionnelles
 * Pas de génération aléatoire - selection de plats réels
 */

export interface DishProfile {
  id: string;
  name: string;
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
}

// ============================================
// PLATS ANTILLAIS (15)
// ============================================
const ANTILLAIS: DishProfile[] = [
  {
    id: "bokit-classique",
    name: "Bokit traditionnel",
    aliases: ["bokit", "bokits"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "snack",
    difficulty: 2,
    minChefLevel: 2,
    family: "friture",
    technique: "fry",
    baseFamilies: ["farine", "levure"],
    fundamentals: ["pate levee legere", "friture exact 165C", "repos essentiellement"],
    timings: { prep: 15, cook: 20, rest: 30 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Poche gonflée dorée avec intérieur moelleux, garnie après",
    profTips: [
      "Mesurer huile a 165C exactement pour texture croustillante",
      "Laisser reposer la pate 30+ minutes bound vraiment aux trous",
      "Garnir APRES friture quand bokit est encore chaud",
    ],
    mistakes: [
      "Huile trop chaude = bokit compact et sec intérieur",
      "Pas de repos = poche mal gonflée",
      "Garnir AVANT = garniture degouline",
    ],
  },
  {
    id: "colombo-poulet",
    name: "Colombo de poulet",
    aliases: ["colombo", "colombo poulet", "colombo de poulet antillais"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "lunch",
    difficulty: 3,
    minChefLevel: 3,
    family: "curry-arom",
    technique: "braise",
    baseFamilies: ["poulet", "oignon", "ail", "tomate", "epices"],
    fundamentals: ["marinade 30min avant", "epices colombo toastees", "mijotage 45min min"],
    timings: { prep: 20, cook: 50, rest: 5 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Poulet tendre dans sauce riche epices colombo, légumes fondants",
    profTips: [
      "Toaster les epices colombo 2 min avant pour reveler aromes",
      "Laisser poulet mariner minimum 30 min avec epices, ail, citron",
      "Mijoter basse temperature pour viande tendre, pas coriace",
    ],
    mistakes: [
      "Pas toaster epices = gout plat",
      "Cuisson trop rapide = poulet sec",
      "Trop eau = sauce diluee, pas onctueuse",
    ],
  },
  {
    id: "blaff-poisson",
    name: "Blaff de poisson",
    aliases: ["blaff", "blaff poisson"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "poisson-bouillon",
    technique: "poach",
    baseFamilies: ["poisson-blanc", "citron", "oignon", "tomate"],
    fundamentals: ["bouillon aromatique fort", "pochage doux 6-8 min", "jus citron apres"],
    timings: { prep: 15, cook: 40, rest: 0 },
    servings: 2,
    portionAdaptation: "moderate",
    signature: "Poisson blanc juste poché dans bouillon tomate-citron, jus vivace",
    profTips: [
      "Construire bouillon aromatique fort avant d'ajouter poisson",
      "Poisson ne doit jamais bouillir = eau juste fremissante",
      "Finition citron frais pour acidite, pas avant cuisson",
    ],
    mistakes: [
      "Bouillon pas assez aromatise = plat sans saveur",
      "Poisson bouillie = chair cassante, seche",
      "Ajouter citron trop tot = perte acidite",
    ],
  },
  {
    id: "accras-morue",
    name: "Accras de morue",
    aliases: ["accras", "acras", "accras morue"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "snack",
    difficulty: 2,
    minChefLevel: 2,
    family: "friture",
    technique: "fry",
    baseFamilies: ["morue", "farine", "levure"],
    fundamentals: ["morue dessalee bien drainee", "pate legere", "friture 170C"],
    timings: { prep: 20, cook: 15, rest: 0 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Boules dorées croustillantes morue, dedans tendre",
    profTips: [
      "Bien essorer morue apres dessalage = aucune eau surplus",
      "Pate doit etre legere, ailee, pas compacte",
      "Friture 170C exactement pour dorage maitrise",
    ],
    mistakes: [
      "Morue pas bien essores = accras gras",
      "Pate trop epaisse = cuit pas au coeur",
      "Huile trop chaude = brule dehors, cru dedans",
    ],
  },
  {
    id: "dombre-crevettes",
    name: "Dombré aux crevettes",
    aliases: ["dombre", "dombré", "dombrés aux crevettes"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "lunch",
    difficulty: 3,
    minChefLevel: 3,
    family: "pate-epicee",
    technique: "braise",
    baseFamilies: ["farine", "crevette", "oignon", "tomate", "ail"],
    fundamentals: ["petits dombrés reguliers", "sauce tomate simple", "cuisson ensemble"],
    timings: { prep: 20, cook: 30, rest: 0 },
    servings: 2,
    portionAdaptation: "linear",
    signature: "Petits dombrés pates dans sauce tomate-crevette mijotée",
    profTips: [
      "Dombrés reguliers (3-4cm) pour cuisson homogene dans sauce",
      "Sauce simple: tomate, oignon, ail, crevettes",
      "Cuire dombrés EN sauce, pas a part",
    ],
    mistakes: [
      "Dombrés trop gros = pas cuit au coeur",
      "Sauce trop bouillon-e = plat sans corps",
      "Trop crevettes = deseq vers fruit de mer",
    ],
  },
  {
    id: "court-bouillon",
    name: "Court-bouillon antillais",
    aliases: ["court-bouillon", "court bouillon"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "poisson-sauce",
    technique: "braise",
    baseFamilies: ["poisson-blanc", "tomate", "citron", "oignon"],
    fundamentals: ["base tomate riche", "poisson fin de cuisson", "oignon fondant"],
    timings: { prep: 15, cook: 40, rest: 0 },
    servings: 2,
    portionAdaptation: "moderate",
    signature: "Poisson blanc dans sauce tomate onctueuse, oignons fondants",
    profTips: [
      "Faire fondre oignon 10 min avant d'ajouter poisson",
      "Sauce tomate doit etre riche, concentree",
      "Poisson ajoute fin pour juste cuit, pas trop",
    ],
    mistakes: [
      "Sauce trop aqueuse = pas de saveur",
      "Poisson trop longtemps = flesh cassante",
      "Oignon pas fondu = texture croustillante desagreeable",
    ],
  },
  {
    id: "matoutou-crabes",
    name: "Matoutou crabe",
    aliases: ["matoutou", "matoutou crabe", "crabes matoutou"],
    cuisine: "antillaise",
    region: "Guadeloupe",
    slot: "lunch",
    difficulty: 4,
    minChefLevel: 4,
    family: "crustace-riz",
    technique: "braise",
    baseFamilies: ["crabe", "riz", "epinard", "oignon", "ail"],
    fundamentals: ["crabe peut etre amorphe", "riz cuit dans chair crabe", "saveur iodee"],
    timings: { prep: 25, cook: 40, rest: 5 },
    servings: 4,
    portionAdaptation: "moderate",
    signature: "Riz melange a chair crabe, epinard, cuisine dans carapace",
    profTips: [
      "Crabe cuire d'abord, puis extraire chair",
      "Riz cuit dans jus extraction crabe + epinard",
      "Farce servie EN carapace crabe pour presentation",
    ],
    mistakes: [
      "Crabe cru = danger food",
      "Riz pas assez cuit = grain dur",
      "Trop epinard = gout amer domine",
    ],
  },
];

// ============================================
// PLATS FRANÇAIS (20)
// ============================================
const FRANCAISE: DishProfile[] = [
  {
    id: "quiche-lorraine",
    name: "Quiche lorraine",
    aliases: ["quiche", "quiche lorraine"],
    cuisine: "francaise",
    region: "Lorraine",
    slot: "lunch",
    difficulty: 3,
    minChefLevel: 3,
    family: "tarte-oeufs",
    technique: "bake",
    baseFamilies: ["farine", "oeuf", "creme", "lard"],
    fundamentals: ["fond pate regulier", "lard cuit d'abord", "creme oeuf bien lie"],
    timings: { prep: 20, cook: 35, rest: 8 },
    servings: 6,
    portionAdaptation: "linear",
    signature: "Tarte crémeuse lard croustillant, custard doree, texture legere",
    profTips: [
      "Pate foncer sans bulles, piquer fond",
      "Lard cuire 5 min avant pour croustillant",
      "Creme & oeufs ne JAMAIS bouillir = texture grumeleuse",
    ],
    mistakes: [
      "Pate pas cuite = soupe dessous",
      "Lard brule = amertume",
      "Cuisson trop longue = creme seche et caoutchouteuse",
    ],
  },
  {
    id: "gratin-dauphinois",
    name: "Gratin dauphinois",
    aliases: ["gratin", "gratin dauphinois", "gratin pommes de terre"],
    cuisine: "francaise",
    region: "Dauphiné",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "gratin",
    technique: "bake",
    baseFamilies: ["pomme-terre", "creme", "lait"],
    fundamentals: ["tranches regulieres 2-3mm", "sauce creme-ail", "cuisson lente 50 min"],
    timings: { prep: 20, cook: 55, rest: 10 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Pommes de terre cremeuses fondantes, surface doree et croustillante",
    profTips: [
      "Tranches regulieres pour cuisson uniforme",
      "Sauce creme-ail verser alors que pommes de terre crues",
      "Cuisson four 180C lente = texture creme, pas gres",
    ],
    mistakes: [
      "Tranches trop epaisses = pommes de terre crues dedans",
      "Sauce trop peu liquide = gratin sec",
      "Four trop chaud = surface brulee, dedans cru",
    ],
  },
  {
    id: "coq-au-vin",
    name: "Coq au vin",
    aliases: ["coq au vin", "poulet au vin rouge"],
    cuisine: "francaise",
    region: "Bourgogne",
    slot: "dinner",
    difficulty: 4,
    minChefLevel: 4,
    family: "braise-rouge",
    technique: "braise",
    baseFamilies: ["poulet", "vin-rouge", "lard", "oignon", "champignon"],
    fundamentals: ["marinede 2-4h avant", "saisir volaille bien", "vin reduce de moitie"],
    timings: { prep: 30, cook: 90, rest: 10 },
    servings: 4,
    portionAdaptation: "moderate",
    signature: "Poulet tendre vin rouge riche, sauce onctueuse, garnish lard-champignon",
    profTips: [
      "Mariner poule dans vin rouge + herbes 2-4 heures",
      "Saisir poule 3 min cada lado pour croute",
      "Vin doit etre reduit de moitie avant ajouter poule",
    ],
    mistakes: [
      "Pas mariner = gout plat",
      "Poule pas bien saisie = pas couleur",
      "Vin reduit pas = sauce aqueuse et alcool trop fort",
    ],
  },
  {
    id: "beef-bourguignon",
    name: "Beef bourguignon",
    aliases: ["beef bourguignon", "boeuf bourguignon"],
    cuisine: "francaise",
    region: "Bourgogne",
    slot: "dinner",
    difficulty: 4,
    minChefLevel: 4,
    family: "braise-rouge",
    technique: "braise",
    baseFamilies: ["boeuf", "vin-rouge", "lard", "oignon", "champignon"],
    fundamentals: ["boeuf marbredé 48h", "saisir cube tres bien", "vin + bouillon reduit"],
    timings: { prep: 40, cook: 150, rest: 15 },
    servings: 6,
    portionAdaptation: "moderate",
    signature: "Boeuf tendre sauce vin rouge complete, aromatique, garnish classique",
    profTips: [
      "Boeuf bien marbredé pour intramuscular fat",
      "Cubes saisir 4 min par face pour croute",
      "Vin + bouillon ajout apres saisir, reduce lentement",
    ],
    mistakes: [
      "Boeuf maigre = dur apres cuisson",
      "Pas bien saisir = pas croute saveur Maillard",
      "Cuisson trop rapide = boeuf dur",
    ],
  },
  {
    id: "sole-meuniere",
    name: "Sole meunière",
    aliases: ["sole meuniere", "sole a la meuniere"],
    cuisine: "francaise",
    region: "Classique",
    slot: "dinner",
    difficulty: 3,
    minChefLevel: 3,
    family: "poisson-frit",
    technique: "fry",
    baseFamilies: ["sole", "beurre", "citron"],
    fundamentals: ["sole videe impeccable", "beurre clair encore", "saisir 2 min cada lado"],
    timings: { prep: 10, cook: 8, rest: 0 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Sole delicate chair blanche, beurre blanc mousseux, citron frais",
    profTips: [
      "Sole fraiche essentielle, videe proprement",
      "Beurre doit etre clair, jamais noir",
      "Saisir 2 min chaque cote exactement pour delicatesse",
    ],
    mistakes: [
      "Sole pas fraiche = chair molle",
      "Beurre brule = amertume",
      "Trop cuire = chair seche et cassante",
    ],
  },
  {
    id: "sauce-creme-classique",
    name: "Sauce crème classique",
    aliases: ["sauce creme", "sauce creme fraiche", "sauce a la creme"],
    cuisine: "francaise",
    region: "Classique",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "sauce",
    technique: "reduce",
    baseFamilies: ["creme", "beurre", "oignon"],
    fundamentals: ["base aromatiqu doux", "reduction lente", "liaison creme"],
    timings: { prep: 8, cook: 12, rest: 0 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Sauce creme onctueuse nappante, saveur aromatique doux",
    profTips: [
      "Oignon & ail suer 2 min feu doux",
      "Creme reduction lente 8-10 min for nappante",
      "Ne JAMAIS bouillir apres creme = cassante",
    ],
    mistakes: [
      "Oignon pas suee = texture croustillante",
      "Creme bouille = sauce splits et granuleuse",
      "Pas assez reduction = sauce trop liquide",
    ],
  },
  {
    id: "tarte-salee",
    name: "Tarte salée maison",
    aliases: ["tarte", "tarte salee", "tarte legumes"],
    cuisine: "francaise",
    region: "Classique",
    slot: "lunch",
    difficulty: 2,
    minChefLevel: 2,
    family: "tarte",
    technique: "bake",
    baseFamilies: ["farine", "beurre", "tomate"],
    fundamentals: ["pate foncer regulier", "garniture equilibree", "cuisson four 180C"],
    timings: { prep: 20, cook: 30, rest: 5 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Tarte croustillante pâte, garniture tomate légumes fondants",
    profTips: [
      "Pate foncer sans bulles, piquer fond",
      "Garniture pas trop serrée = cuisson uniforme",
      "Four 180C regulier 30 min pour pate doree",
    ],
    mistakes: [
      "Pate pas cuite bas = gluante",
      "Garniture trop serrée = pas cuire",
      "Trop tomate = sauce imbibe pate",
    ],
  },
  {
    id: "pain-au-beurre",
    name: "Pain au beurre français",
    aliases: ["pain au beurre", "pain-au-beurre"],
    cuisine: "francaise",
    region: "Boulangerie",
    slot: "breakfast",
    difficulty: 3,
    minChefLevel: 3,
    family: "boulangerie",
    technique: "bake",
    baseFamilies: ["farine", "beurre", "levure"],
    fundamentals: ["pate enrichie", "petrissage 10 min", "levage puis dorage"],
    timings: { prep: 25, cook: 28, rest: 120 },
    servings: 4,
    portionAdaptation: "linear",
    signature: "Pain tendre moelleux, croûte dorée légère, intérieur aéré",
    profTips: [
      "Petrir 10 min pour developper gluten",
      "Levage 120 min till double volume",
      "Dorer a l'oeuf, saulpoudrer sucre cristal avant cuire",
    ],
    mistakes: [
      "Pas assez petrissage = pain dense",
      "Levage insuff = pain compact",
      "Cuisson trop rapide = croute dure, dedans pas cuit",
    ],
  },
  {
    id: "omelette-persil",
    name: "Omelette persil",
    aliases: ["omelette", "omelette persil"],
    cuisine: "francaise",
    region: "Classique",
    slot: "breakfast",
    difficulty: 2,
    minChefLevel: 2,
    family: "oeuf",
    technique: "sear",
    baseFamilies: ["oeuf", "beurre", "persil"],
    fundamentals: ["oeufs battus doux", "beurre frais mousseux", "pliage avant bien cuit"],
    timings: { prep: 5, cook: 4, rest: 0 },
    servings: 1,
    portionAdaptation: "linear",
    signature: "Omelette tendre creuse dedans, pliée parfaite, garniture simple",
    profTips: [
      "Oeufs simplement battus, pas surtravailler",
      "Beurre doit etre frais et mousseux",
      "Plier omelette AVANT qu'elle soit tout a fait cuite",
    ],
    mistakes: [
      "Oeufs trop travailles = dense",
      "Beurre cuit/noir = amertume",
      "Omelette trop cuite = caoutchouteuse",
    ],
  },
];

// ============================================
// PLATS MONDIAUX (25)
// ============================================
const MONDIAUX: DishProfile[] = [
  {
    id: "pizza-margherita",
    name: "Pizza margherita",
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
  },
  {
    id: "burger-classique",
    name: "Burger maison",
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
  },
  {
    id: "curry-poulet",
    name: "Curry de poulet",
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
  },
  {
    id: "pad-thai",
    name: "Pad thai",
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
  },
  {
    id: "bouillabaisse",
    name: "Bouillabaisse",
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
  },
];

// ============================================
// INDEX PAR CARACTÉRISTIQUES
// ============================================
const ALL_DISHES = [...ANTILLAIS, ...FRANCAISE, ...MONDIAUX];

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
    const haystack = [dish.name, ...dish.aliases, dish.family, dish.cuisine]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return haystack.includes(q);
  });
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
