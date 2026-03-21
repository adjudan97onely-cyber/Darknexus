import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IngredientScanner } from "../components/IngredientScanner";
import { RecipeCard } from "../components/RecipeCard";
import { recommendRecipesFromIngredients, surpriseBalancedRecipe } from "../services/aiService";
import { getCurrentRole, getLimits, hasAccess } from "../services/roleService";
import { recordIngredientsUsage, recordRecipeSeen } from "../services/userMemoryService";

export function ScannerPage({ favoriteIds, onToggleFavorite, onSetDetectedIngredients }) {
  const [ingredients, setIngredients] = useState([]);
  const [cuisineMode, setCuisineMode] = useState("all");
  const [servings, setServings] = useState(2);
  const navigate = useNavigate();
  const role = getCurrentRole();
  const limits = getLimits(role);
  const canScanUnlimited = hasAccess("scanner_unlimited", role);
  const maxResults = Math.min(16, limits.scanResults);

  const cappedIngredients = ingredients.slice(0, limits.scanIngredients);

  const recommendations = useMemo(
    () => recommendRecipesFromIngredients(cappedIngredients, maxResults, { cuisine: cuisineMode, servings }),
    [cappedIngredients, cuisineMode, servings, maxResults]
  );

  function handleDetected(nextIngredients) {
    const capped = nextIngredients.slice(0, limits.scanIngredients);
    setIngredients(capped);
    onSetDetectedIngredients(capped);
    recordIngredientsUsage(capped);
  }

  function addSurpriseRecipe() {
    const pick = surpriseBalancedRecipe();
    setIngredients((prev) => [...new Set([...(prev || []), ...(pick.ingredients || []).slice(0, 3)])]);
  }

  return (
    <div className="space-y-4">
      <IngredientScanner onDetected={handleDetected} />

      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
        <h2 className="text-lg font-bold text-white">Analyse chef des ingredients</h2>
        <p className="mt-1 text-sm text-white/70">Le moteur genere un large panel de recettes coherentes avec portions adaptees et vraies etapes.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={cuisineMode}
            onChange={(event) => setCuisineMode(event.target.value)}
            className="rounded-lg border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white"
          >
            <option value="all">Cuisine intelligente (all)</option>
            <option value="francaise">Cuisine francaise</option>
            <option value="antillaise">Antillaise</option>
            <option value="healthy">Healthy</option>
            <option value="rapide">Rapide</option>
            <option value="monde">Cuisine du monde</option>
          </select>
          <select
            value={servings}
            onChange={(event) => setServings(Number(event.target.value))}
            className="rounded-lg border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((value) => (
              <option key={value} value={value}>{value} personne{value > 1 ? "s" : ""}</option>
            ))}
          </select>
          <button
            onClick={addSurpriseRecipe}
            className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100"
          >
            Surprendre
          </button>
        </div>
        {!canScanUnlimited && (
          <p className="mt-2 text-xs text-amber-200">
            Limite : {limits.scanIngredients} ingredients et {limits.scanResults} recettes avec ton niveau {role}.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {(cappedIngredients.length > 0 ? cappedIngredients : ["tomate", "oignon", "poulet"]).map((item) => (
            <span key={item} className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {recommendations.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favoriteIds.has(recipe.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={(item) => {
              recordRecipeSeen(item);
              navigate(`/recettes/${item.id}`, { state: { recipe: item } });
            }}
          />
        ))}
      </section>
    </div>
  );
}
