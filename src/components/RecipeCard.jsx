import { motion } from "framer-motion";
import { Clock3, Heart, Wallet } from "lucide-react";
import { resolveRecipeImage } from "../services/recipeImageService";

const MotionArticle = motion.article;

function DifficultyBadge({ difficulty }) {
  const styles = {
    Facile: "bg-emerald-400/20 text-emerald-100",
    Intermediaire: "bg-amber-300/20 text-amber-100",
    "Avancé": "bg-orange-400/20 text-orange-100",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[difficulty] || "bg-white/10 text-white/80"}`}>
      {difficulty}
    </span>
  );
}

export function RecipeCard({ recipe, onOpen, onToggleFavorite, isFavorite }) {
  const imageSrc = resolveRecipeImage(recipe);
  const totalTime = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) + (recipe.restMinutes || 0);

  return (
    <MotionArticle
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#10131a] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden bg-slate-800">
        <img
          src={imageSrc}
          alt={recipe.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = "/recipes/default.svg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <button
          onClick={() => onToggleFavorite(recipe)}
          className={`absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-md transition-all duration-200 ${
            isFavorite ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
          }`}
          aria-label="toggle favorite"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow-md">
            {recipe.name}
          </h3>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/5 px-2 py-3">
            <Clock3 className="mx-auto mb-1 h-4 w-4 text-amber-300" />
            <p className="text-[11px] uppercase tracking-wide text-white/45">Temps</p>
            <p className="text-sm font-black text-white">{totalTime} min</p>
          </div>

          <div className="rounded-2xl bg-white/5 px-2 py-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-white/45">Niveau</p>
            <DifficultyBadge difficulty={recipe.difficulty} />
          </div>

          <div className="rounded-2xl bg-white/5 px-2 py-3">
            <Wallet className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
            <p className="text-[11px] uppercase tracking-wide text-white/45">Budget</p>
            <p className="text-sm font-black text-white">{recipe.budgetLabel || "Budget moyen"}</p>
          </div>
        </div>

        <button
          onClick={() => onOpen(recipe)}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#f6b332] text-base font-black text-slate-950 shadow-lg transition hover:bg-[#ffc44d] active:scale-[0.98]"
        >
          Voir la recette
        </button>
      </div>
    </MotionArticle>
  );
}
