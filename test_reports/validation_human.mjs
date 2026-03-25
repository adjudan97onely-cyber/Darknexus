import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/**
 * VALIDATION RÉELLE - Test utilisateur humain
 * Critique comme un CLIENT PAYANT, pas dev
 * Question clé: "Est-ce que je paierais pour ça?"
 */

// ============ PROFILS UTILISATEURS RÉALISTES ============

const USER_PROFILES = {
  beginner: {
    name: "👶 Débutant Total",
    cuisineLevel: "Zéro - jamais cooked serious",
    budget: "budget étudiant",
    time: "15-30 min",
    expectations: "Simple, rapide, pas cher, difficile à rater",
    mindset: "On me dit quoi faire, pas trop complexe",
  },
  amateur: {
    name: "👨‍🍳 Amateur Cuisine",
    cuisineLevel: "Fait à manger régulièrement, aime bien",
    budget: "budget normal",
    time: "30-60 min",
    expectations: "Bon goût, intéressant, pas trop difficile",
    mindset: "Je veux impressionner un peu sans me fatiguer",
  },
  confirmed: {
    name: "🔥 Cuisinier Confirmé",
    cuisineLevel: "Cuisiner c'est normal, technique connue",
    budget: "budget quali",
    time: "45-90 min",
    expectations: "Saveur, technique, originalité, ingredients quali",
    mindset: "Je veux apprendre quelque chose, technique maîtrisée",
  },
  chef: {
    name: "👨‍⚖️ Chef Exigeant",
    cuisineLevel: "Expert, technique pro",
    budget: "Cost not issue",
    time: "flexible",
    expectations: "Authenticité, technique pro, innovation, gout parfait",
    mindset: "Je veux du sérieux. Pas d'amateur.",
  },
};

// ============ REQUÊTES RÉALISTES ============

const REAL_QUERIES = [
  {
    query: "bokit",
    context: "Petit-déj ou snack antillais",
    who: ["beginner", "amateur", "confirmed"],
    realityCheck: "Plat qu'existe vraiment en Guadeloupe, pas une invention",
  },
  {
    query: "colombo poulet",
    context: "Plat signature antillais",
    who: ["amateur", "confirmed", "chef"],
    realityCheck: "Plat antillais authentique, revendiqué comme spécialité",
  },
  {
    query: "plat rapide soir",
    context: "Après boulot, fatigué, faut manger",
    who: ["beginner", "amateur", "confirmed"],
    realityCheck: "Real-world scenario: doit être rapide VRAIMENT",
  },
  {
    query: "repas 2€",
    context: "Budget serré, ça compte au centime",
    who: ["beginner", "amateur"],
    realityCheck: "Teste budget reality - bouffira pour 2€ vraiment?",
  },
  {
    query: "repas muscu",
    context: "Post-training protein focus",
    who: ["beginner", "amateur", "confirmed"],
    realityCheck: "Cible spécifique: riche protéines, calorisé",
  },
  {
    query: "plat impressionnant invité",
    context: "Faut que ça gère à table",
    who: ["amateur", "confirmed", "chef"],
    realityCheck: "Pas juste bon, faut que ça DONNE ENVIE",
  },
];

// ============ ANALYSEUR HUMAIN ============

class HumanValidator {
  constructor() {
    this.results = [];
    this.seenDishes = new Set();
  }

  analyzeAsHuman(response, query, userProfile) {
    const recipeData = this.extractRecipeData(response);
    const dishName = recipeData.name?.toLowerCase() || "unknown";

    // Critères humains
    const analysis = {
      query,
      userProfile: userProfile.name,
      dishName: recipeData.name,
      timestamp: new Date().toISOString(),

      // 1. ENVIE (premier test)
      appealing: this.checkAppeal(recipeData, userProfile),

      // 2. CRÉDIBILITÉ
      credible: this.checkCredibility(recipeData),

      // 3. EXISTE VRAIMENT?
      isReal: this.checkRealness(dishName),

      // 4. RÉPÉTITION?
      isDuplicate: this.checkDuplication(dishName),

      // 5. GÉNÉRICITÉ
      genericity: this.checkGenericity(recipeData),

      // 6. TEST "PAYANT?"
      worthPaying: this.checkWorthPaying(recipeData, userProfile),

      // 7. IDENTITÉ CULINAIRE
      culinaryIdentity: this.checkIdentity(recipeData),

      // 8. Détails réponse
      hasSignature: !!recipeData.signature,
      hasTechniques: (recipeData.techniques?.length || 0) >= 1,
      hasProTips: (recipeData.tips?.length || 0) >= 1,
      timingRealistic: this.checkTiming(recipeData),
      contentDepth: this.contentLength(response),
    };

    // Score humain honnête
    analysis.humanScore = this.scoreHonestly(analysis, userProfile);
    analysis.humanVerdict = this.getHumanVerdict(analysis.humanScore);

    this.results.push(analysis);
    if (!analysis.isDuplicate && dishName !== "unknown") {
      this.seenDishes.add(dishName);
    }

    return analysis;
  }

  extractRecipeData(response) {
    let data = {};
    if (typeof response === "string") {
      try {
        if (response.trimStart().startsWith("{")) {
          data = JSON.parse(response);
        } else {
          data = { answer: response };
        }
      } catch {
        data = { answer: response };
      }
    } else {
      data = response;
    }

    return {
      name: data.recipe?.name || data.title || "Unknown",
      signature: data.recipe?.signature || "",
      fundamentals: data.recipe?.fundamentals || [],
      techniques: data.recipe?.techniques || [],
      tips: data.recipe?.profTips || data.recipe?.tips || [],
      cuisine: data.recipe?.cuisine || "",
      difficulty: data.recipe?.difficulty || "",
      timing: data.recipe?.adaptedTiming || data.recipe?.cookMinutes || 0,
      servings: data.recipe?.servings || data.servings || 2,
      answer: data.answer || "",
    };
  }

  checkAppeal(recipe, profile) {
    // Ça donne envie? (subjectif mais important)
    const score = [];

    // Signature attractive?
    if (recipe.signature && recipe.signature.length > 20) {
      const attractive =
        recipe.signature.includes("tendre") ||
        recipe.signature.includes("riche") ||
        recipe.signature.includes("saveur") ||
        recipe.signature.includes("croustillant") ||
        recipe.signature.includes("onctueux");
      score.push(attractive ? 2 : 0);
    } else {
      score.push(0);
    }

    // Complexity matches profile
    const isComplexDish =
      recipe.techniques.length > 1 || (recipe.tips || []).length > 2;
    if (profile.name.includes("Débutant") && isComplexDish) score.push(-1);
    if (profile.name.includes("Chef") && !isComplexDish) score.push(-1);

    return ((score.reduce((a, b) => a + b, 0)) / 3).toFixed(2);
  }

  checkCredibility(recipe) {
    // Ça sonne vrai?
    const score = [];

    // Timing réaliste
    const timing = recipe.timing;
    if (typeof timing === "object") {
      const total = (timing.prep || 0) + (timing.cook || 0);
      score.push(total > 5 && total < 240 ? 1 : -1);
    } else {
      score.push(timing > 0 && timing < 240 ? 1 : -1);
    }

    // Fondamentaux spécifiques (pas generic)
    const hasSpecificFundamentals =
      (recipe.fundamentals || []).some((f) =>
        /toaster|réduire|braise|mijoter|saucer/.test(f, "i"),
      );
    score.push(hasSpecificFundamentals ? 1 : 0);

    // Techniques spécifiques
    const hasSpecificTechniques = (recipe.techniques || []).some((t) =>
      /braise|réduc|sauc|mijot|poch/.test(String(t), "i"),
    );
    score.push(hasSpecificTechniques ? 1 : 0);

    return ((score.reduce((a, b) => a + b, 0)) / 3).toFixed(2);
  }

  checkRealness(dishName) {
    // Est-ce que ça existe vraiment?
    const realDishes = [
      /colombo/i,
      /bokit/i,
      /coq au vin/i,
      /sole meunière/i,
      /gratin/i,
      /quiche/i,
      /burger/i,
      /pizza/i,
      /curry/i,
      /pad thai/i,
      /accra/i,
      /court-bouillon/i,
      /matoutou/i,
      /dombré/i,
      /poisson/i,
      /poulet rôti/i,
      /beef bourguignon/i,
    ];

    const exists = realDishes.some((pattern) => pattern.test(dishName));
    return exists ? "OUI" : "SUSPECT";
  }

  checkDuplication(dishName) {
    const isDup = this.seenDishes.has(dishName.toLowerCase());
    if (isDup) {
      this.seenDishes.add(dishName.toLowerCase());
      return true;
    }
    if (dishName.toLowerCase() !== "unknown") {
      this.seenDishes.add(dishName.toLowerCase());
    }
    return false;
  }

  checkGenericity(recipe) {
    // Score de généricité (mauvais = générique)
    const score = [];

    // Nom trop generic?
    const genericNames =
      /salade simple|plat combiné|recette rapide|mélange|sauce simple|oeuf tomate/i;
    score.push(genericNames.test(recipe.name) ? -2 : 1);

    // Description trop vague?
    const genericWords = [];
    recipe.answer?.match(/rapide|simple|facile|combiné/g)?.forEach(() => {
      genericWords.push(-0.5);
    });
    score.push(...genericWords);

    // Identité culinaire présente?
    if (recipe.cuisine) {
      score.push(1);
    } else {
      score.push(-1);
    }

    return Math.max(0, (score.reduce((a, b) => a + b, 0)) / 3).toFixed(2);
  }

  checkWorthPaying(recipe, profile) {
    // Question clé: paierais-je pour ça?
    const score = [];

    // Authenticité
    if (recipe.signature && recipe.signature.length > 30) {
      score.push(1.5);
    } else {
      score.push(-1);
    }

    // Profondeur technique
    const depth = (recipe.techniques?.length || 0) + (recipe.tips?.length || 0);
    if (profile.name.includes("Chef") && depth < 2) score.push(-2);
    if (depth >= 2) score.push(1);

    // Originalité vs generic
    if (
      recipe.answer?.includes("colombo") ||
      recipe.answer?.includes("bokit") ||
      recipe.answer?.includes("authentique")
    ) {
      score.push(1.5);
    } else if (
      recipe.answer?.includes("salade simple") ||
      recipe.answer?.includes("rapide facile")
    ) {
      score.push(-1);
    }

    // Timing matches expectation
    const profileTime = {
      "👶 Débutant Total": 30,
      "👨‍🍳 Amateur Cuisine": 60,
      "🔥 Cuisinier Confirmé": 90,
      "👨‍⚖️ Chef Exigeant": 120,
    };
    const maxTime = profileTime[profile.name] || 60;
    if (typeof recipe.timing === "object") {
      const total = (recipe.timing.prep || 0) + (recipe.timing.cook || 0);
      score.push(total <= maxTime ? 1 : -1.5);
    }

    const payScore = score.reduce((a, b) => a + b, 0) / Math.max(1, score.length);
    return payScore >= 0.5 ? "OUI" : payScore >= 0 ? "SEH" : "NON";
  }

  checkIdentity(recipe) {
    // Identité gastronomique forte?
    if (
      recipe.cuisine &&
      (recipe.cuisine.includes("antillaise") ||
        recipe.cuisine.includes("francaise") ||
        recipe.cuisine.includes("asiatique"))
    ) {
      return "FORTE";
    }
    if (recipe.signature && recipe.signature.length > 40) {
      return "PRÉSENTE";
    }
    return "FAIBLE";
  }

  checkTiming(recipe) {
    // Timing plausible?
    if (typeof recipe.timing === "object") {
      const total = (recipe.timing.prep || 0) + (recipe.timing.cook || 0);
      return total > 5 && total < 240;
    }
    const timing = recipe.timing || 0;
    return timing > 5 && timing < 240;
  }

  contentLength(response) {
    const str = typeof response === "string" ? response : JSON.stringify(response);
    return str.length;
  }

  scoreHonestly(analysis, profile) {
    // Score HONNÊTE (pas 10/10 naive)
    let score = 5; // Baseline

    // Appeal (important pour user)
    score += parseFloat(analysis.appealing) * 2;

    // Credibility
    score += parseFloat(analysis.credible) * 1.5;

    // Réalness
    score += analysis.isReal === "OUI" ? 1 : -1;

    // Pas duplicate
    score += analysis.isDuplicate ? -2 : 0.5;

    // Pas generic
    score -= parseFloat(analysis.genericity) * 1.5;

    // Worth paying
    if (analysis.worthPaying === "OUI") score += 1.5;
    else if (analysis.worthPaying === "SEH") score += 0;
    else score -= 1;

    // Identity
    if (analysis.culinaryIdentity === "FORTE") score += 1.5;
    else if (analysis.culinaryIdentity === "PRÉSENTE") score += 0.5;
    else score -= 1;

    // Techniques + depth
    if (analysis.hasTechniques && analysis.hasProTips) score += 0.5;

    // Realistic timing
    score += analysis.timingRealistic ? 0.5 : -0.5;

    // Content depth (riche = mieux)
    if (analysis.contentDepth > 800) score += 0.5;
    if (analysis.contentDepth < 200) score -= 0.5;

    // Profile matching
    if (
      profile.name.includes("Chef") &&
      parseFloat(analysis.credible) < 0.5
    ) {
      score -= 1;
    }
    if (
      profile.name.includes("Débutant") &&
      parseFloat(analysis.appealing) < 1
    ) {
      score -= 0.5;
    }

    return Math.max(0, Math.min(10, score)).toFixed(2);
  }

  getHumanVerdict(score) {
    const s = parseFloat(score);
    if (s >= 9) return "🏆 EXCELLENT - Paierais sans hésiter";
    if (s >= 8) return "✅ BON - Bonne recette";
    if (s >= 7) return "⚠️ ACCEPTABLE - Pas mal";
    if (s >= 6) return "😐 CORRECT - Ça passe";
    if (s >= 5) return "❌ FAIBLE - Bof";
    if (s >= 3) return "💔 MAUVAIS - Non merci";
    return "🚫 NULO - Refus total";
  }

  getReport() {
    const byProfile = {};
    const byQuery = {};
    let avgScore = 0;
    let totalScore = 0;

    this.results.forEach((r) => {
      const score = parseFloat(r.humanScore);
      totalScore += score;
      avgScore = totalScore / this.results.length;

      if (!byProfile[r.userProfile]) {
        byProfile[r.userProfile] = { scores: [], count: 0 };
      }
      byProfile[r.userProfile].scores.push(score);
      byProfile[r.userProfile].count++;

      if (!byQuery[r.query]) {
        byQuery[r.query] = { scores: [], count: 0 };
      }
      byQuery[r.query].scores.push(score);
      byQuery[r.query].count++;
    });

    const duplicates = this.results.filter((r) => r.isDuplicate).length;
    const failures = this.results.filter((r) => parseFloat(r.humanScore) < 6).length;

    return {
      results: this.results,
      byProfile,
      byQuery,
      avgScore: avgScore.toFixed(2),
      duplicates,
      failures,
      seenDishes: Array.from(this.seenDishes),
    };
  }
}

// ============ EXÉCUTION TESTS ============

async function runRealValidation() {
  console.log("\n");
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     VALIDATION RÉELLE - Test Utilisateur Humain Critique       ║",
  );
  console.log(
    "║   Question clé: Est-ce que je paierais pour ça?               ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n",
  );

  try {
    const { askCookingAssistant } = await import(
      path.join(projectRoot, "src/services/aiService.js")
    );

    const validator = new HumanValidator();

    console.log(`👥 4 profils testés × 6 requêtes réalistes = 24 tests humains\n`);

    let testCount = 0;
    const totalTests = REAL_QUERIES.length * 4; // Simplification: tester avec tous profils

    for (const queryDef of REAL_QUERIES) {
      console.log(`\n📝 Query: "${queryDef.query}"`);
      console.log(`   Context: ${queryDef.context}`);
      console.log(`   Reality Check: ${queryDef.realityCheck}\n`);

      for (const [profileKey, profile] of Object.entries(USER_PROFILES)) {
        testCount++;

        try {
          const response = await askCookingAssistant(queryDef.query, [], {
            temperature: 0.7,
            maxTokens: 1000,
            userProfile: profile,
          });

          const analysis = validator.analyzeAsHuman(
            response,
            queryDef.query,
            profile,
          );

          const scoreColor =
            analysis.humanScore >= 8
              ? "🏆"
              : analysis.humanScore >= 6
                ? "✅"
                : "❌";

          console.log(
            `   ${scoreColor} ${profile.name.padEnd(25)} → ${analysis.humanScore}/10 ${analysis.humanVerdict}`,
          );

          if (analysis.isDuplicate) {
            console.log(`      ⚠️  DUPLIKAT: "${analysis.dishName}"`);
          }
          if (analysis.isReal === "SUSPECT") {
            console.log(`      🤔 SUSPECT: Plat n'existe peut-être pas`);
          }
          if (analysis.worthPaying === "NON") {
            console.log(`      💔 NON PAYANT: Pas assez bon pour payer`);
          }
        } catch (err) {
          console.log(`   ❌ ERROR (${profile.name}): ${err.message}`);
        }
      }
    }

    // ============ RAPPORT FINAL ============

    const report = validator.getReport();

    console.log(
      "\n╔════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  VERDICT HONNÊTE UTILISATEUR                   ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝\n",
    );

    console.log("📊 RÉSULTATS GLOBAUX:\n");
    console.log(`  Score moyen HUMAIN:        ${report.avgScore}/10`);
    console.log(
      `  Recettes refusées (<6):    ${report.failures}/${report.results.length}`,
    );
    console.log(
      `  Doublons détectés:         ${report.duplicates}/${report.results.length}`,
    );

    if (report.duplicates > 0) {
      console.log(`  🚨 PROBLÈME: ${report.duplicates} répétitions!`);
    }

    console.log("\n📋 PAR PROFIL UTILISATEUR:\n");

    Object.entries(report.byProfile).forEach(([profile, data]) => {
      const avg = (
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ).toFixed(2);
      const min = Math.min(...data.scores).toFixed(1);
      const max = Math.max(...data.scores).toFixed(1);
      console.log(`  ${profile.padEnd(30)} avg: ${avg}/10 (${min}-${max})`);
    });

    console.log("\n📍 PAR REQUÊTE:\n");

    Object.entries(report.byQuery).forEach(([query, data]) => {
      const avg = (
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ).toFixed(2);
      console.log(`  "${query}" → ${avg}/10 (${data.count} tests)`);
    });

    // Plats vus
    console.log(`\n🍽️  Plats uniques générés: ${report.seenDishes.length}`);
    console.log(`   ${Array.from(report.seenDishes).slice(0, 10).join(", ")}${report.seenDishes.size > 10 ? "..." : ""}`);

    // ============ ANALYSE CRITIQUE FINALE ============

    console.log(
      "\n╔════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                   ANALYSE CRITIQUE FINALE                      ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝\n",
    );

    const failures = report.results.filter((r) => parseFloat(r.humanScore) < 6);
    if (failures.length > 0) {
      console.log("🚫 RECETTES ÉCHOUÉES (score < 6):\n");
      failures.slice(0, 5).forEach((f) => {
        console.log(
          `   "${f.query}" (${f.userProfile}) → ${f.dishName} [${f.humanScore}/10]`,
        );
        if (!f.worthPaying) {
          console.log(`      → Non payant: ${f.worthPaying}`);
        }
        if (f.isReal === "SUSPECT") {
          console.log(`      → Plat suspect (n'existe peut-être pas)`);
        }
      });
      console.log("");
    }

    // Verdict final
    const avgScoreNum = parseFloat(report.avgScore);
    let finalVerdict = "";

    if (avgScoreNum >= 8) {
      finalVerdict = "🏆 EXCELLENT - Prêt production";
    } else if (avgScoreNum >= 7) {
      finalVerdict = "✅ BON - Acceptable";
    } else if (avgScoreNum >= 6) {
      finalVerdict = "⚠️ MOYEN - À améliorer";
    } else {
      finalVerdict = "🚫 FAIBLE - Problèmes sérieux";
    }

    console.log(`📌 VERDICT FINAL: ${finalVerdict}`);
    console.log(`   Score: ${report.avgScore}/10`);

    if (report.duplicates > 0) {
      console.log(`   ⚠️  Doublons: ${report.duplicates} - À corriger`);
    }
    if (report.failures > 0) {
      console.log(
        `   ❌ Échecs: ${report.failures} recettes non-payantes`,
      );
    }

    // Export détaillé
    const fullReport = {
      timestamp: new Date().toISOString(),
      version: "Human-Validator-v1",
      avgScore: parseFloat(report.avgScore),
      verdict: finalVerdict,
      statistics: {
        totalTests: report.results.length,
        passed: report.results.length - report.failures,
        failed: report.failures,
        duplicates: report.duplicates,
        uniqueDishes: report.seenDishes.size,
      },
      byProfile: report.byProfile,
      byQuery: report.byQuery,
      failures: report.results
        .filter((r) => parseFloat(r.humanScore) < 6)
        .map((r) => ({
          query: r.query,
          profile: r.userProfile,
          dish: r.dishName,
          score: r.humanScore,
          issue: !r.worthPaying ? `Non payant (${r.worthPaying})` : "Score bas",
        })),
      detailedResults: report.results,
    };

    const reportPath = path.join(projectRoot, "test_reports", "validation_human.json");
    fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

    console.log(`\n📁 Rapport détaillé: test_reports/validation_human.json\n`);

  } catch (err) {
    console.error("❌ Erreur:", err.message);
    console.error(err.stack);
  }
}

runRealValidation().catch(console.error);
