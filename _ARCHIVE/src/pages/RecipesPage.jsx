import { useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";
import { RecipeCard } from "../components/RecipeCard";
import { useRecipeSearch } from "../hooks/useRecipeSearch";

export function RecipesPage({ search, setSearch, favoriteIds, onToggleFavorite }) {
  const navigate = useNavigate();
  const recipes = useRecipeSearch(search);

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
