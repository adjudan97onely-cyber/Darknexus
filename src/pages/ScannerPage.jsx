import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IngredientScanner } from "../components/IngredientScanner";
import { RecipeCard } from "../components/RecipeCard";
import { recommendRecipesFromIngredients, surpriseBalancedRecipe } from "../services/aiService";

export function ScannerPage({ favoriteIds, onToggleFavorite, onSetDetectedIngredients }) {
  const [ingredients, setIngredients] = useState([]);
  const [cuisineMode, setCuisineMode] = useState("all");
  const navigate = useNavigate();

  const recommendations = useMemo(
    () => recommendRecipesFromIngredients(ingredients, 9, { cuisine: cuisineMode }),
    [ingredients, cuisineMode]
  );

  function handleDetected(nextIngredients) {
    setIngredients(nextIngredients);
    onSetDetectedIngredients(nextIngredients);
  }

  function addSurpriseRecipe() {
    const pick = surpriseBalancedRecipe();
    setIngredients((prev) => [...new Set([...(prev || []), ...(pick.ingredients || []).slice(0, 3)])]);
  }

  return (
    <div className="space-y-4">
      <IngredientScanner onDetected={handleDetected} />

      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
        <h2 className="text-lg font-bold text-white">Ingredients detectes</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={cuisineMode}
            onChange={(event) => setCuisineMode(event.target.value)}
            className="rounded-lg border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white"
          >
            <option value="all">Cuisine intelligente (all)</option>
            <option value="francaise">Cuisine francaise</option>
            <option value="healthy">Healthy</option>
            <option value="rapide">Rapide</option>
            <option value="monde">Cuisine du monde</option>
          </select>
          <button
            onClick={addSurpriseRecipe}
            className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100"
          >
            Surprendre
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(ingredients.length > 0 ? ingredients : ["tomate", "oignon", "poulet"]).map((item) => (
            <span key={item} className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favoriteIds.has(recipe.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={(item) => navigate(`/recettes/${item.id}`, { state: { recipe: item } })}
          />
        ))}
      </section>
    </div>
  );
}
