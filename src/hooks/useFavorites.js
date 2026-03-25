import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { recordRecipeLiked } from "../services/userMemoryService";

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage("killagain-food:favorites", []);

  const ids = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  function toggleFavorite(recipe) {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === recipe.id);
      recordRecipeLiked(recipe, !exists);
      if (exists) return prev.filter((item) => item.id !== recipe.id);
      return [recipe, ...prev].slice(0, 30);
    });
  }

  return {
    favorites,
    favoriteIds: ids,
    toggleFavorite,
  };
}
