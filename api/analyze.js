// api/analyze.js — Vercel Serverless Function
// Proxy sécurisé pour OpenAI Vision API (évite le blocage CORS)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env["CLÉ_API_OPENAI"] || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  try {
    const { type, image, mediaType, text } = req.body;
    let body;

    if (type === "vision" && image) {
      // Analyse d'image avec GPT-4 Vision
      body = {
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType || "image/jpeg"};base64,${image}`, detail: "high" },
            },
            {
              type: "text",
              text: `Regarde cette image TRÈS attentivement. Identifie EXACTEMENT ce que tu vois. Réponds UNIQUEMENT en JSON valide :
{
  "aliments": ["liste EXACTE de ce que tu vois - sois littéral et précis"],
  "description": "Décris EXACTEMENT ce que montre la photo, rien d'autre",
  "contexte": "cuisine_antillaise ou cuisine_mondiale",
  "possibilites": ["5 recettes réalistes avec ces aliments exacts"],
  "conseil_chef": "Conseil professionnel sur ces aliments précis",
  "valeur_nutritionnelle": "Valeur nutritionnelle principale"
}
RÈGLES STRICTES :
- Si c'est du PAIN ou de la BRIOCHE, dis "pain" ou "brioche", pas "poulet"
- Si c'est DORÉ au four, ce n'est pas forcément de la viande
- Regarde la TEXTURE, la FORME et le CONTEXTE (plaque de cuisson = boulangerie)
- Ne devine PAS, décris ce que tu VOIS réellement
- En cas de doute, dis "aliment non identifié avec certitude"`,
            },
          ],
        }],
      };
    } else if (type === "text") {
      // Coach nutrition / Assistant
      body = {
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [{
          role: "system",
          content: "Tu es un expert en cuisine antillaise ET nutritionniste professionnel pour l'app Killagain Food. Réponds toujours en JSON valide sans texte avant ou après.",
        }, {
          role: "user",
          content: text,
        }],
      };
    } else {
      return res.status(400).json({ error: "Type invalide" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Erreur API" });
    }

    // Retourne dans le même format que l'API Anthropic pour compatibilité
    const text_response = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({
      content: [{ type: "text", text: text_response }]
    });

  } catch (err) {
    console.error("Erreur proxy:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
