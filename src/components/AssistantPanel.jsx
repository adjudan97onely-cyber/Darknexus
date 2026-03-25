import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, MessageCircleMore } from "lucide-react";
import { askCookingAssistant } from "../services/aiService";
import { RecipeCard } from "./RecipeCard";
import { useFavorites } from "../hooks/useFavorites";

export function AssistantPanel({ ingredients }) {
  const navigate = useNavigate();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const result = await askCookingAssistant(question, { ingredients });
      setResponse(result);
    } finally {
      setLoading(false);
    }
  }

  async function quickAsk(value) {
    setQuestion(value);
    setLoading(true);
    try {
      const result = await askCookingAssistant(value, { ingredients });
      setResponse(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <Bot className="h-5 w-5 text-cyan-300" />
        Assistant IA pedagogique
      </h2>
      <p className="mt-1 text-sm text-white/70">Pose ta question cuisine, reponse claire niveau debutant.</p>

      <div className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="flex-1 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
          placeholder="Comment faire un bokit ?"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 font-bold text-slate-900"
        >
          <MessageCircleMore className="h-4 w-4" />
          {loading ? "..." : "Demander"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => quickAsk("active le mode chef ia")}
          className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100"
        >
          Mode Chef IA
        </button>
        <button
          onClick={() => quickAsk("surprends moi")}
          className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100"
        >
          Surprendre
        </button>
      </div>

      {response ? (
        <article className="mt-4 space-y-4 rounded-xl border border-white/20 bg-white/5 p-3">
          <div>
            <h3 className="font-bold text-cyan-200">{response.title}</h3>
            <p className="mt-2 text-sm text-white/90">{response.answer}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {response.actions?.map((item) => (
                <span key={item} className="rounded-full bg-cyan-400/25 px-2 py-1 text-xs text-cyan-100">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* 🎯 AFFICHER LES RECETTES EN CARTES */}
          {response.recipes && response.recipes.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-white/60">Recettes correspondantes:</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {response.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favoriteIds.has(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpen={(item) => navigate(`/recettes/${item.id}`, { state: { recipe: item } })}
                  />
                ))}
              </div>
            </div>
          )}
        </article>
      ) : null}
    </section>
  );
}
