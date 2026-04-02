import { useState } from "react";
import { Bot, MessageCircleMore, ChefHat, Clock, Flame, Star, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { askCookingAssistant, smartSearchRecipes, ALL_RECIPES } from "../services/aiService";

// ═══════════════════════════════════════════════════════════════
// CHEF IA EXPERT — Génère recettes complètes hors catalogue
// ═══════════════════════════════════════════════════════════════
function generateChefRecipe(question) {
  const q = (question || "").toLowerCase();

  if (q.includes("crepe") || q.includes("crêpe")) {
    return {
      id: "chef-crepes", name: "Crepes francaises classiques", category: "dessert", tags: ["classique", "facile", "dessert"],
      image: "https://source.unsplash.com/600x400/?french-crepes", prepMinutes: 10, cookMinutes: 20, restMinutes: 30, difficulty: "Facile",
      description: "La recette inratable de crepes fines et moelleuses. Repos 30 min obligatoire pour une pate souple.",
      ingredients: ["250 g farine", "4 oeufs entiers", "500 ml lait demi-ecreme", "50 g beurre fondu", "2 c. a soupe sucre", "1 pincee de sel", "1 c. a cafe vanille liquide"],
      steps: [
        "PATE : Dans un grand bol, verse la farine en puits. Casse les 4 oeufs au centre.",
        "MELANGE : Fouette en partant du centre vers l'exterieur pour incorporer la farine progressivement. Pas de grumeaux.",
        "LAIT : Ajoute le lait en 3 fois, en fouettant entre chaque ajout. La pate doit etre fluide comme de la creme liquide.",
        "BEURRE : Incorpore le beurre fondu tiede + sucre + vanille + sel. Melange bien.",
        "REPOS : Film alimentaire, 30 minutes au frigo MINIMUM. C'est la cle des crepes souples.",
        "CUISSON : Poele anti-adhesive a feu moyen-vif. Une FINE couche de beurre. Verse une louche, incline la poele pour etaler.",
        "RETOURNEMENT : Quand les bords se decollent et le dessous est dore (1-2 min), retourne avec une spatule fine.",
        "FINITION : 30 secondes cote 2. Empile sur une assiette chaude. Sucre, Nutella, citron, confiture."
      ],
      tips: ["Repos 30 min = crepes souples. Sans repos = crepes cassantes.", "Poele chaude mais PAS fumante. Sinon les crepes brulent.", "Premiere crepe = toujours ratee. C'est normal."],
      mistakes: ["Feu trop fort : crepes cramees avec centre cru.", "Pas de repos : pate elastique qui se dechire.", "Trop de pate : crepes epaisses au lieu de fines."],
      nutrition: { kcal: 180, protein: 6, carbs: 24, fat: 7 },
    };
  }

  if (q.includes("pasta") || q.includes("bolognaise") || q.includes("bolo")) {
    return {
      id: "chef-pasta-bolo", name: "Pasta bolognaise authentique", category: "plat", tags: ["italien", "viande", "classique"],
      image: "https://source.unsplash.com/600x400/?pasta-bolognese", prepMinutes: 15, cookMinutes: 45, difficulty: "Moyen",
      description: "La vraie bolognaise italienne. Cuisson lente, viande fondante, sauce profonde.",
      ingredients: ["400 g spaghetti ou tagliatelle", "400 g viande hachee boeuf", "1 oignon", "2 gousses ail", "400 g tomates concassees", "2 c. a soupe concentre de tomate", "1 carotte rapee", "1 branche celeri", "100 ml vin rouge (optionnel)", "Huile d'olive, sel, poivre", "Parmesan rape", "Basilic frais"],
      steps: [
        "BASE : Hache fin oignon + ail + carotte + celeri. C'est le soffritto — la base de toute cuisine italienne.",
        "SOFFRITTO : Huile d'olive a feu moyen. Fais revenir 5 minutes jusqu'a ce que l'oignon soit translucide.",
        "VIANDE : Monte le feu. Ajoute la viande hachee. Emiette avec une cuillere. Laisse COLORER sans remuer 3 min.",
        "DEGLACAGE : Vin rouge si tu en as. Laisse evaporer 2 minutes. Sinon, passe a l'etape suivante.",
        "SAUCE : Ajoute tomates concassees + concentre. Sel, poivre. Melange bien.",
        "CUISSON LENTE : Baisse a feu DOUX. Couvercle entrouvert. MINIMUM 30 minutes. Plus c'est long, meilleur c'est.",
        "PATES : Eau bouillante SALEE (10g sel par litre). Cuisson al dente selon le paquet - 1 minute.",
        "ASSEMBLAGE : Egoutte les pates. Verse dans la sauce. Melange 1 minute a feu doux. Parmesan + basilic."
      ],
      tips: ["Ne remue PAS la viande au debut : la reaction de Maillard cree la saveur.", "30 min minimum de cuisson lente. 1h = parfait.", "Eau de cuisson des pates : garde 1 louche pour lier la sauce."],
      mistakes: ["Viande emiettee trop tot : pas de coloration, gout fade.", "Sauce pas assez cuite : acide et liquide.", "Pates trop cuites : molles et sans texture."],
      nutrition: { kcal: 520, protein: 28, carbs: 58, fat: 18 },
    };
  }

  if (q.includes("poulet roti") || q.includes("poulet au four") || q.includes("roast chicken")) {
    return {
      id: "chef-poulet-roti", name: "Poulet roti parfait", category: "plat", tags: ["classique", "viande", "four"],
      image: "https://source.unsplash.com/600x400/?roast-chicken-golden", prepMinutes: 15, cookMinutes: 75, difficulty: "Moyen",
      description: "Peau croustillante, chair juteuse. La technique du beurre sous la peau change tout.",
      ingredients: ["1 poulet entier (1.5 kg)", "80 g beurre pommade", "4 gousses ail", "1 citron", "Thym, romarin frais", "Sel, poivre", "Pommes de terre (optionnel)"],
      steps: [
        "PREPARATION : Sors le poulet 30 min avant. Four a 220°C. Seche le poulet avec du papier absorbant.",
        "BEURRE AROMATISE : Melange beurre pommade + ail ecrase + thym effeuillee + zeste citron + sel + poivre.",
        "SOUS LA PEAU : Decolle delicatement la peau des blancs avec les doigts. Glisse le beurre aromatise sous la peau.",
        "ASSAISONNEMENT : Sel genereux sur toute la surface. Citron coupe en deux dans la cavite.",
        "CUISSON : 220°C pendant 15 min (peau croustillante), puis baisse a 180°C. 20 min par 500g.",
        "ARROSAGE : Toutes les 20 min, arrose avec le jus de cuisson. C'est ca qui fait la peau doree.",
        "TEST : Pique la cuisse — le jus doit etre clair, pas rose. Temperature interne : 75°C.",
        "REPOS : OBLIGATOIRE. 15 minutes sous papier alu avant de decouper. Les jus se redistribuent."
      ],
      tips: ["Poulet SEC avant cuisson = peau croustillante.", "Beurre SOUS la peau = chair juteuse.", "Repos 15 min = difference entre bon et exceptionnel."],
      mistakes: ["Four pas assez chaud au debut : peau molle.", "Pas de repos : jus qui coule partout, viande seche.", "Poulet direct du frigo : cuisson inegale."],
      nutrition: { kcal: 380, protein: 42, carbs: 2, fat: 22 },
    };
  }

  if (q.includes("riz pilaf") || q.includes("riz parfait") || q.includes("cuire du riz")) {
    return {
      id: "chef-riz-pilaf", name: "Riz pilaf parfait", category: "accompagnement", tags: ["basique", "technique", "facile"],
      image: "https://source.unsplash.com/600x400/?pilaf-rice-fluffy", prepMinutes: 5, cookMinutes: 18, difficulty: "Facile",
      description: "Le riz ou chaque grain est separe. Technique pro en 3 etapes.",
      ingredients: ["200 g riz basmati", "400 ml eau ou bouillon", "1 c. a soupe beurre ou huile", "1/2 oignon hache fin", "Sel"],
      steps: [
        "RINCAGE : Rince le riz 3 fois a l'eau froide jusqu'a ce que l'eau soit claire. Ca retire l'amidon.",
        "TORREFACTION : Fais fondre le beurre. Fais revenir l'oignon 2 min. Ajoute le riz SEC. Remue 2 min a feu moyen.",
        "EAU : Verse l'eau bouillante d'un coup. Sel. Le riz doit sursauter.",
        "CUISSON FERMEE : Couvercle. Feu MINIMUM. 12 minutes SANS OUVRIR. Pas de curiosite.",
        "REPOS : Eteins le feu. Laisse reposer 5 min couvercle ferme. Les grains finissent de gonfler.",
        "SERVICE : Egrene a la fourchette. Chaque grain est separe."
      ],
      tips: ["Ratio magique : 1 volume riz = 2 volumes eau.", "JAMAIS remuer pendant la cuisson.", "Rincer = grains separes. Pas rincer = riz collant."],
      mistakes: ["Ouvrir le couvercle pendant la cuisson : vapeur perdue.", "Remuer le riz : active l'amidon = riz collant.", "Trop d'eau : riz en bouillie."],
      nutrition: { kcal: 240, protein: 5, carbs: 48, fat: 4 },
    };
  }

  // Recette générique pour les demandes non reconnues
  return {
    id: "chef-generic", name: question, category: "chef-ia", tags: ["chef-ia", "sur-mesure"],
    image: "https://source.unsplash.com/600x400/?cooking-kitchen-chef", prepMinutes: 15, cookMinutes: 30, difficulty: "Variable",
    description: "Recette generee par le Chef IA. Consulte le catalogue pour des recettes detaillees avec ingredients et etapes.",
    ingredients: ["Consulte la recette dans le catalogue pour les ingredients complets"],
    steps: ["Cette recette n'est pas encore dans notre catalogue detaille.", "Utilise les boutons rapides pour des recettes completes.", "Ou cherche dans le catalogue avec un mot-cle precis."],
    tips: ["Le Chef IA connait les crepes, pasta, poulet roti, riz pilaf et tout le catalogue creole."],
    mistakes: [],
    nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  };
}

// ═══════════════════════════════════════════════════════════════
// CARTE RECETTE COMPLÈTE
// ═══════════════════════════════════════════════════════════════
function RecipeFullCard({ recipe }) {
  const [expanded, setExpanded] = useState(false);
  if (!recipe) return null;

  const totalTime = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) + (recipe.restMinutes || 0);

  return (
    <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-slate-900/80 overflow-hidden">
      {/* En-tête */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-cyan-200 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-amber-300" />
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="mt-1 text-sm text-white/60">{recipe.description}</p>
            )}
          </div>
          <span className="text-xs bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded-lg">{recipe.difficulty}</span>
        </div>

        {/* Métriques */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Prep: {recipe.prepMinutes} min</span>
          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> Cuisson: {recipe.cookMinutes} min</span>
          {recipe.restMinutes > 0 && <span className="flex items-center gap-1">Repos: {recipe.restMinutes} min</span>}
          <span className="font-semibold text-cyan-300">Total: {totalTime} min</span>
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-xs bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Nutrition */}
        {recipe.nutrition && recipe.nutrition.kcal > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-amber-400/10 p-1.5">
              <div className="font-bold text-amber-300">{recipe.nutrition.kcal}</div>
              <div className="text-white/50">kcal</div>
            </div>
            <div className="rounded-lg bg-red-400/10 p-1.5">
              <div className="font-bold text-red-300">{recipe.nutrition.protein}g</div>
              <div className="text-white/50">prot</div>
            </div>
            <div className="rounded-lg bg-blue-400/10 p-1.5">
              <div className="font-bold text-blue-300">{recipe.nutrition.carbs}g</div>
              <div className="text-white/50">gluc</div>
            </div>
            <div className="rounded-lg bg-purple-400/10 p-1.5">
              <div className="font-bold text-purple-300">{recipe.nutrition.fat}g</div>
              <div className="text-white/50">lip</div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton déplier */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-cyan-300 hover:bg-white/5 transition"
      >
        <ArrowRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {expanded ? "Masquer la recette" : "Voir la recette complete"}
      </button>

      {/* Contenu déplié */}
      {expanded && (
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Ingrédients */}
          {recipe.ingredients?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white/80 mb-2 flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-300" /> Ingredients
              </h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span> {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Étapes */}
          {recipe.steps?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white/80 mb-2">Etapes</h4>
              <ol className="space-y-2">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips du chef */}
          {recipe.tips?.length > 0 && (
            <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/20 p-3">
              <h4 className="text-sm font-bold text-emerald-300 mb-1 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" /> Tips du Chef
              </h4>
              {recipe.tips.map((tip, i) => (
                <p key={i} className="text-sm text-emerald-200/80 mt-1">• {tip}</p>
              ))}
            </div>
          )}

          {/* Erreurs à éviter */}
          {recipe.mistakes?.length > 0 && (
            <div className="rounded-xl bg-red-400/10 border border-red-400/20 p-3">
              <h4 className="text-sm font-bold text-red-300 mb-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Erreurs a eviter
              </h4>
              {recipe.mistakes.map((m, i) => (
                <p key={i} className="text-sm text-red-200/80 mt-1">• {m}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ASSISTANT PANEL — Chef IA Expert
// ═══════════════════════════════════════════════════════════════
export function AssistantPanel({ ingredients }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [chefRecipe, setChefRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setChefRecipe(null);
    setResponse(null);
    try {
      // 1. Cherche d'abord dans le catalogue
      const catalogResults = smartSearchRecipes(question);
      if (catalogResults && catalogResults.length > 0) {
        setChefRecipe(catalogResults[0]);
        setResponse({
          title: `Trouvee dans le catalogue : ${catalogResults[0].name}`,
          answer: catalogResults[0].description || "Recette du catalogue Killagain Food.",
          actions: ["Voir recette complete", "Ingredients", "Etapes"],
        });
      } else {
        // 2. Génère une recette Chef IA
        const generated = generateChefRecipe(question);
        if (generated && generated.id !== "chef-generic") {
          setChefRecipe(generated);
          setResponse({
            title: `Chef IA : ${generated.name}`,
            answer: generated.description,
            actions: ["Recette du Chef IA", "Hors catalogue"],
          });
        } else {
          // 3. Dernier recours : assistant conversationnel
          const result = await askCookingAssistant(question, { ingredients });
          setResponse(result);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function quickAsk(value) {
    setQuestion(value);
    setLoading(true);
    setChefRecipe(null);
    setResponse(null);
    setTimeout(() => {
      const catalogResults = smartSearchRecipes(value);
      if (catalogResults && catalogResults.length > 0) {
        setChefRecipe(catalogResults[0]);
        setResponse({
          title: `${catalogResults[0].name}`,
          answer: catalogResults[0].description || "Recette du catalogue.",
          actions: catalogResults[0].tags?.slice(0, 4) || [],
        });
      } else {
        const generated = generateChefRecipe(value);
        setChefRecipe(generated);
        setResponse({
          title: `Chef IA : ${generated.name}`,
          answer: generated.description,
          actions: ["Chef IA", "Recette generee"],
        });
      }
      setLoading(false);
    }, 300);
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <ChefHat className="h-6 w-6 text-amber-300" />
        Chef IA Expert
      </h2>
      <p className="mt-1 text-sm text-white/70">
        Recettes completes avec ingredients, etapes, tips et erreurs a eviter. Catalogue creole + recettes universelles.
      </p>

      {/* Barre de recherche */}
      <div className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          className="flex-1 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          placeholder="Tape une recette... (bokit, crepes, colombo, pasta...)"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-300 transition"
        >
          <MessageCircleMore className="h-4 w-4" />
          {loading ? "..." : "Chercher"}
        </button>
      </div>

      {/* Boutons rapides - Catalogue créole */}
      <div className="mt-3">
        <p className="text-xs text-white/40 mb-1.5">Catalogue creole :</p>
        <div className="flex flex-wrap gap-2">
          {["Bokit poulet creole", "Colombo de poulet", "Accras de morue", "Blaff de poisson", "Dombre crevettes"].map((item) => (
            <button
              key={item}
              onClick={() => quickAsk(item)}
              className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Boutons rapides - Chef IA (hors catalogue) */}
      <div className="mt-2">
        <p className="text-xs text-white/40 mb-1.5">Chef IA universel :</p>
        <div className="flex flex-wrap gap-2">
          {["Crepes francaises", "Poulet roti", "Pasta bolognaise", "Riz pilaf"].map((item) => (
            <button
              key={item}
              onClick={() => quickAsk(item)}
              className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-300/20 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Réponse texte */}
      {response && !chefRecipe && (
        <article className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/90">
          <h3 className="font-bold text-cyan-200">{response.title}</h3>
          <p className="mt-2">{response.answer}</p>
          {response.actions?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {response.actions.map((item) => (
                <span key={item} className="rounded-full bg-cyan-400/25 px-2 py-1 text-xs text-cyan-100">{item}</span>
              ))}
            </div>
          )}
        </article>
      )}

      {/* Carte recette complète */}
      {chefRecipe && <RecipeFullCard recipe={chefRecipe} />}
    </section>
  );
}
