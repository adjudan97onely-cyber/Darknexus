import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ALL_RECIPES } from "../data/recipes";
import { clearRecipeImage, resolveRecipeImage, setRecipeImage } from "../services/recipeImageService";

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const location = useLocation();
  const [imageVersion, setImageVersion] = useState(0);

  const recipe = useMemo(() => {
    const fromState = location.state?.recipe;
    if (fromState?.id === recipeId) return fromState;
    return ALL_RECIPES.find((item) => item.id === recipeId);
  }, [recipeId, location.state]);

  if (!recipe) {
    return (
      <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white">
        Recette introuvable. <Link to="/recettes" className="underline">Retour aux recettes</Link>
      </section>
    );
  }

  const imageSrc = resolveRecipeImage(recipe);

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
    clearRecipeImage(recipe.id);
    setImageVersion((v) => v + 1);
  }

  return (
    <article className="space-y-4 rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white">
      <img
        key={imageVersion}
        src={imageSrc}
        alt={recipe.name}
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
      <h1 className="text-3xl font-black">{recipe.name}</h1>
      <p className="text-sm text-white/80">
        Difficulte: {recipe.difficulty} | Prep: {recipe.prepMinutes} min | Repos: {recipe.restMinutes} min | Cuisson: {recipe.cookMinutes} min
      </p>

      <section>
        <h2 className="text-xl font-bold">Ingredients</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-white/90">
          {recipe.ingredients.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">Etapes ultra detaillees</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-white/90">
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3">
          <h3 className="font-bold text-emerald-200">Conseils pratiques</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-white/85">
            {recipe.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <h3 className="font-bold text-rose-200">Erreurs a eviter</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-white/85">
            {recipe.mistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl bg-white/5 p-3 text-sm text-white/85">
        Nutrition approx: {recipe.nutrition.kcal} kcal | P {recipe.nutrition.protein} g | G {recipe.nutrition.carbs} g | L {recipe.nutrition.fat} g
      </section>

      <Link to="/recettes" className="inline-flex rounded-xl bg-amber-300 px-4 py-2 font-bold text-slate-900">
        Retour aux recettes
      </Link>
    </article>
  );
}
