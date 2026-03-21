import { useMemo } from "react";
import { smartSearchRecipes } from "../services/aiService";

export function useRecipeSearch(query) {
  return useMemo(() => smartSearchRecipes(query), [query]);
}
