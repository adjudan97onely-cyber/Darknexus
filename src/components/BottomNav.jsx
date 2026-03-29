import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Book, MessageSquare, Leaf, Heart, UserCheck } from "lucide-react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/scanner", icon: Search, label: "Scanner" },
    { path: "/recettes", icon: Book, label: "Recettes" },
    { path: "/assistant", icon: MessageSquare, label: "Chef IA" },
    { path: "/regime", icon: Leaf, label: "Régime" },
    { path: "/favoris", icon: Heart, label: "Favoris" },
    { path: "/createur", icon: UserCheck, label: "Créateur" },
  ];

  const isActive = (path) => currentPath === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#021826] to-[#0f2145] border-t border-cyan-500/20 shadow-2xl">
      <div className="flex justify-center gap-1 overflow-x-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                active
                  ? "bg-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20"
                  : "text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              }`}
              title={item.label}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
