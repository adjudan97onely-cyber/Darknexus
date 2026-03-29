import { useState } from "react";
import { Bot, MessageCircleMore } from "lucide-react";
import { askCookingAssistant } from "../services/aiService";

export function AssistantPanel({ ingredients }) {
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
        <article className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/90">
          <h3 className="font-bold text-cyan-200">{response.title}</h3>
          <p className="mt-2">{response.answer}</p>
          
          {/* Affichage détaillé de la recette trouvée */}
          {response.recipe ? (
            <div className="mt-3 rounded-lg bg-slate-900/50 p-3 border border-cyan-400/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-cyan-300">{response.recipe.category}</span>
                <span className="text-xs bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded">{response.recipe.difficulty}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>⏱️ Prep: {response.recipe.prepMinutes + (response.recipe.restMinutes || 0)} min</div>
                <div>🔥 Cuisson: {response.recipe.cookMinutes} min</div>
              </div>
              {response.recipe.tags && response.recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {response.recipe.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          
          <div className="mt-3 flex flex-wrap gap-2">
            {response.actions.map((item) => (
              <span key={item} className="rounded-full bg-cyan-400/25 px-2 py-1 text-xs text-cyan-100">
                {item}
              </span>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
