import { CREATOR_LINKS } from "../data/recipes";

export function CreatorSection() {
  return (
    <section className="rounded-2xl border border-white/20 bg-gradient-to-r from-fuchsia-500/30 via-rose-500/20 to-orange-400/20 p-4">
      <h2 className="text-xl font-bold text-white">Recettes du createur</h2>
      <p className="mt-1 text-sm text-white/85">
        Connecte directement avec la marque Killagain Food pour suivre les nouveautes, reels et astuces.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={CREATOR_LINKS.instagramProfile}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900"
        >
          Voir ce post Instagram
        </a>
        <a
          href={CREATOR_LINKS.instagramMain}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-900"
        >
          Voir mon compte Instagram
        </a>
        <a
          href={CREATOR_LINKS.instagramDm}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white"
        >
          Me contacter
        </a>
      </div>
    </section>
  );
}
