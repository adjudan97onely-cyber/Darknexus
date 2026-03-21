import { motion } from "framer-motion";
import { Clock3, Flame, Heart, Star } from "lucide-react";
import { getCurrentRole, hasAccess } from "../services/roleService";
import { resolveRecipeImage } from "../services/recipeImageService";
import { UpgradeBadge } from "./FeatureGate";

const MotionArticle = motion.article;

function CoachHint({ lines }) {
  if (!lines?.length) return null;
  return (
    <div className="space-y-1 rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-2 text-xs text-cyan-50">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export function RecipeCard({ recipe, onOpen, onToggleFavorite, isFavorite }) {
  const imageSrc = resolveRecipeImage(recipe);
  const totalTime = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) + (recipe.restMinutes || 0);

  return (
    <MotionArticle
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 shadow-lg"
    >
      <img
        src={imageSrc}
        alt={recipe.name}
        className="h-44 w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = "/recipes/default.svg";
        }}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-white">{recipe.name}</h3>
          <button
            onClick={() => onToggleFavorite(recipe)}
            className={`rounded-full p-2 ${isFavorite ? "bg-rose-500/90 text-white" : "bg-white/10 text-white"}`}
            aria-label="toggle favorite"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-white/85">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            <Star className="h-3 w-3" />
            {recipe.score ?? 92}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            <Clock3 className="h-3 w-3" />
            {totalTime} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            <Flame className="h-3 w-3" />
            {recipe.nutrition.kcal} kcal
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            {recipe.servings || 2} pers
          </span>
          {recipe.cuisine ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2 py-1 text-amber-100">{recipe.cuisine}</span> : null}
        </div>

        <p className="text-sm text-white/80">{recipe.matchReason || "Recette detaillee generee intelligemment selon tes ingredients."}</p>
        {recipe.coachExplanations?.length && hasAccess("coach_explanations", getCurrentRole()) ? (
          <CoachHint lines={recipe.coachExplanations} />
        ) : recipe.coachExplanations?.length ? (
          <UpgradeBadge feature="coach_explanations" />
        ) : null}
        <p className="text-xs text-white/60">
          {recipe.difficulty} • P {recipe.nutrition.protein} g • G {recipe.nutrition.carbs} g • L {recipe.nutrition.fat} g
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onOpen(recipe)}
            className="flex-1 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
          >
            Voir recette
          </button>
          <button
            onClick={() => onOpen(recipe)}
            className="flex-1 rounded-xl border border-white/30 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Etapes detaillees
          </button>
        </div>
      </div>
    </MotionArticle>
  );
}
