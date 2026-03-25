import { askCookingAssistant } from "../src/services/aiService.js";

const prompts = [
  "Donne-moi un bokit traditionnel",
  "Je veux un colombo de poulet pour 3 personnes",
  "Comment faire un blaff de poisson ?",
  "Recette d'accras facile",
  "Dombré crevettes stp",
  "Un court bouillon antillais",
  "Fais-moi une tarte salée",
  "Je veux une quiche lorraine",
  "Propose une pizza maison",
  "Montre un burger maison propre",
  "Recette de pain au beurre antillais",
];

for (const prompt of prompts) {
  const result = await askCookingAssistant(prompt, { ingredients: [] });
  const firstLine = String(result?.answer || "").split("\n")[0];
  console.log("---");
  console.log(`Q: ${prompt}`);
  console.log(`Title: ${result?.title || "N/A"}`);
  console.log(`Recipe: ${result?.recipe?.name || "N/A"}`);
  console.log(`Answer1: ${firstLine}`);
}
