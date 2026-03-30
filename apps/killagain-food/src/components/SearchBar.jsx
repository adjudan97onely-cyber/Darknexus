import { Search } from "lucide-react";

export function SearchBar({ value, onChange, placeholder = "oeufs fromage farine, healthy rapide, cuisine du monde" }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/20 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-cyan-300"
      />
    </label>
  );
}
