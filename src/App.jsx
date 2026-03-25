import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { DevRoleBanner } from "./components/RoleSwitcher";
import { useFavorites } from "./hooks/useFavorites";
import { isLocalAdminAllowed } from "./services/adminContentService";
import { getCurrentRole, hasAccess } from "./services/roleService";
import { initializeRuntimeState, STORAGE_KEYS } from "./services/runtimeStateService";
import { HomePage } from "./pages/HomePage";
import { ScannerPage } from "./pages/ScannerPage";
import { RecipesPage } from "./pages/RecipesPage";
import { AssistantPage } from "./pages/AssistantPage";
import { DietPage } from "./pages/DietPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { CreatorPage } from "./pages/CreatorPage";
import { AdminPage } from "./pages/AdminPage";
import TestAIPage from "./pages/TestAIPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";

function LocalAdminOnly({ children }) {
  if (!isLocalAdminAllowed()) {
    return (
      <section className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-5 text-rose-100">
        Acces admin refuse: page disponible uniquement en local.
      </section>
    );
  }
  if (!hasAccess("admin_panel", getCurrentRole())) {
    return (
      <section className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-5 text-rose-100">
        Acces admin refuse: role Admin requis. Change ton role en mode dev pour tester.
      </section>
    );
  }
  return children;
}

function AppLayout() {
  const [runtimeReady] = useState(() => {
    initializeRuntimeState();
    return true;
  });
  const [search, setSearch] = useState("");
  const [detectedIngredients, setDetectedIngredients] = useState(["tomate", "oignon", "poulet"]);
  const { favorites, favoriteIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === STORAGE_KEYS.userProfile) {
        initializeRuntimeState();
        window.location.reload();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!runtimeReady) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021826] via-[#0f2145] to-[#0f3c2e] pb-28 text-white">
      {isLocalAdminAllowed() && <DevRoleBanner onRoleChange={() => window.location.reload()} />}
      <div className="mx-auto w-[94%] max-w-7xl pt-4 md:pt-8">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                detectedIngredients={detectedIngredients}
              />
            }
          />
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
                detectedIngredients={detectedIngredients}
              />
            }
          />
          <Route path="/liste-courses" element={<ShoppingListPage />} />
          <Route path="/createur" element={<CreatorPage />} />
          <Route path="/test" element={<TestAIPage />} />
          <Route
            path="/admin"
            element={
              <LocalAdminOnly>
                <AdminPage />
              </LocalAdminOnly>
            }
          />
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
