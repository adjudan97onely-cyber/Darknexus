import { useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";
import { RecipeCard } from "../components/RecipeCard";
import { UpgradeBadge } from "../components/FeatureGate";
import { useRecipeSearch } from "../hooks/useRecipeSearch";
import { capRecipes, getCurrentRole, getLimits, hasAccess } from "../services/roleService";

export function RecipesPage({ search, setSearch, favoriteIds, onToggleFavorite }) {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const allRecipes = useRecipeSearch(search);
  const recipes = capRecipes(allRecipes, role);
  const hasMore = allRecipes.length > recipes.length;
  const limits = getLimits(role);

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />

      <section className="rounded-3xl border border-white/15 bg-white/5 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Bibliotheque culinaire intelligente</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/75">
              Recettes detaillees, portions adaptables, logique chef, nutrition visible et panel elargi pour comparer plusieurs assiettes professionnelles.
            </p>
          </div>
          {!hasAccess("recipes_unlimited", role) && (
            <UpgradeBadge feature="recipes_unlimited" />
          )}
        </div>
        {!hasAccess("recipes_unlimited", role) && (
          <p className="mt-2 text-xs text-amber-200">
            Affichage limite a {limits.recipes} recettes avec ton niveau actuel.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favoriteIds.has(recipe.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={(item) => navigate(`/recettes/${item.id}`, { state: { recipe: item } })}
          />
        ))}
      </section>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-300/25 bg-slate-950/60 p-4 text-center">
          <p className="text-sm font-semibold text-white/90">
            + {allRecipes.length - recipes.length} recettes supplementaires disponibles en Premium.
          </p>
          <UpgradeBadge feature="recipes_unlimited" />
        </div>
      )}
    </div>
  );
}
