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
};

export function detectIngredientsFromText(input) {
  if (!input) return [];
  const words = input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const mapped = words.map((word) => INGREDIENT_SYNONYMS[word] || null).filter(Boolean);
  return [...new Set(mapped)];
}

export async function mockScanImage(fileNameOrText) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const detected = detectIngredientsFromText(fileNameOrText);
  return {
    detectedIngredients:
      detected.length > 0
        ? detected
        : ["tomate", "oignon", "ail", "poulet"],
    confidence: 0.89,
  };
}
