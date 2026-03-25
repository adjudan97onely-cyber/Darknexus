import { useState } from "react";
import { getCurrentRole, ROLE_INFO } from "../services/roleService";
import { getUserProfile, updateUserProfile } from "../services/userProfileService";
import { FeatureGate } from "./FeatureGate";

function splitTags(value) {
  return String(value || "")
    .split(/[,+;/\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function UserProfilePanel({ onSaved }) {
  const current = getUserProfile();
  const role = getCurrentRole();
  const roleInfo = ROLE_INFO[role] || ROLE_INFO.standard;
  const [goal, setGoal] = useState(current.goal);
  const [preferences, setPreferences] = useState(current.preferences.join(", "));
  const [allergies, setAllergies] = useState(current.allergies.join(", "));
  const [avoidedFoods, setAvoidedFoods] = useState(current.avoidedFoods.join(", "));
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    updateUserProfile({
      goal,
      preferences: splitTags(preferences),
      allergies: splitTags(allergies),
      avoidedFoods: splitTags(avoidedFoods),
    });
    setSaved(true);
    onSaved?.();
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-slate-950/70 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Profil culinaire</h2>
          <p className="mt-1 text-sm text-white/70">L'application adapte les suggestions selon ton objectif, tes preferences et tes exclusions.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">Profil enregistre</span> : null}
          <span className={`rounded-full px-3 py-1 text-xs font-black ${roleInfo.badgeClass}`}>{roleInfo.label}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-white/90">
          Objectif
          <select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-3 text-white">
            <option value="lose">Perte</option>
            <option value="maintain">Maintien</option>
            <option value="gain">Prise</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-white/90">
          Preferences alimentaires
          <input value={preferences} onChange={(event) => setPreferences(event.target.value)} placeholder="healthy, rapide, gourmand" className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-3 text-white" />
        </label>

        <FeatureGate feature="profile_advanced" fallback={
          <label className="text-sm font-semibold text-white/50">
            Allergies
            <FeatureGate feature="profile_advanced" />
          </label>
        }>
          <label className="text-sm font-semibold text-white/90">
            Allergies
            <input value={allergies} onChange={(event) => setAllergies(event.target.value)} placeholder="crevette, lait, arachide" className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-3 text-white" />
          </label>
        </FeatureGate>

        <FeatureGate feature="profile_advanced" fallback={
          <label className="text-sm font-semibold text-white/50">
            Aliments exclus
            <FeatureGate feature="profile_advanced" />
          </label>
        }>
          <label className="text-sm font-semibold text-white/90">
            Aliments exclus
            <input value={avoidedFoods} onChange={(event) => setAvoidedFoods(event.target.value)} placeholder="boeuf, porc, creme" className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/80 px-3 py-3 text-white" />
          </label>
        </FeatureGate>
      </div>

      <button onClick={saveProfile} className="mt-4 rounded-xl bg-amber-300 px-4 py-3 font-bold text-slate-900">
        Sauvegarder mon profil
      </button>
    </section>
  );
}
