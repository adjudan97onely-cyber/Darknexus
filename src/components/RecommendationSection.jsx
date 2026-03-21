import { useNavigate } from "react-router-dom";
import { RecipeCard } from "./RecipeCard";

export function RecommendationSection({ title, subtitle, recipes, favoriteIds, onToggleFavorite, onOpenRecipe }) {
  const navigate = useNavigate();

  if (!recipes?.length) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-white/15 bg-white/5 p-4 text-white">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favoriteIds.has(recipe.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={(item) => (onOpenRecipe ? onOpenRecipe(item) : navigate(`/recettes/${item.id}`, { state: { recipe: item } }))}
          />
        ))}
      </div>
    </section>
  );
}
