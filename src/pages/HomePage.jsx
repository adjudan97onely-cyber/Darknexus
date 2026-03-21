import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { CreatorSection } from "../components/CreatorSection";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <Header />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Scanner IA", path: "/scanner", text: "Photo frigo -> ingredients detectes -> recettes" },
          { title: "Recettes creoles", path: "/recettes", text: "Bokit, accras, colombo, blaff et plus" },
          { title: "Regime intelligent", path: "/regime", text: "Plan midi/soir/collation selon ton objectif" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-left transition hover:-translate-y-1 hover:bg-slate-900/80"
          >
            <h3 className="text-lg font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/75">{item.text}</p>
          </button>
        ))}
      </section>

      <CreatorSection />
    </div>
  );
}
