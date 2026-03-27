import { useEffect, useMemo, useState } from "react";
import { answerHydrationQuestion, buildWeeklyNutritionProgram, getRealtimeCoach } from "../services/nutritionService";
import { useLocalStorage } from "../hooks/useLocalStorage";

export function DietPlanner({ ingredients }) {
  const [weightKg, setWeightKg] = useState(78);
  const [heightCm, setHeightCm] = useState(176);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState("male");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("lose");
  const [program, setProgram] = useState(null);
  const [coachQuestion, setCoachQuestion] = useState("A 16h si j'ai soif, je peux boire un coca ?");
  const [coachAnswer, setCoachAnswer] = useState("");
  const [now, setNow] = useState(new Date());
  const [tracking, setTracking] = useLocalStorage("killagain-food:nutrition-tracking", {});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function generate() {
    const result = buildWeeklyNutritionProgram({
      ingredients,
      goal,
      weightKg,
      heightCm,
      age,
      sex,
      activity,
      today: new Date(),
    });
    setProgram(result);
    setCoachAnswer(answerHydrationQuestion(coachQuestion, goal));
  }

  function askCoach() {
    setCoachAnswer(answerHydrationQuestion(coachQuestion, goal));
  }

  const todayKey = useMemo(() => now.toISOString().slice(0, 10), [now]);
  const todayProgram = useMemo(() => program?.days.find((day) => day.dateKey === todayKey), [program, todayKey]);
  const realtime = useMemo(() => getRealtimeCoach(todayProgram, now), [todayProgram, now]);

  function toggleDone(dateKey, slot) {
    setTracking((prev) => {
      const currentDay = prev[dateKey] || { done: {}, water: 0 };
      const nextDone = {
        ...currentDay.done,
        [slot]: !currentDay.done?.[slot],
      };
      return {
        ...prev,
        [dateKey]: {
          ...currentDay,
          done: nextDone,
        },
      };
    });
  }

  function addWater(dateKey) {
    setTracking((prev) => {
      const currentDay = prev[dateKey] || { done: {}, water: 0 };
      return {
        ...prev,
        [dateKey]: {
          ...currentDay,
          water: Math.min(20, (currentDay.water || 0) + 1),
        },
      };
    });
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-slate-950/70 p-4 md:p-6">
      <h2 className="text-2xl font-black text-white">Coach nutrition hebdomadaire</h2>
      <p className="mt-1 text-base text-white/75">Interface simplifiee: grandes actions, suivi en direct, programme sur 7 jours.</p>

      <div className="mt-4 rounded-2xl border border-cyan-200/25 bg-cyan-400/10 p-4">
        <p className="text-lg font-bold text-cyan-100">Horloge coach en direct: {realtime.nowLabel}</p>
        <p className="mt-1 text-sm text-cyan-50">{realtime.message}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-white/90">
          Poids (kg)
          <input
            type="number"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          />
        </label>
        <label className="text-sm font-semibold text-white/90">
          Taille (cm)
          <input
            type="number"
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          />
        </label>
        <label className="text-sm font-semibold text-white/90">
          Age
          <input
            type="number"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-white/90">
          Sexe
          <select
            value={sex}
            onChange={(event) => setSex(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          >
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-white/90">
          Activite
          <select
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          >
            <option value="low">Faible</option>
            <option value="moderate">Moderee</option>
            <option value="high">Elevee</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-white/90">
          Objectif
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-3 text-lg text-white"
          >
            <option value="lose">Perdre du poids</option>
            <option value="maintain">Maintenir</option>
            <option value="gain">Prendre du muscle</option>
          </select>
        </label>
      </div>

      <button onClick={generate} className="mt-4 w-full rounded-xl bg-amber-300 px-4 py-3 text-lg font-black text-slate-900 md:w-auto">
        Generer le programme semaine
      </button>

      <div className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/90">
        <p className="mb-2 font-semibold">Question nutrition (coach)</p>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={coachQuestion}
            onChange={(event) => setCoachQuestion(event.target.value)}
            className="flex-1 rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2 text-white"
            placeholder="Ex: a 16h je peux boire un coca ?"
          />
          <button onClick={askCoach} className="rounded-lg bg-cyan-300 px-3 py-2 font-semibold text-slate-900">
            Demander au coach
          </button>
        </div>
        {coachAnswer ? <p className="mt-3 text-white/90">{coachAnswer}</p> : null}
      </div>

      {program ? (
        <div className="mt-4 space-y-3 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/90">
          <p>
            <strong>Objectif calorique journalier:</strong> {program.targetCalories} kcal
          </p>
          <p><strong>Maintenance:</strong> {program.maintenanceCalories} kcal | <strong>BMR:</strong> {program.bmr} kcal</p>
          <p>
            <strong>Macros cibles:</strong> P {program.macroTargets.protein} g | G {program.macroTargets.carbs} g | L {program.macroTargets.fat} g
          </p>
          <p><strong>Semaine commence le:</strong> {program.weekStart}</p>
        </div>
      ) : null}

      {program ? (
        <div className="mt-4 grid gap-4">
          {program.days.map((day) => {
            const dayTrack = tracking[day.dateKey] || { done: {}, water: 0 };
            return (
              <article key={day.dateKey} className="rounded-2xl border border-white/20 bg-slate-900/65 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-white">{day.dayName} {day.dateLabel}</h3>
                  <span className="rounded-full bg-cyan-300/25 px-3 py-1 text-xs font-semibold text-cyan-100">{day.theme}</span>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    ["breakfast", "Petit-dej", day.meals.breakfast?.name],
                    ["lunch", "Midi", day.meals.lunch?.name],
                    ["snack", "Collation 16h", day.meals.snack?.name],
                    ["dinner", "Soir", day.meals.dinner?.name],
                  ].map(([slot, label, meal]) => (
                    <button
                      key={slot}
                      onClick={() => toggleDone(day.dateKey, slot)}
                      className={`rounded-xl border px-3 py-3 text-left ${
                        dayTrack.done?.[slot]
                          ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                          : "border-white/20 bg-white/5 text-white"
                      }`}
                    >
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-sm">{meal || "A definir"}</p>
                      <p className="mt-1 text-xs">{dayTrack.done?.[slot] ? "Fait" : "Appuie pour marquer fait"}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-white/90">
                  <p><strong>Alternative soir:</strong> {day.meals.backup?.name}</p>
                  <p>
                    <strong>Total jour:</strong> {day.dailyTotals.kcal} kcal | P {day.dailyTotals.protein} g | G {day.dailyTotals.carbs} g | L {day.dailyTotals.fat} g
                  </p>
                  <p><strong>Boissons:</strong> Matin {day.beverage.morning} | 16h {day.beverage.afternoon} | Soir {day.beverage.evening}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => addWater(day.dateKey)} className="rounded-lg bg-cyan-300 px-3 py-2 font-semibold text-slate-900">
                      +1 verre d'eau
                    </button>
                    <span>Hydratation: {dayTrack.water || 0} verres</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
