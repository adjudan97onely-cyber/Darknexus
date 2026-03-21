import { Link, useLocation } from "react-router-dom";
import { Bot, Camera, Heart, Home, Salad, Search } from "lucide-react";

const items = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/scanner", label: "Scanner", icon: Camera },
  { to: "/recettes", label: "Recettes", icon: Search },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/regime", label: "Regime", icon: Salad },
  { to: "/favoris", label: "Favoris", icon: Heart },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[95%] max-w-4xl -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-950/85 p-2 backdrop-blur">
      <ul className="grid grid-cols-6 gap-1">
        {items.map((item) => {
          const ActiveIcon = item.icon;
          const active = location.pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                  active ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <ActiveIcon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
