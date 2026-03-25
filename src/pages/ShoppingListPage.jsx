import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, CheckCircle2, Circle, X } from "lucide-react";
import {
  getShoppingList,
  toggleShoppingItem,
  removeShoppingEntry,
  clearShoppingList,
} from "../services/shoppingListService";

export function ShoppingListPage() {
  const [list, setList] = useState(() => getShoppingList());

  const toggle = useCallback((entryId, itemIndex) => {
    setList(toggleShoppingItem(entryId, itemIndex));
  }, []);

  const remove = useCallback((entryId) => {
    setList(removeShoppingEntry(entryId));
  }, []);

  const clearAll = useCallback(() => {
    setList(clearShoppingList());
  }, []);

  const totalItems = list.reduce((s, e) => s + e.items.length, 0);
  const checkedItems = list.reduce((s, e) => s + e.items.filter((i) => i.checked).length, 0);

  return (
    <section className="space-y-4 rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <ShoppingCart className="h-6 w-6 text-emerald-300" />
          Liste de courses
        </h1>
        {list.length > 0 && (
          <button
            onClick={clearAll}
            className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
          >
            Tout effacer
          </button>
        )}
      </div>

      {totalItems > 0 && (
        <div className="rounded-xl bg-white/5 p-3 text-sm text-white/70">
          {checkedItems}/{totalItems} articles coches
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${totalItems ? (checkedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="text-white/50">Aucun ingredient dans la liste.</p>
          <p className="mt-1 text-sm text-white/30">Ouvre une recette et clique "Liste de courses" pour ajouter.</p>
          <Link to="/recettes" className="mt-4 inline-block rounded-xl bg-amber-300 px-4 py-2 font-bold text-slate-900">
            Voir les recettes
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-200">{entry.recipe}</h3>
                <button
                  onClick={() => remove(entry.id)}
                  className="rounded-lg p-1.5 text-white/40 transition hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {entry.items.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => toggle(entry.id, idx)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                        item.checked ? "text-white/40 line-through" : "text-white/90"
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-white/30" />
                      )}
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Link to="/recettes" className="inline-flex rounded-xl bg-amber-300 px-4 py-2 font-bold text-slate-900">
        Retour aux recettes
      </Link>
    </section>
  );
}
