import { useNavigate } from "react-router-dom";
import { RecipeCard } from "../components/RecipeCard";

export function FavoritesPage({ favorites, favoriteIds, onToggleFavorite }) {
  const navigate = useNavigate();

  if (!favorites.length) {
    return (
      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white/80">
        Aucun favori pour le moment. Ajoute des recettes pour y acceder rapidement.
      </section>
    );
  }

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {favorites.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          isFavorite={favoriteIds.has(recipe.id)}
          onToggleFavorite={onToggleFavorite}
          onOpen={(id) => navigate(`/recettes/${id}`)}
        />
      ))}
    </section>
  );
}
