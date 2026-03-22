/**
 * CONTEXT INTELLIGENCE ENGINE — Module 1: Intent Parser
 * Parse l'intention réelle derrière la requête utilisateur.
 * "repas muscu" → protéines élevées
 * "repas 2€" → budget faible
 * "plat rapide" → temps < 20 min
 * "impressionner invité" → visuel + technique
 */

export type IntentGoal =
  | "protein"    // repas muscu, sport, prise de masse
  | "budget"     // pas cher, 2€, économique
  | "speed"      // rapide, express, 15 min
  | "impress"    // invité, gastronomique, chic
  | "light"      // léger, régime, diète
  | "comfort"    // réconfortant, hiver, cocooning
  | "discovery"  // nouveau, essayer, inconnu
  | "general";   // aucune intention spéciale

export interface ParsedIntent {
  goal: IntentGoal;
  confidence: number; // 0-1
  constraints: IntentConstraints;
  rawQuery: string;
  matchedKeywords: string[];
  explanation: string; // Pourquoi cette intention a été détectée
}

export interface IntentConstraints {
  maxTotalMinutes?: number;
  maxBudgetLevel?: 1 | 2 | 3; // 1=très cheap, 2=moyen, 3=sans limite
  minProteinLevel?: 1 | 2 | 3; // 1=faible, 2=moyen, 3=élevé
  minVisualImpact?: 1 | 2 | 3; // 1=simple, 2=présentable, 3=spectaculaire
  maxDifficulty?: number;
  preferredFamilies?: string[]; // familles d'ingrédients à favoriser
  excludedFamilies?: string[]; // familles d'ingrédients à éviter
}

// ==========================================
// PATTERNS DE DÉTECTION D'INTENTION
// ==========================================

interface IntentPattern {
  goal: IntentGoal;
  keywords: string[];
  regex?: RegExp[];
  constraints: IntentConstraints;
  explanation: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // PROTÉINES / MUSCU / SPORT
  {
    goal: "protein",
    keywords: [
      "muscu", "musculation", "proteine", "proteines", "prot",
      "sport", "fitness", "gainz", "gains", "masse",
      "prise de masse", "apres entrainement", "post-training",
      "seche", "dry", "bodybuilding",
    ],
    regex: [/repas\s+(muscu|sport|proteine)/i, /apres\s+(sport|muscu|entrainement)/i],
    constraints: {
      minProteinLevel: 3,
      preferredFamilies: ["poulet", "boeuf", "poisson", "crevette", "oeuf", "tofu", "quinoa"],
      excludedFamilies: [], // pas de restrictions
    },
    explanation: "Objectif protéines élevées détecté",
  },

  // BUDGET / PAS CHER
  {
    goal: "budget",
    keywords: [
      "pas cher", "economique", "budget", "cheap", "petit prix",
      "etudiant", "fin de mois", "economies",
    ],
    regex: [/(\d+)\s*[€$]/, /repas\s+(pas\s+cher|economique|budget)/, /moins\s+de\s+\d+\s*[€$]/],
    constraints: {
      maxBudgetLevel: 1,
      excludedFamilies: ["boeuf", "crustace", "crabe", "safran", "sole"],
      preferredFamilies: ["oeuf", "farine", "tomate", "oignon", "pomme-terre", "riz"],
      maxDifficulty: 3,
    },
    explanation: "Objectif budget faible détecté",
  },

  // RAPIDE / EXPRESS
  {
    goal: "speed",
    keywords: [
      "rapide", "express", "vite", "vite fait", "pressé", "presse",
      "feignant", "flemme", "quick", "fast",
      "15 min", "10 min", "20 min",
    ],
    regex: [
      /plat\s+rapide/, /repas\s+rapide/, /en\s+(\d+)\s*min/,
      /moins\s+de\s+(\d+)\s*min/, /rapide\s+(soir|midi|matin)/,
    ],
    constraints: {
      maxTotalMinutes: 20,
      maxDifficulty: 2,
      excludedFamilies: [], // pas d'exclusion par ingrédient
    },
    explanation: "Objectif rapidité détecté — max 20 min total",
  },

  // IMPRESSIONNER / INVITÉ
  {
    goal: "impress",
    keywords: [
      "impressionner", "invité", "invite", "gastronomique", "chic",
      "elegant", "beau", "presentation", "spectaculaire",
      "soiree", "reception", "diner romantique", "saint-valentin",
      "wow", "bluffant",
    ],
    regex: [/impressionner\s+(un\s+)?invite/, /plat\s+(chic|gastronomique|spectaculaire)/],
    constraints: {
      minVisualImpact: 3,
      minProteinLevel: 2,
      preferredFamilies: ["boeuf", "poisson", "crustace", "crabe", "sole"],
    },
    explanation: "Objectif présentation/impact visuel détecté",
  },

  // LÉGER / DIÈTE
  {
    goal: "light",
    keywords: [
      "leger", "light", "diete", "regime", "maigrir",
      "healthy", "sain", "calories", "minceur", "detox",
      "equilibre", "sans gras",
    ],
    regex: [/repas\s+(leger|light|sain|healthy)/, /peu\s+de\s+calories/],
    constraints: {
      maxBudgetLevel: 3,
      excludedFamilies: ["lard", "creme", "fromage", "beurre"],
      preferredFamilies: ["poisson", "legumes", "tomate", "oeuf"],
      maxDifficulty: 3,
    },
    explanation: "Objectif léger/santé détecté",
  },

  // RÉCONFORTANT
  {
    goal: "comfort",
    keywords: [
      "reconfortant", "comfort", "cocooning", "hiver",
      "froid", "chaleureux", "doudou", "plaisir",
      "gourmand", "genereux",
    ],
    regex: [/plat\s+(reconfortant|gourmand|genereux)/, /repas\s+d\s*hiver/],
    constraints: {
      preferredFamilies: ["pomme-terre", "fromage", "creme", "boeuf", "poulet"],
      minVisualImpact: 1,
    },
    explanation: "Objectif réconfort/gourmandise détecté",
  },

  // DÉCOUVERTE
  {
    goal: "discovery",
    keywords: [
      "nouveau", "decouvrir", "essayer", "inconnu", "original",
      "exotique", "voyage", "monde", "ailleurs",
    ],
    regex: [/quelque\s+chose\s+de\s+nouveau/, /plat\s+(original|exotique)/],
    constraints: {
      minVisualImpact: 2,
    },
    explanation: "Objectif découverte/originalité détecté",
  },
];

// ==========================================
// NORMALISATION
// ==========================================

function norm(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ==========================================
// PARSER PRINCIPAL
// ==========================================

/**
 * Analyse une requête utilisateur et retourne l'intention détectée
 * avec ses contraintes associées.
 */
export function parseIntent(query: string): ParsedIntent {
  const q = norm(query);
  if (!q) {
    return {
      goal: "general",
      confidence: 0,
      constraints: {},
      rawQuery: query,
      matchedKeywords: [],
      explanation: "Requête vide — mode général",
    };
  }

  let bestMatch: { pattern: IntentPattern; score: number; keywords: string[] } | null = null;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    const matched: string[] = [];

    // Score par mots-clés
    for (const kw of pattern.keywords) {
      if (q.includes(norm(kw))) {
        score += kw.includes(" ") ? 3 : 2; // multi-word = plus confiant
        matched.push(kw);
      }
    }

    // Score par regex
    if (pattern.regex) {
      for (const rx of pattern.regex) {
        const rxNorm = new RegExp(rx.source, rx.flags.includes("i") ? "i" : "");
        if (rxNorm.test(q)) {
          score += 4; // regex match = forte confiance
          matched.push(`regex:${rx.source}`);
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { pattern, score, keywords: matched };
    }
  }

  if (!bestMatch) {
    return {
      goal: "general",
      confidence: 0.3,
      constraints: {},
      rawQuery: query,
      matchedKeywords: [],
      explanation: "Pas d'intention spécifique détectée — mode général",
    };
  }

  // Extraire contrainte de temps explicite si présente
  const timeMatch = q.match(/(\d+)\s*min/);
  const constraints = { ...bestMatch.pattern.constraints };
  if (timeMatch) {
    constraints.maxTotalMinutes = Math.max(5, parseInt(timeMatch[1], 10));
  }

  // Extraire budget explicite si présent
  const budgetMatch = q.match(/(\d+)\s*[€$]/);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1], 10);
    constraints.maxBudgetLevel = amount <= 3 ? 1 : amount <= 8 ? 2 : 3;
  }

  const confidence = Math.min(1, bestMatch.score / 8);

  return {
    goal: bestMatch.pattern.goal,
    confidence,
    constraints,
    rawQuery: query,
    matchedKeywords: bestMatch.keywords.filter((k) => !k.startsWith("regex:")),
    explanation: bestMatch.pattern.explanation,
  };
}

/**
 * Résumé humain de l'intention pour affichage
 */
export function intentSummary(intent: ParsedIntent): string {
  const labels: Record<IntentGoal, string> = {
    protein: "Protéines élevées",
    budget: "Budget serré",
    speed: "Rapide (< 20 min)",
    impress: "Impressionner",
    light: "Léger / Santé",
    comfort: "Réconfortant",
    discovery: "Découverte",
    general: "Général",
  };
  const parts = [labels[intent.goal]];
  if (intent.constraints.maxTotalMinutes) {
    parts.push(`max ${intent.constraints.maxTotalMinutes} min`);
  }
  if (intent.constraints.maxBudgetLevel === 1) {
    parts.push("très économique");
  }
  if (intent.constraints.minProteinLevel === 3) {
    parts.push("riche en protéines");
  }
  return parts.join(" · ");
}
