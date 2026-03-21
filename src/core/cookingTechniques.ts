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
  const bakeryFamily = ["brioche", "gateau", "viennoiserie"].includes(context.blueprintFamily);
  if (bakeryFamily) {
    return [
      "Sortir le materiel: un saladier, un fouet, une balance/verre doseur, un moule et du papier cuisson. Prechauffer le four a 180C pendant 10 minutes.",
      "Peser tous les ingredients avant de commencer, puis les poser dans l'ordre d'utilisation pour ne rien oublier.",
      "Melanger d'abord les ingredients secs (farine, sucre, levure) pour repartir la levure uniformement.",
      "Ajouter ensuite les ingredients humides (lait, oeuf, beurre fondu) et fouetter doucement jusqu'a obtenir une pate lisse sans gros grumeaux.",
      "Verser la pate dans le moule, lisser le dessus avec une cuillere et tapoter legerement le moule sur le plan de travail pour enlever les bulles.",
      "Enfourner au milieu du four. Ne pas ouvrir la porte avant 15 minutes pour eviter que la pate retombe.",
      "Verifier la cuisson: planter la pointe d'un couteau au centre. Si elle ressort seche, c'est cuit; sinon prolonger 3 a 5 minutes.",
      "Laisser tiedir 10 minutes hors du four avant de demouler pour eviter de casser la preparation.",
    ];
  }

  const protein = context.primaryProtein || findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("protein")) || "la proteine";
  const aromatic = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("aromatic")) || "l'oignon";
  const secondAromatic = findFirst(context.ingredients.filter((item) => normalize(item) !== normalize(aromatic)), (name) => getIngredientProfile(name).roles.includes("aromatic"));
  const vegetables = context.ingredients.filter((item) => getIngredientProfile(item).roles.includes("vegetable")).slice(0, 2);
  const acid = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("acid")) || "citron";
  const sauce = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("sauce"));
  const base = findFirst(context.ingredients, (name) => getIngredientProfile(name).roles.includes("base"));

  const steps: string[] = [];
  const plans = planCookingTechniques(context);

  steps.push("Sortir une planche, un couteau, une poele/casserole et une spatule. Preparer tous les ingredients devant toi avant d'allumer le feu.");

  if (plans.some((item) => item.key === "mariner")) {
    steps.push(`Mettre ${protein} dans un bol avec sel, poivre${acid ? ` et ${acid}` : ""}. Melanger puis laisser 10 minutes au repos.`);
  }

  steps.push(`Faire chauffer la poele a feu moyen, ajouter un filet d'huile puis ${aromatic}${secondAromatic ? ` et ${secondAromatic}` : ""}. Cuire 2 a 3 minutes jusqu'a ce que ca devienne brillant et tendre.`);

  if (plans.some((item) => item.key === "saisir")) {
    steps.push(`Ajouter ${protein} et cuire 3 a 5 minutes sans trop remuer au debut. Repere debutant: quand la surface devient doree, tu peux retourner.`);
  }

  if (plans.some((item) => item.key === "deglacer")) {
    steps.push(`Ajouter ${acid || "un trait de citron"} hors feu 10 secondes puis remettre sur feu doux pour recuperer les sucs colles au fond.`);
  }

  if (vegetables.length) {
    steps.push(`Ajouter ${vegetables.join(" et ")} en dernier. Cuire doucement pour garder des legumes tendres mais encore legerement fermes.`);
  }

  if (plans.some((item) => item.key === "mijoter")) {
    steps.push(`Baisser le feu et couvrir partiellement. Laisser mijoter 8 a 15 minutes. Repere debutant: de petites bulles regulieres, pas une grosse ebullition.`);
  } else if (plans.some((item) => item.key === "rotir")) {
    steps.push(`Transferer dans un four deja chaud et cuire jusqu'a surface doree. Si ca colore trop vite, couvrir legerement avec une feuille de cuisson.`);
  } else if (plans.some((item) => item.key === "griller")) {
    steps.push("Finir par une cuisson grillee courte 1 a 2 minutes. Surveiller en continu pour eviter de bruler.");
  } else if (plans.some((item) => item.key === "vapeur")) {
    steps.push("Cuire a la vapeur douce jusqu'a texture tendre. Ne pas trop cuire pour garder de la tenue.");
  }

  if (base) {
    steps.push(`Cuire ${base} a part selon le paquet/recette, puis assembler a la fin pour eviter que tout se transforme en bouillie.`);
  }

  if (sauce) {
    steps.push(`Ajouter ${sauce} petit a petit en melangeant. Arreter des que la sauce enrobe juste les ingredients.`);
  }

  steps.push("Gouter une cuillere: ajuster sel/poivre si besoin. Si le poulet est utilise, verifier qu'il n'est plus rose au centre avant de servir.");
  steps.push("Servir chaud. Si c'est trop sec, ajouter 1 a 2 cuilleres d'eau chaude et melanger 30 secondes sur feu doux.");
  return steps;
}
