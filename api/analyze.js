// Vercel Serverless Function — Proxy OpenAI GPT-4o Vision
// Route : POST /api/analyze
// Body : { image: "base64...", mediaType: "image/jpeg", mode: "vision"|"text"|"recipe", input: "..." }

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  try {
    const { image, mediaType, mode, input } = req.body;

    let messages;

    if (mode === "vision" && image) {
      // Analyse d'image
      messages = [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType || "image/jpeg"};base64,${image}` },
          },
          {
            type: "text",
            text: `Tu es un expert en cuisine antillaise et nutritionniste. Analyse cette image et réponds UNIQUEMENT en JSON valide :
{
  "aliments": ["aliment1", "aliment2"],
  "description": "Ce que tu vois en une phrase naturelle",
  "contexte": "cuisine_antillaise ou cuisine_mondiale",
  "possibilites": ["5 idées de ce qu'on peut cuisiner"],
  "conseil_chef": "Un conseil de chef professionnel",
  "valeur_nutritionnelle": "Valeur nutritionnelle principale"
}`,
          },
        ],
      }];
    } else if (mode === "recipe") {
      // Génération de recette
      messages = [{
        role: "user",
        content: `Tu es un chef cuisinier expert en cuisine antillaise et internationale. Génère une recette ultra détaillée pour : "${input}".
Réponds UNIQUEMENT en JSON valide :
{
  "id": "gen-${Date.now()}",
  "name": "Nom exact de la recette",
  "category": "plat ou entree ou dessert ou boisson ou accompagnement",
  "tags": ["tag1", "tag2", "tag3"],
  "image": "",
  "prepMinutes": 15,
  "restMinutes": 0,
  "cookMinutes": 30,
  "difficulty": "Facile ou Intermediaire ou Avance",
  "description": "Description appétissante en 1-2 phrases",
  "ingredients": ["quantité + ingrédient précis"],
  "steps": ["ÉTAPE EN MAJUSCULE : Description détaillée avec techniques."],
  "tips": ["Conseil de chef"],
  "mistakes": ["Erreur courante à éviter"],
  "nutrition": { "kcal": 450, "protein": 25, "carbs": 45, "fat": 18 },
  "source": "ai-generated"
}
Minimum 5 étapes ultra détaillées. Quantités précises en g/ml/unités.`,
      }];
    } else {
      // Analyse texte
      messages = [{
        role: "user",
        content: `Tu es un expert en cuisine antillaise et nutritionniste. L'utilisateur a tapé : "${input}". Réponds UNIQUEMENT en JSON valide :
{
  "aliments": ["aliment1", "aliment2"],
  "description": "Ce que c'est en une phrase naturelle",
  "contexte": "cuisine_antillaise ou cuisine_mondiale",
  "possibilites": ["5 idées de ce qu'on peut cuisiner"],
  "conseil_chef": "Un conseil de chef professionnel",
  "valeur_nutritionnelle": "Valeur nutritionnelle principale"
}`,
      }];
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 2000,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "OpenAI API error", details: errText });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({ raw: text });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
}
