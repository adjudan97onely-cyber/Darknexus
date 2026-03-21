import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <motion.header
      className="rounded-3xl border border-white/20 bg-gradient-to-br from-red-500/70 via-yellow-400/60 to-emerald-400/60 p-6 shadow-2xl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90">
        <Sparkles className="h-4 w-4" />
        Killagain Food
      </div>
      <h1 className="mt-4 text-3xl font-black leading-tight text-white md:text-5xl">
        Cuisine antillaise + nutrition intelligente, avec ce que tu as deja
      </h1>
      <p className="mt-3 max-w-3xl text-sm text-white/90 md:text-base">
        Scanner ingredients, recettes detaillees debutant, assistant IA pedagogique et plan alimentaire adapte a ton objectif.
      </p>
    </motion.header>
  );
}
