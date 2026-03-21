import { ALL_RECIPES } from "../data/recipes";

function scoreRecipe(recipe, ingredients) {
  const list = ingredients.map((item) => item.toLowerCase());
  const base = recipe.ingredients.join(" ").toLowerCase();
  const matches = list.filter((item) => base.includes(item));
  const ratio = matches.length / Math.max(list.length, 1);
  const speed = Math.max(0, (60 - recipe.prepMinutes - recipe.cookMinutes) / 60);
  return Math.round((ratio * 0.75 + speed * 0.25) * 100);
}

export function recommendRecipesFromIngredients(ingredients, limit = 6) {
  return ALL_RECIPES.map((recipe) => {
    const score = scoreRecipe(recipe, ingredients);
    return {
      ...recipe,
      score,
      matchReason: `Compatibilite ${score}% avec tes ingredients disponibles.`,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function smartSearchRecipes(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_RECIPES;
  return ALL_RECIPES.filter((recipe) => {
    const hay = [
      recipe.name,
      recipe.tags.join(" "),
      recipe.ingredients.join(" "),
      recipe.steps.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export async function askCookingAssistant(question, context = {}) {
  await new Promise((resolve) => setTimeout(resolve, 550));
  const lower = question.toLowerCase();

  if (lower.includes("bokit")) {
    return {
      title: "Plan bokit ultra simple",
      answer:
        "Pour reussir ton bokit: 1) pate souple, 2) repos 45 min, 3) huile chaude mais pas fumante. Ensuite garnis avec ce que tu as deja: jambon, fromage, crudites.",
      actions: ["Voir la fiche Bokit", "Activer mode debutant"],
    };
  }

  const ingredients = context.ingredients || [];
  if (ingredients.length > 0) {
    const top = recommendRecipesFromIngredients(ingredients, 1)[0];
    return {
      title: "Idee immediate avec ton frigo",
      answer: `Avec ${ingredients.join(", ")}, je te conseille ${top.name}. Commence par etape 1 tranquillement, je te guide au fur et a mesure.`,
      actions: ["Voir recette", "Afficher etapes detaillees"],
    };
  }

  return {
    title: "Coach cuisine debutant",
    answer:
      "Dis-moi ce que tu as dans ton frigo (meme en vrac), et je te propose des recettes antillaises et internationales adaptees, sans te demander d'acheter quoi que ce soit.",
    actions: ["Scanner mes ingredients", "Voir recettes rapides"],
  };
}
