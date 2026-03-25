const INGREDIENT_SYNONYMS = {
  jambon: "jambon",
  fromage: "fromage",
  creme: "creme",
  poulet: "poulet",
  poisson: "poisson",
  morue: "morue",
  tomate: "tomate",
  tomates: "tomate",
  oignon: "oignon",
  oignons: "oignon",
  ail: "ail",
  farine: "farine",
  oeuf: "oeuf",
  oeufs: "oeuf",
  pates: "pates",
  pate: "pates",
  feuilletee: "pate feuilletee",
  feuillete: "pate feuilletee",
  riz: "riz",
  haricot: "haricots rouges",
  haricots: "haricots rouges",
  crevette: "crevettes",
  crevettes: "crevettes",
  lait: "lait",
  coco: "lait coco",
  lardons: "lardons",
  citron: "citron",
  citronvert: "citron",
  poissonblanc: "poisson",
  saumon: "saumon",
  thon: "thon",
  boeuf: "boeuf",
  dinde: "dinde",
  epinards: "epinards",
  brocoli: "brocoli",
  courgette: "courgette",
  carotte: "carotte",
  carottes: "carotte",
  pomme: "pomme",
  banane: "banane",
  avocat: "avocat",
  tofu: "tofu",
  lentilles: "lentilles",
  lentille: "lentilles",
  yaourt: "yaourt",
  pain: "pain",
  // Antillais enrichi
  colombo: "colombo",
  bokit: "farine",
  giraumon: "giraumon",
  igname: "igname",
  madere: "madere",
  dachine: "dachine",
  fruit: "fruit a pain",
  christophine: "christophine",
  piment: "piment",
  thym: "thym",
  persil: "persil",
  ciboulette: "ciboulette",
  cive: "cive",
  lambi: "lambi",
  chatrou: "chatrou",
  crabe: "crabe",
  langouste: "langouste",
  oursin: "oursin",
  vivaneau: "poisson",
  marlin: "poisson",
  dorade: "poisson",
  requin: "poisson",
  // Monde
  gingembre: "gingembre",
  curry: "curry",
  paprika: "paprika",
  cumin: "cumin",
  coriandre: "coriandre",
  basilic: "basilic",
  mozzarella: "fromage",
  parmesan: "fromage",
  champignon: "champignon",
  champignons: "champignon",
  poivron: "poivron",
  poivrons: "poivron",
  concombre: "concombre",
  salade: "salade",
  mais: "mais",
  patate: "patate douce",
  pommedeterre: "pomme de terre",
  quinoa: "quinoa",
};

export function detectIngredientsFromText(input) {
  if (!input) return [];
  const normalized = input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized
    .split(/\s+/)
    .filter(Boolean);

  const mapped = words.map((word) => INGREDIENT_SYNONYMS[word] || null).filter(Boolean);
  const phraseMatches = Object.keys(INGREDIENT_SYNONYMS)
    .filter((key) => normalized.includes(key))
    .map((key) => INGREDIENT_SYNONYMS[key]);

  return [...new Set([...mapped, ...phraseMatches])];
}

export async function mockScanImage(fileNameOrText) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const detected = detectIngredientsFromText(fileNameOrText);
  return {
    detectedIngredients:
      detected.length > 0
        ? detected
        : ["oeuf", "fromage", "farine", "tomate"],
    confidence: 0.89,
  };
}
