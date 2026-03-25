import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { mockScanImage } from "../services/scannerService";

export function IngredientScanner({ onDetected }) {
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  async function handleScan(raw) {
    if (!raw || !raw.trim()) return;
    setLoading(true);
    try {
      const scanResult = await mockScanImage(raw);
      onDetected(scanResult.detectedIngredients);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    // Extract ingredient hints from filename (simulation)
    const nameClean = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    handleScan(nameClean + " " + textInput);
  }

  function openCamera() {
    if (cameraRef.current) cameraRef.current.click();
  }

  function handleTextSubmit() {
    if (textInput.trim()) {
      handleScan(textInput);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/20 bg-slate-950/70 p-4">
      <h2 className="text-xl font-bold text-white">Scanner d'ingredients IA</h2>
      <p className="text-sm text-white/70">
        Prends une photo de ton frigo ou decris tes ingredients pour generer des recettes.
      </p>

      {/* Hidden camera input for mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <button
          onClick={openCamera}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-900"
          disabled={loading}
        >
          <Camera className="h-4 w-4" />
          {loading ? "Analyse en cours..." : "Prendre photo du frigo"}
        </button>

        <button
          onClick={handleTextSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 font-semibold text-white"
          disabled={loading || !textInput.trim()}
        >
          <Upload className="h-4 w-4" />
          Analyser mes ingredients
        </button>
      </div>

      <label className="block text-sm text-white/80">
        Ajouter une photo (locale de simulation)
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-2 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-semibold file:text-slate-900"
        />
      </label>

      {preview && (
        <div className="rounded-xl border border-white/20 overflow-hidden">
          <img src={preview} alt="Apercu" className="max-h-48 w-full object-cover" />
          <p className="p-2 text-xs text-white/60">Simulation IA: ingredients detectes depuis le nom du fichier. Un vrai scanner IA necessiterait une API de vision.</p>
        </div>
      )}

      <textarea
        value={textInput}
        onChange={(event) => setTextInput(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleTextSubmit(); } }}
        placeholder="Ecris tes ingredients: poulet tomate oignon riz..."
        className="h-28 w-full rounded-xl border border-white/20 bg-slate-900/80 p-3 text-sm text-white outline-none placeholder:text-white/50"
      />

      <p className="text-xs text-white/40">
        Mode simulation: decris tes ingredients et clique sur "Analyser". La camera ouvre le selecteur photo sur mobile.
      </p>
    </section>
  );
}
