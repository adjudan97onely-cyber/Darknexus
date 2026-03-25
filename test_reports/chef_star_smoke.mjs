import { fileURLToPath } from "url";
import path from "path";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Queries to test Chef Star engine 
const testQueries = [
  "Bokit traditionnel pour 2 personnes",
  "Colombo de poulet 4 personnes", 
  "Pizza margherita en 30 minutes",
  "Recette facile avec poulet",
  "Que puis-je faire avec oeuf tomate oignon"
];

async function runSmokeTest() {
  console.log("🍽️ Chef Étoilé (Niveau 10) - SMOKE TEST\n");
  
  const server = await createServer({
    root: projectRoot,
    logLevel: "silent"
  });
  
  await server.pluginContainer.buildStart();
  
  try {
    // Load the service module
    const { askCookingAssistant, getChefLevel } = await import(
      path.join(projectRoot, "src/services/aiService.js")
    );
    
    console.log(`📊 Current Chef Level: ${getChefLevel()}\n`);
    
    for (const query of testQueries) {
      console.log(`📝 Query: "${query}"`);
      try {
        const response = await askCookingAssistant(query, [], {
          temperature: 0.7,
          maxTokens: 500,
        });
        
        const responseStr = typeof response === "object" 
          ? JSON.stringify(response, null, 2) 
          : String(response);
        
        // Check for Chef Star indicators
        const isChefStar = responseStr.includes("✦") || 
                          responseStr.includes("Signature") ||
                          responseStr.includes("CHEF ÉTOILÉ");
        
        if (isChefStar) {
          console.log("✅ Chef Star response detected");
        } else {
          console.log("⚠️ Standard response (fallback)");
        }
        
        // Show first 200 chars of response
        console.log(`   Response preview: ${responseStr.substring(0, 200)}...`);
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
      console.log("");
    }
    
    console.log("🎉 Smoke test complete");
  } finally {
    await server.close();
  }
}

runSmokeTest().catch(console.error);
