import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/**
 * INSPECTEUR QUALITÉ CHEF ÉTOILÉ v2
 * Analyse intelligente du moteur culinaire
 * Comprend structure JSON réelle du Chef Star engine
 */

// ============ CONFIGURATION TEST ============

const TEST_SCENARIOS = [
  // Authentiques (doivent score haut)
  { query: "colombo de poulet", category: "authentic", portions: 4 },
  { query: "bokit traditionnel", category: "authentic", portions: 2 },
  { query: "poisson sauce coco", category: "authentic", portions: 6 },
  { query: "accras de morue", category: "authentic", portions: 4 },
  { query: "court-bouillon", category: "authentic", portions: 8 },
  { query: "poulet rôti", category: "authentic", portions: 4 },
  { query: "coq au vin", category: "authentic", portions: 6 },
  { query: "sole meunière", category: "authentic", portions: 2 },

  // Ingrédients simples (fallback test)
  { query: "poulet", category: "simple", portions: 4 },
  { query: "poisson", category: "simple", portions: 4 },
  { query: "oeuf", category: "simple", portions: 2 },
  { query: "tomate", category: "simple", portions: 2 },

  // Portions variées (adaptation test)
  { query: "colombo poulet 1 personne", category: "portions", portions: 1 },
  { query: "colombo poulet 8 personnes", category: "portions", portions: 8 },
  { query: "colombo poulet 12 personnes", category: "portions", portions: 12 },

  // Fuzzy matching
  { query: "plat antillais rapide", category: "fuzzy", portions: 4 },
  { query: "poisson épices", category: "fuzzy", portions: 4 },
  { query: "poulet facilement", category: "fuzzy", portions: 4 },
];

// ============ CRITÈRES QA PROFESSIONNEL ============

class ChefQAInspector {
  constructor() {
    this.results = [];
    this.issues = [];
  }

  analyzeChefStarResponse(response, context) {
    // Response peut être string ou object
    let recipeData;
    let rawResponse;

    if (typeof response === "string") {
      rawResponse = response;
      try {
        // Essayer parser JSON si c'est du JSON
        if (response.trimStart().startsWith("{")) {
          recipeData = JSON.parse(response);
        } else {
          recipeData = { answer: response };
        }
      } catch {
        recipeData = { answer: response };
      }
    } else {
      recipeData = response;
      rawResponse = JSON.stringify(response);
    }

    // Extraction des clés metrics
    const metrics = this.extractMetrics(recipeData);

    // Scoring strict
    const score = this.scoreChefResponse(recipeData, metrics, context);

    return {
      query: context.query,
      category: context.category,
      score: score.total,
      metrics,
      verdict: this.getVerdict(score.total),
      quality: score.quality,
      issues: score.issues,
      evidence: score.evidence,
      raw: {
        title: recipeData.title || "N/A",
        hasRecipe: !!recipeData.recipe,
        contentLength: rawResponse.length,
      },
    };
  }

  extractMetrics(response) {
    const answer = response.answer || "";
    const recipe = response.recipe || {};

    return {
      // Signature (essence du plat)
      hasSignature: response.answer?.includes("Signature") || !!recipe.signature,
      signatureLength: recipe.signature?.length || 0,

      // Fondamentaux
      hasFundamentals:
        response.answer?.includes("Fondament") ||
        (recipe.fundamentals && recipe.fundamentals.length > 0),
      fundamentalsCount: recipe.fundamentals?.length || 0,

      // Techniques
      hasTechniques:
        response.answer?.includes("Technique") || (recipe.techniques && recipe.techniques.length > 0),
        techniqunesCount: recipe.techniques?.length || 0,

      // Timing
      hasVariedTiming:
        answer.includes("Prep:") && answer.includes("Cuisson:") && answer.includes("Repos:"),
      hasTimingAdaptation: recipe.adaptedTiming?.total > 0,
      totalTime: recipe.adaptedTiming?.total || recipe.cookMinutes || 0,

      // Pro tips
      hasProTips:
        response.answer?.includes("Conseil") ||
        response.answer?.includes("professionnel") ||
        response.answer?.includes("✓") ||
        (recipe.profTips && recipe.profTips.length > 0) ||
        (recipe.tips && recipe.tips.length > 0),
      protisPCount: (recipe.profTips?.length || 0) + (recipe.tips?.length || 0),

      // Erreurs évitées
      hasCommonMistakes:
        response.answer?.includes("éviter") || (recipe.mistakes && recipe.mistakes.length > 0),
      mistakesCount: recipe.mistakes?.length || 0,

      // Identité culinaire
      hasCuisineIdentity: !!recipe.cuisine,
      dishFamily: recipe.dishFamily || recipe.family || "unknown",
      dishProfile: !!recipe.dishProfile,

      // Chef Star specifics
      isChefMode: response.title?.includes("CHEF ÉTOILÉ") || response.title?.includes("Chef Expert"),
      contentDepth: answer.length,
      answerStructure: {
        hasBullets: answer.includes("•"),
        hasCheckmarks: answer.includes("✓"),
        hasCrosses: answer.includes("✗"),
        hasUnicodeEmojis: /[✦✓✗]/g.test(answer),
      },
    };
  }

  scoreChefResponse(response, metrics, context) {
    let score = 10;
    const issues = [];
    const evidence = [];

    // 1. Mode Chef Étoilé activé? (-1 si pas)
    if (!metrics.isChefMode) {
      score -= 1;
      issues.push("⚠️ Mode Chef Étoilé non activé");
    } else {
      evidence.push("✅ Mode Chef Étoilé confirmé");
    }

    // 2. Signature présente? (-2)
    if (!metrics.hasSignature) {
      score -= 2;
      issues.push("⚠️ Signature culinaire manquante");
    } else {
      evidence.push("✅ Signature présente");
    }

    // 3. Fondamentaux? (-1.5)
    if (!metrics.hasFundamentals || metrics.fundamentalsCount < 2) {
      score -= 1.5;
      issues.push(`⚠️ Fondamentaux insuffisants (${metrics.fundamentalsCount})`);
    } else {
      evidence.push(`✅ ${metrics.fundamentalsCount} fondamentaux identifiés`);
    }

    // 4. Techniques réelles? (-1)
    if (!metrics.hasTechniques || metrics.techniqunesCount < 1) {
      score -= 1;
      issues.push("⚠️ Techniques non spécifiées");
    } else {
      evidence.push(`✅ ${metrics.techniqunesCount} technique(s)`);
    }

    // 5. Timing (prep/cuisson/repos) ? (-1.5)
    if (!metrics.hasVariedTiming || metrics.hasVariedTiming && metrics.totalTime > 600) {
      score -= 1.5;
      issues.push("⚠️ Timing irréaliste ou absent");
    } else {
      evidence.push(`✅ Timing réaliste (${metrics.totalTime}min)`);
    }

    // 6. Pro tips? (-1)
    if (!metrics.hasProTips || metrics.protisPCount < 2) {
      score -= 1;
      issues.push(`⚠️ Conseils pro insuffisants (${metrics.protisPCount})`);
    } else {
      evidence.push(`✅ ${metrics.protisPCount} conseils pro`);
    }

    // 7. Erreurs à éviter? (-0.5)
    if (!metrics.hasCommonMistakes || metrics.mistakesCount < 1) {
      score -= 0.5;
      issues.push("⚠️ Pas d'erreurs à éviter mentionnées");
    } else {
      evidence.push(`✅ ${metrics.mistakesCount} erreur(s) à éviter`);
    }

    // 8. Identité culinaire? (-1)
    if (!metrics.hasCuisineIdentity || metrics.dishFamily === "unknown") {
      score -= 1;
      issues.push("⚠️ Identité culinaire floue");
    } else {
      evidence.push(`✅ Identité culinaire: ${metrics.dishFamily}`);
    }

    // 9. Structure réelle vs fallback (-0.5)
    if (!metrics.dishProfile) {
      score -= 0.5;
      issues.push("⚠️ Pas de profil de plat structuré");
    } else {
      evidence.push("✅ Profil de plat structuré");
    }

    // 10. Unicité structurelle (+0.5)
    if (metrics.contentDepth > 500) {
      score = Math.min(10, score + 0.5);
      evidence.push("✅ Contenu riche et détaillé (+0.5)");
    }

    // Clamping final
    score = Math.max(0, Math.min(10, score));

    return {
      total: parseFloat(score.toFixed(2)),
      quality: this.getQualityLevel(score),
      issues,
      evidence,
    };
  }

  getQualityLevel(score) {
    if (score >= 9.5) return "PARFAIT";
    if (score >= 9) return "EXCELLENT";
    if (score >= 8) return "BON";
    if (score >= 7) return "ACCEPTABLE";
    if (score >= 6) return "PASSABLE";
    return "FAIBLE";
  }

  getVerdict(score) {
    if (score >= 9.5) return "🏆 PARFAIT - Niveau Michelin";
    if (score >= 9) return "🏆 EXCELLENT - Niveau chef";
    if (score >= 8) return "✅ BON - Production valide";
    if (score >= 7) return "⚠️ ACCEPTABLE - Avec réserves";
    if (score >= 6) return "⚠️ PASSABLE - À améliorer";
    return "🚫 FAIBLE - Refusé";
  }

  addResult(result) {
    this.results.push(result);
  }

  getReport() {
    const byQuality = {
      PARFAIT: 0,
      EXCELLENT: 0,
      BON: 0,
      ACCEPTABLE: 0,
      PASSABLE: 0,
      FAIBLE: 0,
    };

    this.results.forEach((r) => {
      byQuality[r.quality]++;
    });

    const avgScore = (this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length).toFixed(2);
    const excellentCount = byQuality.PARFAIT + byQuality.EXCELLENT;

    return {
      total: this.results.length,
      avgScore,
      byQuality,
      excellentRate: ((excellentCount / this.results.length) * 100).toFixed(1),
      results: this.results,
    };
  }
}

// ============ EXÉCUTION TESTS ============

async function runAdvancedTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   INSPECTEUR QA CHEF ÉTOILÉ v2 - VALIDATION AVANCÉE        ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`📊 Configuration: ${TEST_SCENARIOS.length} scénarios de test structurés\n`);

  try {
    const { askCookingAssistant, getChefLevel } = await import(
      path.join(projectRoot, "src/services/aiService.js")
    );

    console.log(`🍽️  Niveau Chef: ${getChefLevel()}\n`);

    const inspector = new ChefQAInspector();

    console.log("🧪 EXÉCUTION TESTS QUALIFICATION...\n");

    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      const progress = `[${String(i + 1).padStart(2, " ")}/${TEST_SCENARIOS.length}]`;

      try {
        const response = await askCookingAssistant(scenario.query, [], {
          temperature: 0.7,
          maxTokens: 1000,
        });

        const analysis = inspector.analyzeChefStarResponse(response, scenario);
        inspector.addResult(analysis);

        const icon = analysis.score >= 9 ? "🏆" : analysis.score >= 8 ? "✅" : analysis.score >= 7 ? "⚠️" : "🚫";
        console.log(`${progress} ${icon} [${analysis.score}/10] ${scenario.category.padEnd(12)} → "${scenario.query}"`);

        // Afficher 2 preuves ou problèmes clés
        const keyInsights = analysis.evidence.slice(0, 1);
        if (analysis.issues.length > 0 && analysis.issues[0]) {
          keyInsights.push(analysis.issues[0]);
        }
        keyInsights.forEach((k) => console.log(`         ${k}`));
        console.log("");
      } catch (err) {
        console.log(`${progress} ❌ ERREUR: "${scenario.query}"`);
        console.log(`         Error: ${err.message}\n`);
      }
    }

    // ============ RAPPORT CONSOLIDÉ ============

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║              RAPPORT DE QUALITÉ GLOBAL v2                  ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const report = inspector.getReport();

    console.log("📊 STATISTIQUES QUALITÉ:\n");
    console.log(`  Total recettes testées:        ${report.total}`);
    console.log(`  Score moyen:                   ${report.avgScore}/10`);
    console.log(`  Taux d'excellence (≥9):      ${report.excellentRate}%\n`);

    console.log("📈 DISTRIBUTION PAR QUALITÉ:\n");

    const qualityNames = ["PARFAIT", "EXCELLENT", "BON", "ACCEPTABLE", "PASSABLE", "FAIBLE"];
    const maxCount = Math.max(...Object.values(report.byQuality));

    qualityNames.forEach((q) => {
      const count = report.byQuality[q];
      const pct = ((count / report.total) * 100).toFixed(1);
      const bar = "█".repeat(count / 2 || 0);
      console.log(`  ${q.padEnd(12)} ${bar} ${count} (${pct}%)`);
    });

    // ============ ANALYSE PAR CATÉGORIE ============

    console.log("\n📋 ANALYSE PAR CATÉGORIE TEST:\n");

    const byCategory = {};
    report.results.forEach((r) => {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { scores: [], count: 0 };
      }
      byCategory[r.category].scores.push(r.score);
      byCategory[r.category].count++;
    });

    Object.entries(byCategory).forEach(([cat, data]) => {
      const avg = (data.scores.reduce((a, b) => a + b, 0) / data.count).toFixed(2);
      const min = Math.min(...data.scores).toFixed(1);
      const max = Math.max(...data.scores).toFixed(1);
      console.log(`  ${cat.padEnd(15)} avg: ${avg}/10  (min: ${min}, max: ${max})`);
    });

    // ============ DIAGNOSTIC PROBLÈMES ============

    const problematic = report.results.filter((r) => r.score < 7);
    if (problematic.length > 0) {
      console.log("\n⚠️  RECETTES FAIBLES (score < 7):\n");
      problematic.forEach((p) => {
        console.log(`  "${p.query}" → ${p.score}/10`);
        p.issues.slice(0, 2).forEach((issue) => console.log(`    ${issue}`));
        console.log("");
      });
    }

    // ============ VERDICT MOTEUR ============

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                   DIAGNOSTIC MOTEUR                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const avgScore = parseFloat(report.avgScore);
    const excellenceRate = parseFloat(report.excellentRate);

    let diagnosis = "";
    let statusEmoji = "";

    if (avgScore >= 8.5 && excellenceRate >= 40) {
      diagnosis = "🌟 PRODUCTION READY - Excellent niveau de qualité";
      statusEmoji = "✅";
    } else if (avgScore >= 8 && excellenceRate >= 25) {
      diagnosis = "✅ PRODUCTION - Qualité acceptable";
      statusEmoji = "✓";
    } else if (avgScore >= 7 && excellenceRate >= 10) {
      diagnosis = "⚠️ À SURVEILLER - Qualité limitée";
      statusEmoji = "!";
    } else {
      diagnosis = "🚫 CRITICAL - Qualité insuffisante";
      statusEmoji = "✗";
    }

    console.log(`${statusEmoji} MOTEUR CULINAIRE: ${diagnosis}`);
    console.log(`   Score moyen: ${avgScore}/10`);
    console.log(`   Excellence: ${excellenceRate}%\n`);

    // ============ RECOMMANDATIONS ============

    console.log("🎯 RECOMMANDATIONS:\n");

    if (report.byQuality.FAIBLE > 0) {
      console.log(`1. 🚫 ${report.byQuality.FAIBLE} recette(s) faible(s) - réviser logique`);
    }
    if (excellenceRate < 25) {
      console.log(`2. 📈 Augmenter excellence: seulement ${excellenceRate}% vs objectif 40%`);
    }
    if (avgScore < 8.5) {
      console.log(
        `3. 🎯 Améliorer contenu: certaines recettes manquent signature/fondamentaux/techniques`,
      );
    } else {
      console.log(`3. ✅ EXCELLENT: moteur fonction correctement, prêt production`);
    }

    // ============ EXPORT RAPPORT ============

    const fullReport = {
      timestamp: new Date().toISOString(),
      version: "QA-Inspector-v2",
      moteurScore: avgScore,
      excellenceRate,
      diagnosis,
      statistics: report,
      recommendations: [
        report.byQuality.FAIBLE > 0 && `Corriger ${report.byQuality.FAIBLE} recettes faibles`,
        excellenceRate < 25 && `Augmenter taux excellence (actuellement ${excellenceRate}%, objectif 40%)`,
        avgScore < 8.5 && "Enrichir contenu pro (signature/fondamentaux/techniques)",
      ].filter(Boolean),
    };

    const reportPath = path.join(projectRoot, "test_reports", "qa_advanced_v2.json");
    fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

    console.log(`📁 Rapport complet: test_reports/qa_advanced_v2.json\n`);
    console.log("✅ TEST QUALIFICATION - TERMINÉ\n");
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    console.error(err.stack);
  }
}

runAdvancedTests().catch(console.error);
