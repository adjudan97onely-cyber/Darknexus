import { Camera, X } from "lucide-react";
import { useState } from "react";

export function IngredientScanner({ onSetDetectedIngredients }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState([
    "tomate",
    "oignon",
    "poulet",
  ]);

  const commonIngredients = [
    "tomate",
    "oignon",
    "ail",
    "poulet",
    "poisson",
    "morue",
    "crevettes",
    "banane",
    "avocat",
    "riz",
    "farine",
    "citron",
  ];

  const handleStartCamera = () => {
    setCameraActive(true);
    // Simulated camera detection after 2 seconds
    setTimeout(() => {
      const simulated = commonIngredients.slice(0, 5);
      setDetectedIngredients(simulated);
      onSetDetectedIngredients?.(simulated);
    }, 2000);
  };

  const toggleIngredient = (ingredient) => {
    if (detectedIngredients.includes(ingredient)) {
      const updated = detectedIngredients.filter((i) => i !== ingredient);
      setDetectedIngredients(updated);
      onSetDetectedIngredients?.(updated);
    } else {
      const updated = [...detectedIngredients, ingredient];
      setDetectedIngredients(updated);
      onSetDetectedIngredients?.(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handleStartCamera}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
        >
          <Camera size={20} />
          Démarrer caméra
        </button>
        {cameraActive && (
          <button
            onClick={() => setCameraActive(false)}
            className="px-4 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {cameraActive && (
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-cyan-500/30 h-72 flex items-center justify-center">
          <p className="text-gray-400 text-center">
            📷 Caméra en cours de détection...
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-cyan-300">Ingrédients détectés:</h3>
        <div className="flex flex-wrap gap-2">
          {detectedIngredients.map((ingredient) => (
            <button
              key={ingredient}
              onClick={() => toggleIngredient(ingredient)}
              className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm hover:bg-cyan-500/30 transition-all border border-cyan-500/50"
            >
              {ingredient} ✓
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-300">Ajouter d'autres ingrédients:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonIngredients.map((ingredient) => (
            <button
              key={ingredient}
              onClick={() => toggleIngredient(ingredient)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                detectedIngredients.includes(ingredient)
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500"
                  : "bg-gray-600/20 text-gray-400 border border-gray-600/50 hover:border-cyan-500/30"
              }`}
            >
              {ingredient}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
