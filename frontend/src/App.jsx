import { useEffect, useMemo, useState } from "react";
import { analyzeIngredients, analyzePhoto, getHistory, getStats } from "./services/api";

const DEFAULT_FORM = {
  ingredients: "oeuf, tomate, oignon, fromage",
  photo_note: "oeuf, tomate, oignon",
  vegetarian: false,
  quick_only: false,
  max_prep_minutes: 40,
};

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("ingredients");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_analyses: 0, top_recipes: [] });
  const [error, setError] = useState("");

  const parsedIngredients = useMemo(
    () => form.ingredients.split(",").map((v) => v.trim()).filter(Boolean),
    [form.ingredients]
  );

  const refreshMeta = async () => {
    try {
      const [historyData, statsData] = await Promise.all([getHistory(6), getStats()]);
      setHistory(historyData.items || []);
      setStats(statsData || { total_analyses: 0, top_recipes: [] });
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load history/stats");
    }
  };

  useEffect(() => {
    refreshMeta();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const common = {
        vegetarian: form.vegetarian,
        quick_only: form.quick_only,
        max_prep_minutes: Number(form.max_prep_minutes || 45),
      };

      const data =
        mode === "ingredients"
          ? await analyzeIngredients({ ...common, ingredients: parsedIngredients })
          : await analyzePhoto({ ...common, photo_note: form.photo_note });

      setResult(data);
      await refreshMeta();
    } catch (err) {
      setError(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero-bg" />
      <main className="container">
        <section className="hero">
          <p className="tag">Chef IA . Machine de guerre</p>
          <h1>Transforme tes ingredients en recettes actionnables</h1>
          <p>
            Mode offensif: analyse d ingredients, recommandations classees, historique intelligent,
            et scoring en temps reel.
          </p>
          <div className="kpis">
            <article>
              <h3>{stats.total_analyses}</h3>
              <span>Analyses executees</span>
            </article>
            <article>
              <h3>{history.length}</h3>
              <span>Sessions recentes</span>
            </article>
            <article>
              <h3>{stats.top_recipes?.[0]?.recipe_name || "-"}</h3>
              <span>Top recette</span>
            </article>
          </div>
        </section>

        <section className="grid">
          <article className="card control">
            <h2>Analyse</h2>
            <div className="row mode-switch">
              <button className={mode === "ingredients" ? "active" : ""} onClick={() => setMode("ingredients")}>Ingredients</button>
              <button className={mode === "photo" ? "active" : ""} onClick={() => setMode("photo")}>Photo note</button>
            </div>

            {mode === "ingredients" ? (
              <label>
                Ingredients (comma separated)
                <textarea
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={4}
                />
              </label>
            ) : (
              <label>
                Photo note
                <textarea
                  value={form.photo_note}
                  onChange={(e) => setForm({ ...form, photo_note: e.target.value })}
                  rows={4}
                />
              </label>
            )}

            <div className="options">
              <label>
                <input
                  type="checkbox"
                  checked={form.vegetarian}
                  onChange={(e) => setForm({ ...form, vegetarian: e.target.checked })}
                />
                Vegetarian
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.quick_only}
                  onChange={(e) => setForm({ ...form, quick_only: e.target.checked })}
                />
                Quick only (\u003c=20 min)
              </label>
              <label>
                Max prep minutes
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={form.max_prep_minutes}
                  onChange={(e) => setForm({ ...form, max_prep_minutes: e.target.value })}
                />
              </label>
            </div>

            <button className="cta" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Run Chef IA"}
            </button>

            {error ? <p className="error">{error}</p> : null}
          </article>

          <article className="card results">
            <h2>Recommandations</h2>
            {!result ? <p className="muted">Execute une analyse pour voir les recettes.</p> : null}
            {result?.normalized_ingredients ? (
              <p className="meta">Normalized: {result.normalized_ingredients.join(", ")}</p>
            ) : null}
            {result?.extracted_ingredients ? (
              <p className="meta">Extracted: {result.extracted_ingredients.join(", ")}</p>
            ) : null}

            <div className="recipes">
              {(result?.recommendations || []).map((item) => (
                <div key={`${item.recipe_name}-${item.score}`} className="recipe">
                  <header>
                    <h3>{item.recipe_name}</h3>
                    <strong>{item.score}%</strong>
                  </header>
                  <p>{item.reason}</p>
                  <footer>
                    <span>{item.prep_minutes} min</span>
                    <span>{item.difficulty}</span>
                  </footer>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid secondary">
          <article className="card history">
            <h2>Historique recent</h2>
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.analysis_id} className="history-item">
                  <p className="meta">{entry.created_at}</p>
                  <p>{entry.ingredients_normalized || entry.ingredients_raw}</p>
                  <p className="muted">
                    Top: {entry.recommendations?.[0]?.recipe_name || "none"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="card stats">
            <h2>Top recettes</h2>
            <div className="leaderboard">
              {(stats.top_recipes || []).map((item) => (
                <div key={item.recipe_name} className="leader-row">
                  <span>{item.recipe_name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
