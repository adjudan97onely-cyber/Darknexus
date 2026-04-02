import { useState, useMemo } from "react";
import { CREOLE_RECIPES } from "../data/recipes";
import { ALL_RECIPES } from "../data/recipes";

export function useRecipeSearch(searchTerm = "") {
  // Si pas de recherche, retourner toutes les recettes avec CREOLE en priorité
  if (!searchTerm || searchTerm.trim().length === 0) {
    return ALL_RECIPES;
  }

  // Sinon, filtrer par terme de recherche (priorité aux CREOLE_RECIPES)
  const lowerSearch = searchTerm.toLowerCase();

  const creoleMatches = CREOLE_RECIPES.filter((recipe) => {
    const matchName = recipe.name.toLowerCase().includes(lowerSearch);
    const matchCategory = recipe.category.toLowerCase().includes(lowerSearch);
    const matchTags = recipe.tags.some((tag) =>
      tag.toLowerCase().includes(lowerSearch)
    );
    const matchIngredients = recipe.ingredients.some((ing) =>
      ing.toLowerCase().includes(lowerSearch)
    );
    return matchName || matchCategory || matchTags || matchIngredients;
  });

  const otherMatches = ALL_RECIPES.filter(
    (recipe) =>
      !CREOLE_RECIPES.find((cr) => cr.id === recipe.id) &&
      (recipe.name.toLowerCase().includes(lowerSearch) ||
        recipe.category.toLowerCase().includes(lowerSearch) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(lowerSearch)) ||
        recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(lowerSearch)
        ))
  );

  return [...creoleMatches, ...otherMatches];
}
