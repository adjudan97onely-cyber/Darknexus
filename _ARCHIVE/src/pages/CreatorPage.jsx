import { CreatorSection } from "../components/CreatorSection";

export function CreatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
        Créateurs de Recettes
      </h1>
      <p className="text-gray-300">Découvrez les créateurs et influenceurs culinaires antillais</p>
      <CreatorSection />
    </div>
  );
}
