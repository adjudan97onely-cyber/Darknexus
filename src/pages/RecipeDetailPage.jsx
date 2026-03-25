import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Share2, Copy, Check, ShoppingCart, Timer, TimerOff, Play, Pause, RotateCcw } from "lucide-react";
import { formatIngredientLine, scaleRecipeForServings } from "../services/aiService";
import { clearRecipeImage, resolveRecipeImage, setRecipeImage } from "../services/recipeImageService";
import { recordRecipeSeen } from "../services/userMemoryService";
import { getRecipeByIdFromAdminLayer } from "../services/adminContentService";
import { addToShoppingList } from "../services/shoppingListService";

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const location = useLocation();
  const [imageVersion, setImageVersion] = useState(0);
  const [servings, setServings] = useState(null);
  const [shareMessage, setShareMessage] = useState(null);
  const [shoppingMessage, setShoppingMessage] = useState(null);

  // --- TIMER STATE ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitialized, setTimerInitialized] = useState(false);
  const timerRef = useRef(null);

  const recipe = useMemo(() => {
    const fromState = location.state?.recipe;
    if (fromState?.id === recipeId) return fromState;
    return getRecipeByIdFromAdminLayer(recipeId);
  }, [recipeId, location.state]);

  // Initialiser servings depuis la recette (ex: 4 pour colombo)
  useEffect(() => {
    if (recipe && servings === null) {
      setServings(recipe.servings || 4);
    }
  }, [recipe, servings]);

  const displayedRecipe = useMemo(() => {
    if (!recipe || servings === null) return null;
    return scaleRecipeForServings(
      {
        ...recipe,
        servings: recipe.servings || 4,
        ingredientsDetailed:
          recipe.ingredientsDetailed ||
          (recipe.ingredients || []).map((line) => {
            const match = line.match(/^(\d+[\d.,/]*)\s*(g|kg|ml|L|cl|c\.\s*[àa]\s*soupe|c\.\s*[àa]\s*cafe|cuilleres?\s*[àa]\s*soupe|cuilleres?\s*[àa]\s*cafe|sachet|pincee|litre|litres)?\s*(.*)$/i);
            if (match) {
              return { quantity: parseFloat(match[1].replace(",", ".")), unit: (match[2] || "").trim(), name: match[3].trim() || line };
            }
            return { name: line, quantity: null, unit: "" };
          }),
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

  // --- SHARE ---
  const shareText = `${displayedRecipe.name}\nPrep: ${displayedRecipe.prepMinutes} min | Cuisson: ${displayedRecipe.cookMinutes} min\n\nIngredients:\n${(displayedRecipe.ingredientsDetailed || []).map(i => formatIngredientLine(i)).join("\n")}\n\n- Killagain Food`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: displayedRecipe.name, text: shareText });
        return;
      } catch (_) { /* user cancelled or not supported */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareMessage("Copie !");
      setTimeout(() => setShareMessage(null), 2000);
    } catch (_) {
      setShareMessage("Erreur copie");
      setTimeout(() => setShareMessage(null), 2000);
    }
  }

  // --- SHOPPING LIST ---
  function handleAddToShoppingList() {
    const items = (displayedRecipe.ingredientsDetailed || []).map(i => formatIngredientLine(i));
    addToShoppingList(displayedRecipe.name, items);
    setShoppingMessage("Ajoute a la liste !");
    setTimeout(() => setShoppingMessage(null), 2500);
  }

  // --- TIMER ---
  const totalCookSeconds = (displayedRecipe.cookMinutes || 0) * 60;

  function startTimer() {
    if (!timerInitialized) {
      setTimerSeconds(totalCookSeconds);
      setTimerInitialized(true);
    }
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(totalCookSeconds);
    setTimerInitialized(false);
  }

  // Timer countdown effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerSeconds]);

  // Play sound when timer reaches 0
  useEffect(() => {
    if (timerInitialized && timerSeconds === 0 && !timerRunning) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.3, 0.6].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.3;
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        });
      } catch (_) { /* no audio context */ }
    }
  }, [timerSeconds, timerInitialized, timerRunning]);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

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

      {/* ACTION BAR: Share + Shopping List */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          {shareMessage ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {shareMessage || "Partager"}
        </button>
        <button
          onClick={handleAddToShoppingList}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"
        >
          {shoppingMessage ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          {shoppingMessage || "Liste de courses"}
        </button>
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

      {/* TIMER CUISINE INTERACTIF */}
      {totalCookSeconds > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-400/5 p-3">
          <Timer className="h-5 w-5 text-amber-300" />
          <span className="text-sm font-bold text-amber-100">Timer cuisson</span>
          <span className={`font-mono text-2xl font-black ${timerInitialized && timerSeconds === 0 ? "animate-pulse text-rose-400" : timerRunning ? "text-emerald-300" : "text-white"}`}>
            {timerInitialized ? formatTime(timerSeconds) : formatTime(totalCookSeconds)}
          </span>
          <div className="flex gap-1.5">
            {!timerRunning ? (
              <button onClick={startTimer} className="rounded-lg bg-emerald-400/20 p-2 text-emerald-200 transition hover:bg-emerald-400/30">
                <Play className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={pauseTimer} className="rounded-lg bg-amber-400/20 p-2 text-amber-200 transition hover:bg-amber-400/30">
                <Pause className="h-4 w-4" />
              </button>
            )}
            <button onClick={resetTimer} className="rounded-lg bg-white/10 p-2 text-white/70 transition hover:bg-white/20">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          {timerInitialized && timerSeconds === 0 && (
            <span className="animate-pulse rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
              Cuisson terminee !
            </span>
          )}
        </div>
      )}

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
