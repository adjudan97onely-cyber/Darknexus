export function CreatorSection() {
  return (
    <section className="rounded-2xl border border-cyan-400/30 bg-slate-950/70 p-5">
      <h2 className="text-xl font-bold text-cyan-300">Créateur Killagain Food</h2>
      <p className="mt-2 text-white/75">
        Recettes authentiques de Guadeloupe et Martinique, assistant IA, nutrition intelligente.
      </p>
      <div className="mt-3 flex gap-2">
        <a
          href="https://www.instagram.com/killagainfood/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900"
        >
          Instagram
        </a>
      </div>
    </section>
  );
}
