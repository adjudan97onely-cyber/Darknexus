/**
 * 🧪 Test du moteur AI Service - Points clés:
 * 1. Agoulou → combine antillaise (sandwich)
 * 2. Gratin → combine française (gratins differents)
 * 3. Accras → combine antillaise (friture)
 * 4. Bokit → combine antillaise (pain frit)
 */

import { askCookingAssistant } from "./src/services/aiService.js";

const testCases = [
  { query: "agoulou", desc: "Sandwich antillais (abats)" },
  { query: "gratin", desc: "Gratin français (plusieurs types)" },
  { query: "accras", desc: "Friture antillaise (morue)" },
  { query: "bokit", desc: "Pain frit guadeloupe" },
];

async function runTests() {
  console.log("🧪 TEST AI SERVICE - Points 7-9\n");
  console.log("═".repeat(70));

  for (const test of testCases) {
    console.log(`\n📍 QUERY: "${test.query}" → ${test.desc}\n`);
    
    try {
      const result = await askCookingAssistant(test.query, {
        userProfile: {
          level: 8,
          dietary: "normal",
          allergies: [],
        },
      });

      // Afficher résultat
      console.log(`✅ Title: ${result.title}`);
      console.log(`📦 Recipes returned: ${result.recipes?.length || 0}`);
      
      if (result.recipes && result.recipes.length > 0) {
        result.recipes.forEach((recipe, idx) => {
          console.log(
            `\n   ${idx + 1}. ${recipe.name} (${recipe.cuisine || "?"}, score: ${recipe.score || "?"})`
          );
        });
      }

      // Check doublons
      const names = result.recipes?.map((r) => r.name) || [];
      const hasDups = names.length !== new Set(names).size;
      console.log(`\n   ⚠️  Doublons? ${hasDups ? "⚠️ OUI" : "✅ Non"}`);

      // Check cohérence cuisine
      const cuisines = result.recipes?.map((r) => r.cuisine) || [];
      const uniqueCuisines = new Set(cuisines);
      console.log(`   🍴 Cuisines: ${[...uniqueCuisines].join(", ")}`);
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }

    console.log(`\n${"─".repeat(70)}`);
  }
}

// Run
runTests().then(() => process.exit(0));
