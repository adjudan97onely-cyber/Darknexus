interface ImageRecipeLike {
  id?: string;
  name?: string;
  style?: string;
  image?: string;
  imagePrompt?: string;
  cuisine?: string;
  cookingMethod?: string;
  primaryProtein?: string;
  ingredients?: string[];
}

function normalizeQuery(value: unknown): string {
  return String(value || "food")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deterministicSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 9999);
}

export function buildRecipeImageQuery(recipe: ImageRecipeLike): string {
  const protein = recipe?.primaryProtein || recipe?.ingredients?.[0] || "dish";
  const vegetables = (recipe?.ingredients || []).slice(0, 3).join(" and ") || "vegetables";
  const method = recipe?.cookingMethod || "plated";
  const cuisine = recipe?.cuisine || "chef";
  const style = recipe?.style || "restaurant plating";
  const base = recipe?.imagePrompt || `${method} ${protein} with ${vegetables} plated gourmet ${cuisine} ${style}`;
  return normalizeQuery(base);
}

export function buildRecipeImageUrl(recipe: ImageRecipeLike): string {
  const query = buildRecipeImageQuery(recipe);
  const seed = deterministicSeed(`${recipe?.id || "recipe"}-${query}`);
  const encoded = encodeURIComponent(`${query},professional food photography,high detail,restaurant plate,close up`);
  return `https://source.unsplash.com/960x720/?${encoded}&sig=${seed}`;
}

export function resolveRecipeImage(recipe: ImageRecipeLike, getLocalOverride?: (recipeId?: string) => string): string {
  if (typeof getLocalOverride === "function") {
    const local = getLocalOverride(recipe?.id);
    if (local) return local;
  }
  return recipe?.image || buildRecipeImageUrl(recipe);
}
