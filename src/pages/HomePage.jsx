import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { CreatorSection } from "../components/CreatorSection";
import { PersonalizedFeed } from "../components/PersonalizedFeed";
import { UserProfilePanel } from "../components/UserProfilePanel";
import { recordRecipeSeen } from "../services/userMemoryService";

export function HomePage({ favoriteIds, onToggleFavorite, detectedIngredients }) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  function handleOpenRecipe(recipe) {
    recordRecipeSeen(recipe);
    navigate(`/recettes/${recipe.id}`, { state: { recipe } });
  }

  return (
    <div className="space-y-5">
      <Header />

      <UserProfilePanel onSaved={() => setRefreshKey((value) => value + 1)} />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Scanner IA", path: "/scanner", text: "Photo frigo -> ingredients detectes -> recettes illimitees" },
          { title: "Recettes intelligentes", path: "/recettes", text: "Francaise, healthy, rapide, cuisine du monde" },
          { title: "Regime intelligent", path: "/regime", text: "Calories, macros, planning semaine selon ton objectif" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-left transition hover:-translate-y-1 hover:bg-slate-900/80"
          >
            <h3 className="text-lg font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/75">{item.text}</p>
          </button>
        ))}
      </section>

      <PersonalizedFeed
        detectedIngredients={detectedIngredients}
        favoriteIds={favoriteIds}
        onToggleFavorite={(recipe) => {
          onToggleFavorite(recipe);
          setRefreshKey((value) => value + 1);
        }}
        onOpenRecipe={handleOpenRecipe}
        refreshKey={refreshKey}
      />

      <CreatorSection />
    </div>
  );
}
