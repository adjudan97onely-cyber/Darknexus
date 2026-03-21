import { getIngredientProfile, normalize, type CookingMethod, type MealSlot, type ProteinFamily } from "./foodRules.ts";

export type DesiredResult = "leger" | "croustillant" | "fondant" | "juteux";
export type TechniqueKey = "mariner" | "saisir" | "mijoter" | "griller" | "rotir" | "vapeur" | "deglacer";

export interface TechniqueContext {
  cuisine: string;
  slot: MealSlot;
  blueprintFamily: string;
  ingredients: string[];
  primaryProtein?: string;
  proteinFamily: ProteinFamily;
  cookingMethod: CookingMethod;
  desiredResult: DesiredResult;
}

export interface TechniquePlan {
  key: TechniqueKey;
  label: string;
  reason: string;
}

interface TechniqueDefinition {
  key: TechniqueKey;
  label: string;
  applies: (context: TechniqueContext) => boolean;
  reason: (context: TechniqueContext) => string;
}

const TECHNIQUES: TechniqueDefinition[] = [
  {
    key: "mariner",
    label: "mariner",
    applies: (context) => ["fish", "seafood", "poultry"].includes(context.proteinFamily) || context.cuisine === "antillaise",
    reason: (context) => `utile pour assaisonner ${context.primaryProtein || "la proteine"} en amont et fixer les aromes`,
  },
  {
    key: "saisir",
    label: "saisir",
    applies: (context) => ["saute", "stirfry", "grill"].includes(context.cookingMethod) || context.desiredResult === "croustillant",
    reason: () => "apporte coloration et relief aromatique sans surcuire l'interieur",
  },
  {
    key: "mijoter",
    label: "mijoter",
    applies: (context) => ["broth", "boil"].includes(context.cookingMethod) || context.desiredResult === "fondant",
    reason: () => "donne une texture fondante et des saveurs plus liees",
  },
  {
    key: "griller",
    label: "griller",
    applies: (context) => context.cookingMethod === "grill" || context.desiredResult === "croustillant",
    reason: () => "cree une note torrefiee et une surface plus appetissante",
  },
  {
    key: "rotir",
    label: "rotir",
    applies: (context) => context.cookingMethod === "bake" && ["poultry", "meat", "vegetarian"].includes(context.proteinFamily),
    reason: () => "concentre les sucs et donne une finition de four plus nette",
  },
  {
    key: "vapeur",
    label: "cuire vapeur",
    applies: (context) => context.cookingMethod === "boil" && (context.slot === "dinner" || context.desiredResult === "leger"),
    reason: () => "garde le produit leger et respecte les textures fragiles",
  },
  {
    key: "deglacer",
    label: "deglacer",
    applies: (context) => ["saute", "stirfry"].includes(context.cookingMethod) && context.ingredients.some((item) => ["citron", "tomate", "oignon"].includes(normalize(item))),
    reason: () => "recupere les sucs et construit une sauce courte plus professionnelle",
  },
];

function dedupeTechniques(plans: TechniquePlan[]): TechniquePlan[] {
  return plans.filter((plan, index, all) => all.findIndex((item) => item.key === plan.key) === index);
}

export function inferDesiredResult(slot: MealSlot, blueprintFamily: string, proteinFamily: ProteinFamily): DesiredResult {
  if (slot === "dinner") return "leger";
  if (blueprintFamily === "soupe" || blueprintFamily === "blaff") return "fondant";
  if (proteinFamily === "fish" || proteinFamily === "seafood") return "juteux";
  if (["poelee", "quiche"].includes(blueprintFamily)) return "croustillant";
  return "fondant";
}

export function chooseCookingMethod(blueprintMethod: CookingMethod, proteinFamily: ProteinFamily, slot: MealSlot, blueprintFamily: string): CookingMethod {
  if (blueprintFamily === "bowl" && slot === "dinner") return "steam" as unknown as CookingMethod;
  if (slot === "dinner" && ["fish", "seafood"].includes(proteinFamily)) return "broth";
  if (slot === "lunch" && proteinFamily === "poultry") return blueprintMethod === "boil" ? "grill" : blueprintMethod;
  return blueprintMethod;
}

export function planCookingTechniques(context: TechniqueContext): TechniquePlan[] {
  const selected = TECHNIQUES
    .filter((technique) => technique.applies(context))
    .map((technique) => ({
      key: technique.key,
      label: technique.label,
      reason: technique.reason(context),
    }));

  const fallback: TechniquePlan[] = context.cookingMethod === "bake"
    ? [{ key: "rotir", label: "rotir", reason: "convient au four et garde une cuisson reguliere" }]
    : context.cookingMethod === "broth"
      ? [{ key: "mijoter", label: "mijoter", reason: "convient a une cuisson douce en liquide" }]
      : [{ key: "saisir", label: "saisir", reason: "creer une base aromatique nette" }];

  return dedupeTechniques([...(selected.length ? selected : fallback)]).slice(0, 4);
}

function findFirst(ingredients: string[], predicate: (name: string) => boolean): string | undefined {
  return ingredients.find((item) => predicate(normalize(item)));
}

export function buildTechniqueDrivenSteps(context: TechniqueContext): string[] {
  const protein = context.primaryProtein || findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("protein")) || "la proteine";
  const aromatic = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("aromatic")) || "l'oignon";
  const secondAromatic = findFirst(context.ingredients.filter((item) => normalize(item) !== normalize(aromatic)), (name) => getIngredientProfile(name).roles.includes("aromatic"));
  const vegetables = context.ingredients.filter((item) => getIngredientProfile(item).roles.includes("vegetable")).slice(0, 2);
  const acid = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("acid")) || "citron";
  const sauce = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("sauce"));
  const base = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("base"));

  const steps: string[] = [];
  const plans = planCookingTechniques(context);

  if (plans.some((item) => item.key === "mariner")) {
    steps.push(`Assaisonner ${protein} avec sel, poivre${acid ? ` et ${acid}` : ""}, puis laisser mariner 10 minutes pour imprimer les saveurs.`);
  }

  steps.push(`Faire revenir ${aromatic}${secondAromatic ? ` et ${secondAromatic}` : ""} a feu moyen 2 a 3 minutes, juste assez pour les attendrir sans coloration excessive.`);

  if (plans.some((item) => item.key === "saisir")) {
    steps.push(`Ajouter ${protein} et saisir 3 a 5 minutes jusqu'a une belle coloration, en gardant le coeur juteux.`);
  }

  if (plans.some((item) => item.key === "deglacer")) {
    steps.push(`Deglacer avec ${acid || "un trait de citron"} pour recuperer les sucs et construire une sauce courte.`);
  }

  if (vegetables.length) {
    steps.push(`Incorporer ${vegetables.join(" et ")} progressivement pour conserver un contraste entre fondant et croquant.`);
  }

  if (plans.some((item) => item.key === "mijoter")) {
    steps.push(`Baisser le feu puis laisser mijoter 8 a 15 minutes afin de lier les saveurs et obtenir une texture ${context.desiredResult}.`);
  } else if (plans.some((item) => item.key === "rotir")) {
    steps.push(`Transferer dans un four chaud et rotir jusqu'a cuisson reguliere, avec une surface doree mais non sechee.`);
  } else if (plans.some((item) => item.key === "griller")) {
    steps.push(`Finir par une cuisson grillee courte pour apporter une note torrefiee et une texture plus appetissante.`);
  } else if (plans.some((item) => item.key === "vapeur")) {
    steps.push(`Cuire a la vapeur douce pour garder une sensation legere et une tenue propre des ingredients fragiles.`);
  }

  if (base) {
    steps.push(`Cuire ${base} separement puis assembler au dernier moment pour garder la structure du plat.`);
  }

  if (sauce) {
    steps.push(`Ajuster la liaison avec ${sauce} en petite quantite, juste pour napper sans alourdir.`);
  }

  steps.push("Gouter, corriger l'assaisonnement, puis dresser proprement avec une finition fraiche avant service.");
  return steps;
}
