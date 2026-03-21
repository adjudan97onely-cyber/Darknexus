import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IngredientScanner } from "../components/IngredientScanner";
import { RecipeCard } from "../components/RecipeCard";
import { recommendRecipesFromIngredients } from "../services/aiService";

export function ScannerPage({ favoriteIds, onToggleFavorite, onSetDetectedIngredients }) {
  const [ingredients, setIngredients] = useState([]);
  const navigate = useNavigate();

  const recommendations = useMemo(
    () => recommendRecipesFromIngredients(ingredients, 6),
    [ingredients]
  );

  function handleDetected(nextIngredients) {
    setIngredients(nextIngredients);
    onSetDetectedIngredients(nextIngredients);
  }

  return (
    <div className="space-y-4">
      <IngredientScanner onDetected={handleDetected} />

      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
        <h2 className="text-lg font-bold text-white">Ingredients detectes</h2>
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
            onOpen={(id) => navigate(`/recettes/${id}`)}
          />
        ))}
      </section>
    </div>
  );
}
