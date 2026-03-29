import { useState, useRef } from "react";
import { Camera, X, Zap, ChefHat, Search, Plus, Check, Sparkles } from "lucide-react";
import { scanAndRecommend, fileToBase64 } from "../services/scannerService";

// ═══════════════════════════════════════════════════════════════
// KILLAGAIN FOOD — Scanner IA Premium
// Design dark luxury + IA Vision réelle
// ═══════════════════════════════════════════════════════════════

const COMMON_INGREDIENTS = [
  "poulet", "poisson", "morue", "crevettes", "thon",
  "tomate", "oignon", "ail", "avocat", "banane",
  "riz", "farine", "oeuf", "fromage", "citron",
  "lait de coco", "christophine", "giraumon", "igname", "patate douce",
];

const CATEGORY_COLORS = {
  "street-food": { bg: "rgba(74,222,128,0.15)", text: "#4ade80", border: "rgba(74,222,128,0.3)" },
  "plat": { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  "entree": { bg: "rgba(251,113,133,0.15)", text: "#fb7185", border: "rgba(251,113,133,0.3)" },
  "dessert": { bg: "rgba(167,139,250,0.15)", text: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  "accompagnement": { bg: "rgba(34,211,238,0.15)", text: "#22d3ee", border: "rgba(34,211,238,0.3)" },
  "boisson": { bg: "rgba(249,115,22,0.15)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  "default": { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

function CategoryTag({ category }) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      fontSize: "9px",
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: "10px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      {category}
    </span>
  );
}

function RecipeCard({ recipe, isNew = false }) {
  const totalMin = (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0);
  const scoreColor = (recipe.score || 0) >= 80 ? "#4ade80" : (recipe.score || 0) >= 50 ? "#fbbf24" : "#94a3b8";

  return (
    <div style={{
      background: "#0d1a26",
      border: `1px solid ${isNew ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: "16px",
      overflow: "hidden",
      cursor: "pointer",
      transition: "transform 0.2s",
    }}>
      {/* Image */}
      <div style={{ height: "130px", position: "relative", background: "#0a1520" }}>
        {recipe.image && recipe.image.startsWith("http") ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #0f2a1e, #0a1f2e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px",
          }}>
            🍽
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
        }} />

        {/* Score badge */}
        {recipe.score > 0 && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${scoreColor}30`,
            borderRadius: "20px", padding: "3px 8px",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: scoreColor }} />
            <span style={{ color: scoreColor, fontSize: "10px", fontWeight: 700 }}>
              {Math.min(99, recipe.score)}% match
            </span>
          </div>
        )}

        {/* Badge Nouveau */}
        {isNew && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(74,222,128,0.9)", color: "#052e16",
            fontSize: "9px", fontWeight: 800, padding: "3px 8px",
            borderRadius: "10px", letterSpacing: "0.5px",
          }}>
            ✨ NOUVEAU
          </div>
        )}

        {/* Nom sur image */}
        <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
          <p style={{ color: "#fff", fontSize: "13px", fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
            {recipe.name}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
          <CategoryTag category={recipe.category} />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>⏱ {totalMin} min</span>
          <span style={{ color: "#fbbf24", fontSize: "10px" }}>🔥 {recipe.nutrition?.kcal || "?"} kcal</span>
        </div>
        {recipe.description && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", lineHeight: 1.4, marginBottom: "8px" }}>
            {recipe.description}
          </p>
        )}
        <button style={{
          width: "100%",
          background: "rgba(74,222,128,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: "8px",
          padding: "7px",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          Voir la recette →
        </button>
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }) {
  if (!analysis) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f2a1e, #0a1f2e)",
      border: "1px solid rgba(74,222,128,0.2)",
      borderRadius: "18px",
      padding: "16px",
      marginBottom: "16px",
    }}>
      {/* Description */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px",
          background: "rgba(74,222,128,0.15)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: "18px", flexShrink: 0,
        }}>
          🔍
        </div>
        <div>
          <p style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600, marginBottom: "3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Analyse IA
          </p>
          <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>
            {analysis.description}
          </p>
        </div>
      </div>

      {/* Aliments détectés */}
      {analysis.aliments?.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Aliments détectés
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {analysis.aliments.map((a, i) => (
              <span key={i} style={{
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.25)",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
              }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ce qu'on peut faire */}
      {analysis.possibilites?.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Ce qu'on peut cuisiner
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {analysis.possibilites.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#4ade80", fontSize: "10px" }}>›</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conseil chef */}
      {analysis.conseil_chef && (
        <div style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
          borderRadius: "10px",
          padding: "10px",
          marginBottom: "8px",
        }}>
          <p style={{ color: "#fbbf24", fontSize: "10px", fontWeight: 600, marginBottom: "3px" }}>
            👨‍🍳 Conseil du chef
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", lineHeight: 1.4 }}>
            {analysis.conseil_chef}
          </p>
        </div>
      )}

      {/* Valeur nutritionnelle */}
      {analysis.valeur_nutritionnelle && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px" }}>💪</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
            {analysis.valeur_nutritionnelle}
          </span>
        </div>
      )}
    </div>
  );
}

export function IngredientScanner({ onSetDetectedIngredients }) {
  const [mode, setMode] = useState("idle"); // idle | camera | text | loading | results
  const [textInput, setTextInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [hasNewRecipe, setHasNewRecipe] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handleScan(imageBase64 = null, mediaType = "image/jpeg", text = "") {
    setMode("loading");
    setError(null);
    setAnalysis(null);
    setRecipes([]);

    try {
      const result = await scanAndRecommend(text || textInput, imageBase64, mediaType);
      setAnalysis(result.analysis);
      setRecipes(result.recipes);
      setHasNewRecipe(result.hasNewRecipe);
      setSelectedIngredients(result.aliments || []);
      onSetDetectedIngredients?.(result.aliments || []);
      setMode("results");
    } catch (err) {
      setError("Erreur lors de l'analyse. Réessaie.");
      setMode("idle");
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const base64 = await fileToBase64(file);
    await handleScan(base64, file.type);
  }

  function handleReset() {
    setMode("idle");
    setAnalysis(null);
    setRecipes([]);
    setTextInput("");
    setPreviewUrl(null);
    setSelectedIngredients([]);
    setHasNewRecipe(false);
    setError(null);
  }

  function toggleIngredient(ing) {
    const updated = selectedIngredients.includes(ing)
      ? selectedIngredients.filter(i => i !== ing)
      : [...selectedIngredients, ing];
    setSelectedIngredients(updated);
    onSetDetectedIngredients?.(updated);
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>

      {/* ─── ÉTAT IDLE ─────────────────────────────── */}
      {mode === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Bouton photo principal */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: "linear-gradient(135deg, #16a34a, #0891b2)",
              border: "none",
              borderRadius: "16px",
              padding: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px",
            }}>📷</div>
            <div>
              <p style={{ color: "#fff", fontSize: "15px", fontWeight: 700, marginBottom: "3px" }}>
                Scanner un aliment
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
                Photo de ton frigo, d'un plat, d'un ingrédient...
              </p>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.6)", fontSize: "20px" }}>›</div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* OU */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>ou tape un aliment</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Recherche texte */}
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && textInput.trim() && handleScan(null, null, textInput)}
              placeholder="pizza, banane, morue, poulet..."
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "12px 14px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={() => textInput.trim() && handleScan(null, null, textInput)}
              style={{
                background: "#16a34a",
                border: "none",
                borderRadius: "12px",
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <Zap size={14} /> Go
            </button>
          </div>

          {/* Suggestions rapides */}
          <div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Suggestions rapides
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Bokit", "Colombo", "Accras", "Pizza", "Banane", "Morue", "Crevettes", "Avocat"].map(s => (
                <button
                  key={s}
                  onClick={() => handleScan(null, null, s)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Ingrédients communs */}
          <div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ajoute des ingrédients
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {COMMON_INGREDIENTS.map(ing => (
                <button
                  key={ing}
                  onClick={() => toggleIngredient(ing)}
                  style={{
                    background: selectedIngredients.includes(ing) ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedIngredients.includes(ing) ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "10px",
                    padding: "8px",
                    color: selectedIngredients.includes(ing) ? "#4ade80" : "rgba(255,255,255,0.5)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    justifyContent: "center",
                  }}
                >
                  {selectedIngredients.includes(ing) ? <Check size={10} /> : <Plus size={10} />}
                  {ing}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton scanner avec les ingrédients sélectionnés */}
          {selectedIngredients.length > 0 && (
            <button
              onClick={() => handleScan(null, null, selectedIngredients.join(", "))}
              style={{
                background: "#16a34a",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <ChefHat size={16} />
              Trouver des recettes ({selectedIngredients.length} ingrédient{selectedIngredients.length > 1 ? "s" : ""})
            </button>
          )}
        </div>
      )}

      {/* ─── ÉTAT LOADING ──────────────────────────── */}
      {mode === "loading" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          gap: "16px",
        }}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="preview"
              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "16px", opacity: 0.6 }}
            />
          )}
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            border: "2px solid rgba(74,222,128,0.2)",
            borderTop: "2px solid #4ade80",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              L'IA analyse...
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
              Détection des aliments + recherche de recettes
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─── ÉTAT RÉSULTATS ────────────────────────── */}
      {mode === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Header résultats */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#fff", fontSize: "15px", fontWeight: 700 }}>
                {recipes.length} recette{recipes.length > 1 ? "s" : ""} trouvée{recipes.length > 1 ? "s" : ""}
              </p>
              {hasNewRecipe && (
                <p style={{ color: "#4ade80", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={10} /> Nouvelle recette générée et ajoutée au catalogue !
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "6px 12px",
                color: "rgba(255,255,255,0.6)",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <X size={12} /> Reset
            </button>
          </div>

          {/* Preview image si disponible */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="scanned"
              style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "14px" }}
            />
          )}

          {/* Analyse IA */}
          <AnalysisCard analysis={analysis} />

          {/* Ingrédients détectés modifiables */}
          {selectedIngredients.length > 0 && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Ingrédients détectés (modifiables)
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedIngredients.map((ing, i) => (
                  <button
                    key={i}
                    onClick={() => toggleIngredient(ing)}
                    style={{
                      background: "rgba(74,222,128,0.1)",
                      border: "1px solid rgba(74,222,128,0.3)",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      color: "#4ade80",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {ing} <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grille de recettes */}
          {recipes.length > 0 && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recettes recommandées
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {recipes.map((recipe, i) => (
                  <RecipeCard key={recipe.id || i} recipe={recipe} isNew={recipe.isNew || false} />
                ))}
              </div>
            </div>
          )}

          {/* Nouvelle analyse */}
          <button
            onClick={handleReset}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "12px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Camera size={14} /> Nouvelle analyse
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "10px",
          padding: "12px",
          color: "#f87171",
          fontSize: "12px",
          marginTop: "8px",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
