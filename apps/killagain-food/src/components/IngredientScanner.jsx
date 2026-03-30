import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { mockScanImage } from "../services/scannerService";

export function IngredientScanner({ onDetected }) {
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleScan(raw) {
    setLoading(true);
    try {
      const scanResult = await mockScanImage(raw);
      onDetected(scanResult.detectedIngredients);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/20 bg-slate-950/70 p-4">
      <h2 className="text-xl font-bold text-white">Scanner d'ingredients IA</h2>
      <p className="text-sm text-white/70">
        Ajoute une photo (simulation IA) ou decris ce que tu vois dans ton frigo.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          onClick={() => handleScan(textInput || selectedFile?.name || "frigo tomate oignon poulet")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-900"
          disabled={loading}
        >
          <Camera className="h-4 w-4" />
          {loading ? "Analyse en cours..." : "Prendre photo du frigo"}
        </button>

        <button
          onClick={() => handleScan(textInput || selectedFile?.name || "ingredient jambon fromage creme")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-semibold text-white"
          disabled={loading}
        >
          <Upload className="h-4 w-4" />
          Scanner ingredient seul
        </button>
      </div>

      <label className="block text-sm text-white/80">
        Ajouter une photo (simulation locale)
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          className="mt-2 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-semibold file:text-slate-900"
        />
      </label>

      <textarea
        value={textInput}
        onChange={(event) => setTextInput(event.target.value)}
        placeholder="Exemple: pate feuilletee jambon fromage creme"
        className="h-28 w-full rounded-xl border border-white/20 bg-slate-900/80 p-3 text-sm text-white outline-none placeholder:text-white/50"
      />
    </section>
  );
}
