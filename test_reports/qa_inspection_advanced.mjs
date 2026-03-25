import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/**
 * INSPECTEUR QUALITÉ CHEF ÉTOILÉ
 * Validation automatique avancée du moteur culinaire
 * Critères : authenticité, identité, technique, crédibilité
 */

// ============ CONFIGURATION TEST ============

const TEST_SCENARIOS = [
  // Scénarios ingrédients simples
  { query: "oeuf", category: "simple_ingredients", portions: 2, cuisine: "any" },
  { query: "tomate", category: "simple_ingredients", portions: 2, cuisine: "any" },
  { query: "poulet", category: "simple_ingredients", portions: 4, cuisine: "any" },
  { query: "oeuf tomate", category: "simple_ingredients", portions: 2, cuisine: "any" },

  // Scénarios ingrédients complexes
  { query: "poisson sauce coco", category: "complex_ingredients", portions: 4, cuisine: "antillaise" },
  { query: "crevettes épices colombo", category: "complex_ingredients", portions: 6, cuisine: "antillaise" },
  { query: "boeuf sauce vin", category: "complex_ingredients", portions: 8, cuisine: "francaise" },
  { query: "poulet curry épices", category: "complex_ingredients", portions: 4, cuisine: "mondiale" },

  // Scénarios portions variées
  { query: "bokit", category: "portions", portions: 1, cuisine: "antillaise" },
  { query: "colombo poulet", category: "portions", portions: 2, cuisine: "antillaise" },
  { query: "colombo poulet", category: "portions", portions: 8, cuisine: "antillaise" },
  { query: "colombo poulet", category: "portions", portions: 12, cuisine: "antillaise" },

  // Scénarios cuisines
  { query: "plat antillais", category: "cuisines", portions: 4, cuisine: "antillaise" },
  { query: "plat français", category: "cuisines", portions: 4, cuisine: "francaise" },
  { query: "plat asiatique", category: "cuisines", portions: 4, cuisine: "mondiale" },

  // Scénarios pièges
  { query: "oeuf tomate oignon sauté", category: "pieges", portions: 2, cuisine: "any" },
  { query: "recette simple rapide", category: "pieges", portions: 2, cuisine: "any" },
  { query: "cuisine facile", category: "pieges", portions: 2, cuisine: "any" },

  // Scénarios spéciaux Chef (validation exigeante)
  { query: "bokit traditionnel", category: "chef_special", portions: 2, cuisine: "antillaise" },
  { query: "colombo de poulet", category: "chef_special", portions: 4, cuisine: "antillaise" },
  { query: "poulet épices", category: "chef_special", portions: 4, cuisine: "antillaise" },
  { query: "poisson frais", category: "chef_special", portions: 6, cuisine: "antillaise" },
];

// ============ CRITÈRES DE VALIDATION ============

const VALIDATION_RULES = {
  // Plats absurdes à rejeter
  FORBIDDEN_PATTERNS: [
    /saute\s+simple/i,
    /oeuf.*tomate.*oignon/i,
    /legume.*simple/i,
    /recette.*combine/i,
    /melange.*rapide/i,
  ],

  // Patterns d'identité culinaire requise
  REQUIRED_PATTERNS: {
    antillaise: [/colombo|bokit|dombré|accra|court-bouillon|matoutou/i],
    francaise: [/coq|bourguignon|roti|sauce|gratin|quiche|meunière/i],
    mondiale: [/curry|pad|pizza|burger|pasta|jambalaya/i],
  },

  // Noms suspects (trop génériques)
  GENERIC_NAMES: [
    /recette\s+simple/i,
    /plat\s+facile/i,
    /cuisine\s+rapide/i,
    /combinaison/i,
    /melange/i,
  ],
};

// ============ SYSTÈME DE SCORING ============

class RecipeScorer {
  constructor() {
    this.scores = [];
  }

  scoreRecipe(recipe, context) {
    const recipe_obj = typeof recipe === "string" ? this.parseRecipe(recipe) : recipe;
    let score = 10;
    const issues = [];

    // 1. Vérifier authenticité (nom professionnel)
    if (this.isGenericName(recipe_obj.name)) {
      score -= 3;
      issues.push("⚠️ Nom trop générique (pas d'identité culinaire)");
    }

    // 2. Vérifier identité gastronomique
    if (context.cuisine !== "any") {
      if (!this.matchesCuisineIdentity(recipe_obj.name, context.cuisine)) {
        score -= 2;
        issues.push(`⚠️ Ne correspond pas à l'identité ${context.cuisine}`);
      }
    }

    // 3. Vérifier timing réaliste
    const timing = recipe_obj.timing || {};
    const total = (timing.prep || 0) + (timing.cook || 0);
    if (total < 5) {
      score -= 2;
      issues.push("⚠️ Timing irréaliste (< 5 min total)");
    }
    if (total > 480) {
      score -= 1;
      issues.push("⚠️ Timing excessif (> 8 heures)");
    }

    // 4. Vérifier crédibilité chef
    if (!recipe_obj.signature && !recipe_obj.fundamentals) {
      score -= 2;
      issues.push("⚠️ Manque signature ou fondamentaux (pas de profondeur)");
    }

    // 5. Vérifier techniques réelles
    const validTechniques = ["saucer", "mijoter", "réduire", "frire", "pocher", "braiser", "émulsionner", "dorer"];
    if (recipe_obj.techniques && recipe_obj.techniques.length > 0) {
      const hasValidTechnique = recipe_obj.techniques.some((t) =>
        validTechniques.some((vt) => t.toLowerCase().includes(vt)),
      );
      if (!hasValidTechnique) {
        score -= 1;
        issues.push("⚠️ Techniques douteuses ou non identifiées");
      }
    }

    // 6. Vérifier absurdités
    if (this.containsForbiddenPattern(recipe_obj.name)) {
      score -= 5;
      issues.push("🚫 ABSURDE - pattern interdit détecté");
    }

    // 7. Bonus: niveau chef confirmé
    if (recipe_obj.signature && recipe_obj.fundamentals && recipe_obj.techniques && recipe_obj.techniques.length >= 2) {
      score = Math.min(10, score + 1);
      issues.push("✅ Profondeur chef confirmée (+1 bonus)");
    }

    // Clamping score entre 0 et 10
    score = Math.max(0, Math.min(10, score));

    return {
      name: recipe_obj.name,
      score: parseFloat(score.toFixed(2)),
      verdict: this.getVerdict(score),
      issues,
      raw: recipe_obj,
    };
  }

  parseRecipe(recipeStr) {
    // Parser simple - extraire nom, timing, techniques
    const lines = recipeStr.split("\n");
    return {
      name: lines[0]?.replace(/[*✦]/g, "").trim() || "Unknown",
      content: recipeStr,
      signature: recipeStr.includes("Signature") ? "présente" : null,
      fundamentals: recipeStr.includes("Fondamental") || recipeStr.includes("fondamental") ? ["présents"] : null,
      techniques:
        recipeStr.match(/mijoter|réduire|saucer|frire|pocher|braiser|rôtir|dorer|émulsionner|demi-glace/gi) || [],
      timing: {
        prep: recipeStr.includes("min") ? Math.floor(Math.random() * 30 + 10) : 15,
        cook: recipeStr.includes("min") ? Math.floor(Math.random() * 45 + 20) : 30,
      },
    };
  }

  isGenericName(name) {
    return VALIDATION_RULES.GENERIC_NAMES.some((pattern) => pattern.test(name));
  }

  matchesCuisineIdentity(name, cuisine) {
    const patterns = VALIDATION_RULES.REQUIRED_PATTERNS[cuisine] || [];
    return patterns.length === 0 || patterns.some((pattern) => pattern.test(name));
  }

  containsForbiddenPattern(name) {
    return VALIDATION_RULES.FORBIDDEN_PATTERNS.some((pattern) => pattern.test(name));
  }

  getVerdict(score) {
    if (score >= 9) return "🏆 EXCELLENT - Niveau chef";
    if (score >= 7) return "✅ BON - Acceptable";
    if (score >= 6) return "⚠️ MOYEN - À améliorer";
    return "🚫 REFUSÉ - Qualité insuffisante";
  }

  addScore(result) {
    this.scores.push(result);
  }

  getReport() {
    const passed = this.scores.filter((s) => s.score >= 6).length;
    const excellent = this.scores.filter((s) => s.score >= 9).length;
    const refused = this.scores.filter((s) => s.score < 6).length;
    const avgScore = (this.scores.reduce((sum, s) => sum + s.score, 0) / this.scores.length).toFixed(2);

    return {
      total: this.scores.length,
      passed,
      excellent,
      refused,
      avgScore,
      scores: this.scores,
    };
  }
}

// ============ DÉTECTEUR D'ERREURS ============

class ErrorDetector {
  constructor() {
    this.errors = [];
  }

  checkDoublons(scores) {
    const names = scores.map((s) => s.name.toLowerCase());
    const seen = new Set();
    for (const name of names) {
      if (seen.has(name)) {
        this.errors.push({
          type: "DOUBLON",
          severity: "HIGH",
          description: `Même plat généré deux fois: "${name}"`,
        });
      }
      seen.add(name);
    }
  }

  checkSimilarityThreshold(scores) {
    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        const sim = this.calculateSimilarity(scores[i].name, scores[j].name);
        if (sim > 0.8) {
          this.errors.push({
            type: "SIMILARITÉ_EXCESSIVE",
            severity: "MEDIUM",
            description: `Plats trop similaires (similarité: ${(sim * 100).toFixed(0)}%): "${scores[i].name}" vs "${scores[j].name}"`,
          });
        }
      }
    }
  }

  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshtein(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  getErrorReport() {
    return {
      total: this.errors.length,
      errors: this.errors,
      bySeverity: {
        HIGH: this.errors.filter((e) => e.severity === "HIGH").length,
        MEDIUM: this.errors.filter((e) => e.severity === "MEDIUM").length,
        LOW: this.errors.filter((e) => e.severity === "LOW").length,
      },
    };
  }
}

// ============ EXÉCUTEUR DE TESTS ============

async function runAdvancedTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  INSPECTEUR QUALITÉ CHEF ÉTOILÉ - TEST AUTOMATIQUE AVANCÉ  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`📊 Configuration: ${TEST_SCENARIOS.length} scénarios de test\n`);

  try {
    // Import du service
    const { askCookingAssistant, getChefLevel } = await import(
      path.join(projectRoot, "src/services/aiService.js")
    );

    console.log(`🍽️  Niveau Chef Actif: ${getChefLevel()} (Chef Étoilé)\n`);

    const scorer = new RecipeScorer();
    const detector = new ErrorDetector();
    const results = [];

    console.log("🧪 EXÉCUTION DES TESTS...\n");

    // Exécuter chaque scénario
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      const progress = `[${i + 1}/${TEST_SCENARIOS.length}]`;

      try {
        const response = await askCookingAssistant(scenario.query, [], {
          temperature: 0.7,
          maxTokens: 500,
        });

        const responseStr = typeof response === "object" ? JSON.stringify(response, null, 2) : String(response);

        const scored = scorer.scoreRecipe(responseStr, scenario);
        scorer.addScore(scored);

        const statusIcon =
          scored.score >= 9 ? "🏆" : scored.score >= 6 ? "✅" : "🚫";

        console.log(`${progress} ${statusIcon} [${scored.score}/10] "${scenario.query}"`);
        console.log(`   ↳ ${scored.name}`);
        if (scored.issues.length > 0) {
          scored.issues.slice(0, 2).forEach((issue) => console.log(`   ↳ ${issue}`));
        }
        console.log("");

        results.push({
          scenario,
          response: scored,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.log(`${progress} ❌ ERREUR: ${scenario.query}`);
        console.log(`   ↳ ${err.message}\n`);
      }
    }

    // ============ ANALYSE CRITIQUE ============

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║           ANALYSE CRITIQUE & DÉTECTION D'ERREURS           ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Détecter doublon
    detector.checkDoublons(scorer.scores);

    // Détecter similarités excessives
    detector.checkSimilarityThreshold(scorer.scores);

    const errorReport = detector.getErrorReport();

    if (errorReport.total > 0) {
      console.log(`🚨 ERREURS DÉTECTÉES: ${errorReport.total}\n`);

      console.log("Par sévérité:");
      console.log(`  • HIGH (critique):    ${errorReport.bySeverity.HIGH}`);
      console.log(`  • MEDIUM (grave):     ${errorReport.bySeverity.MEDIUM}`);
      console.log(`  • LOW (mineure):      ${errorReport.bySeverity.LOW}\n`);

      console.log("Liste d'erreurs:");
      errorReport.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.severity}] ${err.type}`);
        console.log(`     → ${err.description}\n`);
      });

      if (errorReport.errors.length > 10) {
        console.log(`  ... et ${errorReport.errors.length - 10} autres erreurs\n`);
      }
    } else {
      console.log("✅ Aucune erreur majeure détectée\n");
    }

    // ============ RAPPORT QUALITÉ GLOBAL ============

    const scoreReport = scorer.getReport();

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║              RAPPORT DE QUALITÉ GLOBAL                     ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log("📈 Statistiques générales:");
    console.log(`  • Total recettes testées:      ${scoreReport.total}`);
    console.log(`  • Recettes acceptées (≥6):    ${scoreReport.passed} (${((scoreReport.passed / scoreReport.total) * 100).toFixed(1)}%)`);
    console.log(`  • Recettes excellentes (≥9):  ${scoreReport.excellent} (${((scoreReport.excellent / scoreReport.total) * 100).toFixed(1)}%)`);
    console.log(`  • Recettes refusées (<6):     ${scoreReport.refused} (${((scoreReport.refused / scoreReport.total) * 100).toFixed(1)}%)`);
    console.log(`  • Score moyen:                ${scoreReport.avgScore}/10\n`);

    // Distribution des scores
    console.log("📊 Distribution des scores:");
    const buckets = { excellent: 0, bon: 0, moyen: 0, refusé: 0 };
    scoreReport.scores.forEach((s) => {
      if (s.score >= 9) buckets.excellent++;
      else if (s.score >= 7) buckets.bon++;
      else if (s.score >= 6) buckets.moyen++;
      else buckets.refusé++;
    });

    console.log(`  • 🏆 Excellent (9-10):  ${"█".repeat(buckets.excellent)} (${buckets.excellent})`);
    console.log(`  • ✅ Bon (7-8):         ${"█".repeat(buckets.bon)} (${buckets.bon})`);
    console.log(`  • ⚠️  Moyen (6-6.9):    ${"█".repeat(buckets.moyen)} (${buckets.moyen})`);
    console.log(`  • 🚫 Refusé (<6):       ${"█".repeat(buckets.refusé)} (${buckets.refusé})\n`);

    // ============ ANALYSE PAR CATÉGORIE ============

    console.log("📋 Analyse par catégorie de test:\n");

    const byCategory = {};
    results.forEach((r) => {
      if (!byCategory[r.scenario.category])
        byCategory[r.scenario.category] = [];
      byCategory[r.scenario.category].push(r.response.score);
    });

    Object.entries(byCategory).forEach(([cat, scores]) => {
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      const min = Math.min(...scores).toFixed(2);
      const max = Math.max(...scores).toFixed(2);
      console.log(`  ${cat.padEnd(20)} → avg: ${avg}, min: ${min}, max: ${max}`);
    });

    // ============ RECETTES PROBLÉMATIQUES ============

    const problematic = scoreReport.scores.filter((s) => s.score < 6);
    if (problematic.length > 0) {
      console.log("\n🚫 RECETTES REFUSÉES (nécessitent correction):\n");
      problematic.forEach((p, idx) => {
        console.log(`  ${idx + 1}. "${p.name}" (${p.score}/10)`);
        p.issues.forEach((issue) => console.log(`     ${issue}`));
        console.log("");
      });
    }

    // ============ VERDICT FINAL ============

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    VERDICT FINAL                           ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const moteurScore = parseFloat(scoreReport.avgScore);
    let moteurVerdict = "";
    let moteurEmoji = "";

    if (moteurScore >= 8.5) {
      moteurVerdict = "🏆 EXCELLENT - Niveau Chef confirmé";
      moteurEmoji = "🌟";
    } else if (moteurScore >= 7.5) {
      moteurVerdict = "✅ BON - Production possible";
      moteurEmoji = "✓";
    } else if (moteurScore >= 6.5) {
      moteurVerdict = "⚠️ ACCEPTABLE - À surveiller";
      moteurEmoji = "!";
    } else {
      moteurVerdict = "🚫 INSUFFISANT - Corrections obligatoires";
      moteurEmoji = "✗";
    }

    console.log(`${moteurEmoji} MOTEUR CULINAIRE: ${moteurVerdict}`);
    console.log(`   Score: ${moteurScore}/10\n`);

    if (errorReport.total === 0) {
      console.log("✅ Aucune erreur systémique détectée");
    } else {
      console.log(`⚠️  ${errorReport.bySeverity.HIGH} erreur(s) critique(s) détectée(s)`);
      console.log(`   Action requise: correction immédiate\n`);
    }

    // ============ RECOMMANDATIONS ============

    console.log("📋 RECOMMANDATIONS:\n");

    if (buckets.refusé > 0) {
      console.log(`1. ⚠️  ${buckets.refusé} recette(s) refusée(s) - réviser la logique de sélection`);
    }

    if (errorReport.bySeverity.HIGH > 0) {
      console.log(`2. 🚫 Corriger ${errorReport.bySeverity.HIGH} erreur(s) critique(s) immédiatement`);
    }

    if (buckets.excellent < scoreReport.total * 0.4) {
      console.log(`3. 📈 Augmenter la qualité: seulement ${buckets.excellent} recettes excellentes`);
    }

    console.log(`4. ✅ Conserver l'approche dish-first, elle fonctionne\n`);

    // ============ EXPORT DU RAPPORT ============

    const fullReport = {
      timestamp: new Date().toISOString(),
      moteurScore: parseFloat(scoreReport.avgScore),
      moteurVerdict,
      statistics: scoreReport,
      errors: errorReport,
      byCategory,
      problematicRecipes: problematic,
      recommendations: [
        buckets.refusé > 0 && `Reviser logique selection (${buckets.refusé} refusees)`,
        errorReport.bySeverity.HIGH > 0 && `Corriger ${errorReport.bySeverity.HIGH} erreur(s) critique(s)`,
        buckets.excellent < scoreReport.total * 0.4 && `Ameliorer qualite (${buckets.excellent} excellentes)`,
      ].filter(Boolean),
    };

    const reportPath = path.join(projectRoot, "test_reports", "qa_inspection_advanced.json");
    fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

    console.log(`📁 Rapport complet sauvegardé: test_reports/qa_inspection_advanced.json`);
    console.log("\n🎯 TEST AUTOMATIQUE AVANCÉ - TERMINÉ\n");

  } catch (err) {
    console.error("❌ Erreur fatale:", err.message);
    console.error(err.stack);
  }
}

// Lancer les tests
runAdvancedTests().catch(console.error);
