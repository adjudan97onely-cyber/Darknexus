import { useState } from "react";
import { Plus, X } from "lucide-react";

export function IngredientScanner({ onDetected }) {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState([
    "tomate",
    "oignon",
    "poulet",
  ]);

  function handleAdd() {
    if (!input.trim()) return;
    const newIngredients = [...ingredients, input.trim().toLowerCase()];
    setIngredients(newIngredients);
    onDetected(newIngredients);
    setInput("");
  }

  function handleRemove(ing) {
    const newIngredients = ingredients.filter((i) => i !== ing);
    setIngredients(newIngredients);
    onDetected(newIngredients);
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-5">
      <h2 className="text-xl font-bold text-white">Mes ingrédients</h2>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Ajoute un ingrédient..."
          className="flex-1 rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
        />
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 font-bold text-slate-900"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <div
            key={ing}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400/20 px-3 py-1 text-sm text-cyan-100"
          >
            {ing}
            <button
              onClick={() => handleRemove(ing)}
              className="inline-flex hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
