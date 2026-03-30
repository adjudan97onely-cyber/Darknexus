const INGREDIENT_SYNONYMS = {
  jambon: "jambon",
  fromage: "fromage",
  creme: "creme",
  poulet: "poulet",
  poisson: "poisson",
  morue: "morue",
  tomate: "tomate",
  oignon: "oignon",
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
  citron: "citron vert",
  lait: "lait coco",
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
  pomme: "pomme",
  banane: "banane",
  avocat: "avocat",
  tofu: "tofu",
  lentilles: "lentilles",
  yaourt: "yaourt",
  pain: "pain",
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
