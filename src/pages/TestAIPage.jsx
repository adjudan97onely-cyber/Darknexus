import React, { useState } from "react";
import { askCookingAssistant } from "../services/aiService";

export default function TestAIPage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testQueries = [
    { query: "agoulou", desc: "Sandwich antillais (abats)" },
    { query: "gratin", desc: "Gratin français (plusieurs types)" },
    { query: "accras", desc: "Friture antillaise (morue)" },
    { query: "bokit", desc: "Pain frit guadeloupe" },
  ];

  const runTest = async (query) => {
    setLoading(true);
    try {
      const result = await askCookingAssistant(query, {
        userProfile: {
          level: 8,
          dietary: "normal",
          allergies: [],
        },
      });

      setResults((prev) => ({
        ...prev,
        [query]: {
          title: result.title,
          count: result.recipes?.length || 0,
          recipes: result.recipes || [],
          success: true,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [query]: {
          error: error.message,
          success: false,
        },
      }));
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    setLoading(true);
    for (const test of testQueries) {
      await runTest(test.query);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 Test AI Service - Points 7-9</h1>

      <button
        onClick={runAllTests}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Testing..." : "RUN ALL TESTS"}
      </button>

      <div style={{ marginTop: "30px" }}>
        {testQueries.map((test) => {
          const result = results[test.query];
          return (
            <div
              key={test.query}
              style={{
                marginBottom: "30px",
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: result?.success ? "#f0f8ff" : "#fff3cd",
              }}
            >
              <h3>📍 "{test.query}" → {test.desc}</h3>

              {result ? (
                <>
                  <p>
                    <strong>Title:</strong> {result.title}
                  </p>
                  <p>
                    <strong>Recipes Found:</strong> {result.count}
                  </p>

                  {result.recipes && result.recipes.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Results:</strong>
                      <ol style={{ marginTop: "10px" }}>
                        {result.recipes.map((recipe, idx) => (
                          <li key={idx}>
                            <strong>{recipe.name}</strong>
                            <br />
                            <small>
                              Cuisine: {recipe.cuisine || "?"} | Score:{" "}
                              {recipe.score || "?"}
                            </small>
                          </li>
                        ))}
                      </ol>

                      {/* Check doublons */}
                      {(() => {
                        const names = result.recipes.map((r) => r.name);
                        const hasDups =
                          names.length !== new Set(names).size;
                        return (
                          <p style={{ color: hasDups ? "red" : "green" }}>
                            {hasDups ? "⚠️ Doublons détectés!" : "✅ Pas de doublons"}
                          </p>
                        );
                      })()}

                      {/* Check cohérence cuisine */}
                      {(() => {
                        const cuisines = result.recipes.map((r) => r.cuisine);
                        const unique = [...new Set(cuisines)];
                        return (
                          <p>
                            🍴 <strong>Cuisines:</strong> {unique.join(", ")}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {result.error && (
                    <p style={{ color: "red" }}>
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ color: "#999" }}>Not tested yet...</p>
              )}

              <button
                onClick={() => runTest(test.query)}
                disabled={loading}
                style={{
                  marginTop: "10px",
                  padding: "8px 15px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Test "{test.query}"
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
