import { Instagram, Users } from "lucide-react";

export function CreatorSection() {
  const creators = [
    {
      id: 1,
      name: "Chef Créole Antillais",
      specialty: "Cuisine traditionnelle",
      followers: "50k",
      instagram: "@chefcreoleantillais",
      bio: "Partage des recettes authentiques des Antilles"
    },
    {
      id: 2,
      name: "Saveurs Caribéennes",
      specialty: "Fusion créole",
      followers: "35k",
      instagram: "@saveurscaribeennes",
      bio: "Recettes créoles modernes et savoureuses"
    },
    {
      id: 3,
      name: "Flavors of Guadeloupe",
      specialty: "Gastronomie guadeloupéenne",
      followers: "28k",
      instagram: "@flavorsofguadeloupe",
      bio: "Découvrez les secrets culinaires guadeloupéens"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-lg p-6 border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-cyan-300">{creator.name}</h3>
              <p className="text-sm text-teal-300">{creator.specialty}</p>
            </div>
            <Users className="text-cyan-400" size={24} />
          </div>
          <p className="text-gray-300 text-sm mb-4">{creator.bio}</p>
          <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
            <span className="text-xs text-gray-400">{creator.followers}</span>
            <a
              href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
