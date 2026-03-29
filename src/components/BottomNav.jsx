import { Home, Camera, UtensilsCrossed, Bot, Leaf, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/", icon: Home, label: "Accueil" },
    { path: "/scanner", icon: Camera, label: "Scanner" },
    { path: "/recettes", icon: UtensilsCrossed, label: "Recettes" },
    { path: "/assistant", icon: Bot, label: "Assistant" },
    { path: "/regime", icon: Leaf, label: "Régime" },
    { path: "/favoris", icon: Heart, label: "Favoris" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/20 bg-slate-950/95 backdrop-blur">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-3 text-xs font-semibold transition-colors ${
                active ? "text-cyan-300" : "text-white/50 hover:text-white/70"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
