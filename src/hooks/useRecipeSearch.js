import { useMemo } from "react";
import { ALL_RECIPES } from "../data/recipes";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function useRecipeSearch(query = "") {
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return ALL_RECIPES;

    return ALL_RECIPES.filter((recipe) => {
      const haystack = [
        recipe.name,
        (recipe.tags || []).join(" "),
        (recipe.category || ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  return results;
}
