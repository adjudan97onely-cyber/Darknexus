/**
 * Techniques culinaires professionnelles
 * Adaptées par niveau & portions
 */

import { ChefLevel, getLevelCapabilities } from "./chefLevel";

export type CookingTechnique =
  | "boil"
  | "mix"
  | "bake"
  | "fry"
  | "simmer"
  | "sear"
  | "poach"
  | "braise"
  | "glaze"
  | "reduce"
  | "emulsify"
  | "deglaze"
  | "temper"
  | "sous-vide"
  | "smoke"
  | "clarify"
  | "julienne"
  | "carpaccio"
  | "terrine"
  | "sphere"
  | "consomme"
  | "ballottine"
  | "pate"
  | "foamage"
  | "gel-making"
  | "fermentation"
  | "meat-aging"
  | "sous-pression"
  | "cryogenic"
  | "demi-glace-mastery"
  | "flavor-archaeology";

export interface TechniqueSpec {
  name: string;
  description: string;
  temperature?: {
    low: number;
    high: number;
    unit: "C" | "F";
  };
  timing: {
    base: number; // En minutes pour 2 portions
    scalingType: "linear" | "logarithmic" | "complex";
  };
  heatLevel: "low" | "medium" | "high" | "very-high";
  equipment: string[];
  profTips: Record<string, string>; // Par niveau
  risks: Record<string, string>; // Par niveau
  result: string;
}

export const TECHNIQUE_SPECS: Record<CookingTechnique, TechniqueSpec> = {
  // ============ BASIQUE ============
  boil: {
    name: "Bouillir",
    description: "Cuire dans eau bouillante, éléments submergés",
    temperature: { low: 95, high: 100, unit: "C" },
    timing: { base: 15, scalingType: "linear" },
    heatLevel: "high",
    equipment: ["grande casserole", "couvert", "cuillere"],
    profTips: {
      "1": "Mettre eau bouillir avant ajouter aliments",
      "5": "Eau doit etre salée (10g/L) pour assaisonnement interne",
      "10": "Maintenir frémissement régulier, pas rolling boil pour délicats",
    },
    risks: {
      "1": "Aliments trop cuit, mou",
      "5": "Pas assez d'eau = temperature chute",
      "10": "Perte saveur par bullition violente",
    },
    result: "Éléments cuits uniformément, texture fondante",
  },

  sear: {
    name: "Saisir",
    description: "Cuire surface très haute température pour croûte",
    temperature: { low: 160, high: 200, unit: "C" },
    timing: { base: 4, scalingType: "linear" },
    heatLevel: "very-high",
    equipment: ["poele/plancha", "huile", "pinces"],
    profTips: {
      "2": "Poêle bien chaud avant ajouter aliment",
      "5": "Ne pas bouger = croûte se forme",
      "10": "Technique Maillard: surtout SURFACE réaction, pas cuire",
    },
    risks: {
      "2": "Poêle pas chaud = plat poché au lieu saisir",
      "5": "Trop longtemps = dedans trop cuit",
      "10": "Température insuffisante = pas réaction Maillard",
    },
    result: "Croûte dorée saveur Maillard, dedans rosé/tendre",
  },

  simmer: {
    name: "Mijoter",
    description: "Cuire doux, petites bulles régulières",
    temperature: { low: 80, high: 95, unit: "C" },
    timing: { base: 30, scalingType: "complex" },
    heatLevel: "medium",
    equipment: ["casserole", "couvert", "thermometre"],
    profTips: {
      "3": "Bulles régulières, jamais groupées",
      "5": "Couvrir partiellement pour reduction progressive",
      "10": "Contrôle température exacte: 85C pour délicats, 90C robustes",
    },
    risks: {
      "3": "Trop chaud = ébullition, éléments se cassent",
      "5": "Pas assez couvert = pas reduction saveur",
      "10": "Variable temperature = cuisson inégale",
    },
    result: "Sauce réduite onctueuse, éléments tendre fondant",
  },

  // ============ INTERMÉDIAIRE ============
  poach: {
    name: "Pocher",
    description: "Cuire doux eau/bouillon, surface à peine bougeant",
    temperature: { low: 65, high: 75, unit: "C" },
    timing: { base: 12, scalingType: "linear" },
    heatLevel: "low",
    equipment: ["casserole", "thermometre", "ecumoire"],
    profTips: {
      "3": "Eau juste qui frémit, pas une seule bulle",
      "5": "Ajouter aliment quand eau atteint bonne temperature",
      "10": "Thermometre crucial: 70C exactement pour chair tendre",
    },
    risks: {
      "3": "Trop chaud = chair résineuse fibreuse",
      "5": "Eau changeable temperatura = texture inégale",
      "10": "Minute de trop = chair se dissocie",
    },
    result: "Chair tendre gélatineuse, saveur complète maintenue",
  },

  braise: {
    name: "Braiser",
    description: "Saisir puis cuire lent en sauce couverte",
    temperature: { low: 150, high: 180, unit: "C" },
    timing: { base: 90, scalingType: "logarithmic" },
    heatLevel: "medium",
    equipment: ["cocotte", "couvert", "thermometre four"],
    profTips: {
      "3": "Saisir bien 3-4 min avant ajouter sauce",
      "5": "Liquide couvre demi-aliment, pas tout submergé",
      "10": "Brasage: four 160C régulier plutôt cooktop variable",
    },
    risks: {
      "3": "Pas saisir = plat sans profondeur saveur",
      "5": "Trop liquide = saveur diluée",
      "10": "Temperature four trop haute = viande sèche surface",
    },
    result: "Viande tendre, sauce riche onctueuse concentrée",
  },

  reduce: {
    name: "Réduire",
    description: "Diminuer volume par évaporation, concentrer saveur",
    temperature: { low: 90, high: 100, unit: "C" },
    timing: { base: 15, scalingType: "complex" },
    heatLevel: "high",
    equipment: ["casserole", "cuillere", "thermometre"],
    profTips: {
      "3": "Entamer reduction dès sauce equilibrée température",
      "5": "Régulier stir pour reduction uniforme",
      "10": "Technique coating: sauce qui coûte cuillere = bon point",
    },
    risks: {
      "3": "Trop rapide = saveur concentré mais amer",
      "5": "Pas assez reduction = trop liquide",
      "10": "Trop reduction = sauce épaisse crystallise",
    },
    result: "Sauce nappante onctueuse goût concentré complexe",
  },

  // ============ AVANCÉ ============
  emulsify: {
    name: "Émulsionner",
    description: "Lier gouttelettes gras dans eau (mayonnaise, hollandaise)",
    temperature: { low: 20, high: 50, unit: "C" },
    timing: { base: 8, scalingType: "linear" },
    heatLevel: "low",
    equipment: ["bol", "fouet", "thermometre"],
    profTips: {
      "4": "Tous ingrédients eau température avant commencer",
      "6": "Ajouter gras goutte à goutte début, mélanger constamment",
      "10": "Technique du cœur: si émulsion casse, recommencer demie liquide",
    },
    risks: {
      "4": "Trop gras trop rapide = casse",
      "6": "Pas assez mélange = structure instable",
      "10": "Température change = remulsion imprévisible",
    },
    result: "Sauce lisse creme consistante, pas grasse",
  },

  // ============ EXPERT ============
  sous_vide: {
    name: "Sous-vide",
    description: "Cuire en sachet fermé eau contrôlée température exacte",
    temperature: { low: 50, high: 65, unit: "C" },
    timing: { base: 120, scalingType: "logarithmic" },
    heatLevel: "low",
    equipment: ["machine sous-vide", "sachets", "thermometre"],
    profTips: {
      "5": "Vacciner d'abord, puis temperature contrôlée",
      "8": "Technique 'reverseal sear': cuire basse temp puis saisir surface",
      "10": "Timing très précis: +5min = différence texture notable",
    },
    risks: {
      "5": "Manque vide = cuisson inégale",
      "8": "Eau temperature variable = resultats imprévisibles",
      "10": "Contamination botulisme si température insufficace",
    },
    result: "Texture parfaite edge-to-edge, saveur complète",
  },

  demi_glace: {
    name: "Demi-glace maîtrise",
    description: "Réduction sauce très concentrée, brillante nappante",
    temperature: { low: 85, high: 95, unit: "C" },
    timing: { base: 180, scalingType: "complex" },
    heatLevel: "medium",
    equipment: ["casserole épaisse", "cuillere bois", "chinois"],
    profTips: {
      "6": "Stock + réduction 1:2 puis coating cuillere",
      "8": "Passer chinois fin 2x pour clarté brillant",
      "10": "Demi-glace vrai stocke froid = gel gélatineux",
    },
    risks: {
      "6": "Reduction trop simple = pas gélatine",
      "8": "Passoire incomplet = particules",
      "10": "Separation gras/gelee = instabilité",
    },
    result: "Glace brillante, nappante, goût intense équilibré",
  },
};

// ============ ADAPTATION PORTIONS ============
export function scaleTimingByPortions(
  baseTiming: number,
  scalingType: "linear" | "logarithmic" | "complex",
  fromServings: number,
  toServings: number
): number {
  if (fromServings === toServings) return baseTiming;

  const ratio = toServings / fromServings;

  switch (scalingType) {
    case "linear":
      return Math.round(baseTiming * ratio);

    case "logarithmic":
      // Portions plus grosses = moins proportionnel (log growth)
      return Math.round(baseTiming * Math.log(toServings + 1) / Math.log(fromServings + 1));

    case "complex":
      // Mix: linear si < 2x, puis log
      if (ratio <= 2) {
        return Math.round(baseTiming * ratio);
      } else {
        return Math.round(baseTiming * 2 + (baseTiming * 0.3 * (ratio - 2)));
      }

    default:
      return baseTiming;
  }
}

export function scaleHeatIntensity(
  baseHeat: "low" | "medium" | "high" | "very-high",
  ratio: number
): "low" | "medium" | "high" | "very-high" {
  // Plus de portions = moins haute température (pour éviter croûte brûlée)
  if (ratio < 0.5) {
    // Moins portions = plus haute possible
    return baseHeat;
  } else if (ratio > 2) {
    // Beaucoup plus portions = baisser un cran
    const levels = ["low", "medium", "high", "very-high"];
    const idx = levels.indexOf(baseHeat);
    const lower = Math.max(0, idx - 1);
    return levels[lower] as "low" | "medium" | "high" | "very-high";
  }
  return baseHeat;
}

export function getTechniqueForLevel(
  technique: CookingTechnique,
  level: ChefLevel
): TechniqueSpec | null {
  const caps = getLevelCapabilities(level);
  if (!caps.techniques.includes(technique)) {
    return null;
  }
  return TECHNIQUE_SPECS[technique] || null;
}

export function getTechniqueProfTip(
  technique: CookingTechnique,
  level: ChefLevel
): string {
  const spec = TECHNIQUE_SPECS[technique];
  if (!spec) return "";

  const tips = Object.keys(spec.profTips)
    .map(Number)
    .sort((a, b) => b - a)
    .find((l) => l <= level);

  return tips !== undefined ? spec.profTips[tips] : spec.profTips[Object.keys(spec.profTips)[0]];
}

export function getTechniqueRisk(
  technique: CookingTechnique,
  level: ChefLevel
): string {
  const spec = TECHNIQUE_SPECS[technique];
  if (!spec) return "";

  const risks = Object.keys(spec.risks)
    .map(Number)
    .sort((a, b) => b - a)
    .find((l) => l <= level);

  return risks !== undefined ? spec.risks[risks] : spec.risks[Object.keys(spec.risks)[0]];
}
