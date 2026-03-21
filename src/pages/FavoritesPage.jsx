import { useNavigate } from "react-router-dom";
import { PersonalizedFeed } from "../components/PersonalizedFeed";
import { RecipeCard } from "../components/RecipeCard";
import { recordRecipeSeen } from "../services/userMemoryService";

export function FavoritesPage({ favorites, favoriteIds, onToggleFavorite, detectedIngredients }) {
  const navigate = useNavigate();

  function openRecipe(recipe) {
    recordRecipeSeen(recipe);
    navigate(`/recettes/${recipe.id}`, { state: { recipe } });
  }

  if (!favorites.length) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white/80">
          Aucun favori pour le moment. Ajoute des recettes pour y acceder rapidement.
        </section>
        <PersonalizedFeed
          detectedIngredients={detectedIngredients}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onOpenRecipe={openRecipe}
          refreshKey={favorites.length}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {favorites.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favoriteIds.has(recipe.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={openRecipe}
          />
        ))}
      </section>
      <PersonalizedFeed
        detectedIngredients={detectedIngredients}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onOpenRecipe={openRecipe}
        refreshKey={favorites.length}
      />
    </div>
  );
}
