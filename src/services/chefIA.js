/**
 * Chef IA - Moteur central pour tous les experts
 * Pilote: Chef Antillais, Nutritioniste, Assistant général
 */

import { getSystemPrompt } from "./prompts.js";

export async function chefIA({ role, input, context = null }) {
  const systemPrompt = getSystemPrompt(role);
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ VITE_OPENAI_API_KEY not configured");
    return "Erreur: Clé API OpenAI manquante. Configure VITE_OPENAI_API_KEY dans .env";
  }

  try {
    // Construire le message utilisateur avec contexte si fourni
    let userMessage = input;
    if (context) {
      userMessage = `Contexte:\n${JSON.stringify(context, null, 2)}\n\nDemande: ${input}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ API Error:", error);
      throw new Error(`API Error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Chef IA Error:", error);
    throw error;
  }
}
