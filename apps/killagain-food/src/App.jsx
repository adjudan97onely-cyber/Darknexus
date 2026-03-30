import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { useFavorites } from "./hooks/useFavorites";
import { HomePage } from "./pages/HomePage";
import { ScannerPage } from "./pages/ScannerPage";
import { RecipesPage } from "./pages/RecipesPage";
import { AssistantPage } from "./pages/AssistantPage";
import { DietPage } from "./pages/DietPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { CreatorPage } from "./pages/CreatorPage";

function AppLayout() {
  const [search, setSearch] = useState("");
  const [detectedIngredients, setDetectedIngredients] = useState(["tomate", "oignon", "poulet"]);
  const { favorites, favoriteIds, toggleFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021826] via-[#0f2145] to-[#0f3c2e] pb-28 text-white">
      <div className="mx-auto w-[94%] max-w-7xl pt-4 md:pt-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/scanner"
            element={
              <ScannerPage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onSetDetectedIngredients={setDetectedIngredients}
              />
            }
          />
          <Route
            path="/recettes"
            element={
              <RecipesPage
                search={search}
                setSearch={setSearch}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />
          <Route path="/recettes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/assistant" element={<AssistantPage detectedIngredients={detectedIngredients} />} />
          <Route path="/regime" element={<DietPage detectedIngredients={detectedIngredients} />} />
          <Route
            path="/favoris"
            element={
              <FavoritesPage
                favorites={favorites}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />
          <Route path="/createur" element={<CreatorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
