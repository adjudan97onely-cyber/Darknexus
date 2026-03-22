import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { formatIngredientLine, scaleRecipeForServings } from "../services/aiService";
import { clearRecipeImage, resolveRecipeImage, setRecipeImage } from "../services/recipeImageService";
import { recordRecipeSeen } from "../services/userMemoryService";
import { getRecipeByIdFromAdminLayer } from "../services/adminContentService";

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const location = useLocation();
  const [imageVersion, setImageVersion] = useState(0);
  const [servings, setServings] = useState(2);

  const recipe = useMemo(() => {
    const fromState = location.state?.recipe;
    if (fromState?.id === recipeId) return fromState;
    return getRecipeByIdFromAdminLayer(recipeId);
  }, [recipeId, location.state]);

  const displayedRecipe = useMemo(() => {
    if (!recipe) return null;
    return scaleRecipeForServings(
      {
        ...recipe,
        servings: recipe.servings || 2,
        ingredientsDetailed:
          recipe.ingredientsDetailed ||
          (recipe.ingredients || []).map((line) => ({
            name: line,
            quantity: 1,
            unit: "portion",
          })),
      },
      servings
    );
  }, [recipe, servings]);

  useEffect(() => {
    if (recipe) recordRecipeSeen(recipe);
  }, [recipe]);

  if (!displayedRecipe) {
    return (
      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white">
        Recette introuvable. <Link to="/recettes" className="underline">Retour aux recettes</Link>
      </section>
    );
  }

  const imageSrc = resolveRecipeImage(displayedRecipe);

  function onUploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRecipeImage(recipe.id, reader.result);
        setImageVersion((v) => v + 1);
      }
    };
    reader.readAsDataURL(file);
  }

  function resetPhoto() {
    clearRecipeImage(displayedRecipe.id);
    setImageVersion((v) => v + 1);
  }

  return (
    <article className="space-y-4 rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white">
      <img
        key={imageVersion}
        src={imageSrc}
        alt={displayedRecipe.name}
        className="h-64 w-full rounded-xl object-cover"
        onError={(event) => {
          event.currentTarget.src = "/recipes/default.svg";
        }}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-white/5 p-3 text-sm">
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-cyan-300 px-3 py-2 font-semibold text-slate-900">
          Remplacer la photo
          <input type="file" accept="image/*" className="hidden" onChange={onUploadFile} />
        </label>
        <button
          onClick={resetPhoto}
          className="rounded-lg border border-white/30 px-3 py-2 font-semibold text-white"
        >
          Revenir a la photo par defaut
        </button>
        <span className="text-white/70">Astuce: mets tes vraies photos plat par plat ici.</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{displayedRecipe.name}</h1>
          <p className="mt-1 text-sm text-white/80">Cuisine: {displayedRecipe.cuisine || "signature"} • Style: {displayedRecipe.style || "maison"}</p>
        </div>
        <label className="text-sm font-semibold text-white/90">
          Portions
          <select
            value={servings}
            onChange={(event) => setServings(Number(event.target.value))}
            className="ml-3 rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2 text-white"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((value) => (
              <option key={value} value={value}>{value} personne{value > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-white/80">
        Difficulte: {displayedRecipe.difficulty} | Prep: {displayedRecipe.prepMinutes} min | Repos: {displayedRecipe.restMinutes} min | Cuisson: {displayedRecipe.cookMinutes} min
      </p>

      <section>
        <h2 className="text-xl font-bold">Ingredients precis pour {displayedRecipe.servings} personne{displayedRecipe.servings > 1 ? "s" : ""}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-white/90">
          {(displayedRecipe.ingredientsDetailed || []).map((item, index) => (
            <li key={`${item.name}-${index}`}>{formatIngredientLine(item)}</li>
          ))}
        </ul>
      </section>

      {(displayedRecipe.variationOptions?.length || displayedRecipe.variants?.length) ? (
        <section className="rounded-xl bg-white/5 p-3">
          <h2 className="text-xl font-bold">Variantes possibles</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-white/90">
            {[...(displayedRecipe.variationOptions || []), ...(displayedRecipe.variants || [])]
              .filter((item, index, all) => all.indexOf(item) === index)
              .slice(0, 5)
              .map((item) => (
                <li key={item}>{item}</li>
              ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-xl font-bold">Etapes ultra detaillees</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-white/90">
          {displayedRecipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3">
          <h3 className="font-bold text-emerald-200">Conseils pratiques</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-white/85">
            {displayedRecipe.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <h3 className="font-bold text-rose-200">Erreurs a eviter</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-white/85">
            {displayedRecipe.mistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl bg-white/5 p-3 text-sm text-white/85">
        Nutrition approx: {displayedRecipe.nutrition.kcal} kcal | P {displayedRecipe.nutrition.protein} g | G {displayedRecipe.nutrition.carbs} g | L {displayedRecipe.nutrition.fat} g
      </section>

      <Link to="/recettes" className="inline-flex rounded-xl bg-amber-300 px-4 py-2 font-bold text-slate-900">
        Retour aux recettes
      </Link>
    </article>
  );
}
