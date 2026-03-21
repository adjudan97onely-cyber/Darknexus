import { useState } from "react";
import {
  addManualRecipe,
  autoCorrectRecipe,
  deleteRecipeForAdmin,
  getAdminContent,
  getAdminRecipeInventory,
  restoreRecipeForAdmin,
  setCombinationBlacklist,
  setIngredientBlacklist,
  updateRecipeContent,
} from "../services/adminContentService";

function linesToText(lines = []) {
  return (lines || []).join("\n");
}

function combosToText(combos = []) {
  return (combos || []).map((parts) => parts.join(" + ")).join("\n");
}

export function AdminPage() {
  const [inventory, setInventory] = useState(() => getAdminRecipeInventory());
  const [adminContent, setAdminContent] = useState(() => getAdminContent());
  const [selectedId, setSelectedId] = useState(() => getAdminRecipeInventory()[0]?.id || "");

  const selectedRecipe = inventory.find((item) => item.id === selectedId) || inventory[0] || null;

  const [editName, setEditName] = useState(selectedRecipe?.name || "");
  const [editIngredients, setEditIngredients] = useState(linesToText(selectedRecipe?.ingredients || []));
  const [editSteps, setEditSteps] = useState(linesToText(selectedRecipe?.steps || []));
  const [editImage, setEditImage] = useState(selectedRecipe?.image || "");

  const [newName, setNewName] = useState("");
  const [newIngredients, setNewIngredients] = useState("");
  const [newSteps, setNewSteps] = useState("");
  const [newImage, setNewImage] = useState("");

  const [ingredientBlacklist, setIngredientBlacklistText] = useState((adminContent.blacklistedIngredients || []).join("\n"));
  const [comboBlacklist, setComboBlacklistText] = useState(combosToText(adminContent.blacklistedCombinations || []));

  function syncEditor(recipe) {
    setEditName(recipe?.name || "");
    setEditIngredients(linesToText(recipe?.ingredients || []));
    setEditSteps(linesToText(recipe?.steps || []));
    setEditImage(recipe?.image || "");
  }

  function onSelectRecipe(recipe) {
    setSelectedId(recipe.id);
    syncEditor(recipe);
  }

  function refresh(nextSelectedId = selectedId, syncSelected = true) {
    const nextInventory = getAdminRecipeInventory();
    const nextAdminContent = getAdminContent();
    const nextSelectedRecipe = nextInventory.find((item) => item.id === nextSelectedId) || nextInventory[0] || null;

    setInventory(nextInventory);
    setAdminContent(nextAdminContent);
    setSelectedId(nextSelectedRecipe?.id || "");

    if (syncSelected) {
      syncEditor(nextSelectedRecipe);
    }
  }

  function saveEdition() {
    if (!selectedRecipe?.id) return;
    updateRecipeContent(selectedRecipe.id, {
      name: editName,
      ingredients: editIngredients.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      steps: editSteps.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      image: editImage,
    });
    refresh(selectedRecipe.id, false);
  }

  function addManual() {
    if (!newName.trim()) return;
    addManualRecipe({
      name: newName,
      ingredients: newIngredients.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      steps: newSteps.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      image: newImage,
      cuisine: "all",
      style: "admin",
    });
    setNewName("");
    setNewIngredients("");
    setNewSteps("");
    setNewImage("");
    refresh(selectedId, false);
  }

  function saveQualityRules() {
    setIngredientBlacklist(ingredientBlacklist);
    setCombinationBlacklist(comboBlacklist);
    refresh(selectedId, false);
  }

  return (
    <div className="space-y-4 text-white">
      <section className="rounded-3xl border border-white/20 bg-slate-950/70 p-4">
        <h1 className="text-2xl font-black">Admin local - controle contenu</h1>
        <p className="mt-2 text-sm text-white/75">
          Edite, corrige, supprime et enrichis les recettes sans modifier le moteur. Toutes les regles sont appliquees localement.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px,1fr]">
        <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/20 bg-slate-950/70 p-3">
          <h2 className="mb-3 text-lg font-bold">Inventaire recettes ({inventory.length})</h2>
          <div className="space-y-2">
            {inventory.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${selectedId === recipe.id ? "border-amber-300 bg-amber-300/10" : "border-white/15 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{recipe.name}</p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">{recipe.source || "base"}</span>
                </div>
                <p className="mt-1 text-xs text-white/70">{recipe.id}</p>
                {recipe.deleted ? <p className="mt-1 text-xs text-rose-300">Supprimee</p> : null}
                {recipe.qualityFlags?.length ? <p className="mt-1 text-xs text-amber-200">A verifier: {recipe.qualityFlags.join(", ")}</p> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
            <h2 className="text-lg font-bold">Gestion recette</h2>
            {!selectedRecipe ? (
              <p className="mt-2 text-sm text-white/70">Aucune recette selectionnee.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-semibold">
                  Nom
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Ingredients (1 ligne = 1 ingredient)
                  <textarea value={editIngredients} onChange={(e) => setEditIngredients(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Etapes (1 ligne = 1 etape)
                  <textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)} rows={6} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">
                  URL image
                  <input value={editImage} onChange={(e) => setEditImage(e.target.value)} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button onClick={saveEdition} className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-slate-900">Enregistrer modifications</button>
                  <button onClick={() => { autoCorrectRecipe(selectedRecipe.id); refresh(selectedRecipe.id); }} className="rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100">Corriger incoherences</button>
                  {!selectedRecipe.deleted ? (
                    <button onClick={() => { deleteRecipeForAdmin(selectedRecipe.id); refresh(selectedRecipe.id); }} className="rounded-xl border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100">Supprimer recette</button>
                  ) : (
                    <button onClick={() => { restoreRecipeForAdmin(selectedRecipe.id); refresh(selectedRecipe.id); }} className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">Restaurer recette</button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
            <h2 className="text-lg font-bold">Ajout manuel</h2>
            <div className="mt-3 space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom recette" className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              <textarea value={newIngredients} onChange={(e) => setNewIngredients(e.target.value)} placeholder="Ingredients (1 ligne = 1 ingredient)" rows={4} className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              <textarea value={newSteps} onChange={(e) => setNewSteps(e.target.value)} placeholder="Etapes (1 ligne = 1 etape)" rows={5} className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              <input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="URL image" className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              <button onClick={addManual} className="rounded-xl bg-emerald-300 px-3 py-2 text-sm font-bold text-slate-900">Ajouter recette manuelle</button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4">
            <h2 className="text-lg font-bold">Controle qualite</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">
                Blacklist ingredients (1 ligne)
                <textarea value={ingredientBlacklist} onChange={(e) => setIngredientBlacklistText(e.target.value)} rows={6} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">
                Blacklist combinaisons (ligne: ingredient1 + ingredient2)
                <textarea value={comboBlacklist} onChange={(e) => setComboBlacklistText(e.target.value)} rows={6} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2" />
              </label>
            </div>
            <button onClick={saveQualityRules} className="mt-3 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-900">Appliquer regles qualite</button>
          </section>
        </div>
      </section>
    </div>
  );
}
