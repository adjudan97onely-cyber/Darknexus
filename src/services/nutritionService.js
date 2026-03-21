import { recommendRecipesFromIngredients } from "./aiService";

export function calculateCalories({ weightKg, heightCm, goal }) {
  const safeWeight = Number(weightKg) || 70;
  const safeHeight = Number(heightCm) || 170;
  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * 30 + 5;
  const maintenance = Math.round(base * 1.35);

  if (goal === "lose") return maintenance - 350;
  if (goal === "gain") return maintenance + 250;
  return maintenance;
}

const DAILY_COACH_THEMES = [
  "Jour energie propre",
  "Jour hydratation et fibres",
  "Jour performance douce",
  "Jour digestion legere",
  "Jour focus mental",
  "Jour recuperation",
  "Jour equilibre plaisir",
];

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const SLOTS = [
  { key: "breakfast", label: "Petit-dej", time: "08:00" },
  { key: "lunch", label: "Midi", time: "12:30" },
  { key: "snack", label: "Collation", time: "16:00" },
  { key: "dinner", label: "Soir", time: "19:30" },
];

function toTimeMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(inputDate = new Date()) {
  const date = new Date(inputDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function pickWithOffset(items, offset) {
  if (!items.length) return null;
  return items[offset % items.length];
}

function selectDiverse(picks, startOffset = 0) {
  const safe = picks.length ? picks : recommendRecipesFromIngredients(["oeuf", "riz", "tomate"], 8);
  return {
    breakfast: pickWithOffset(safe, startOffset),
    lunch: pickWithOffset(safe, startOffset + 1),
    snack1: pickWithOffset(safe, startOffset + 2),
    dinner: pickWithOffset(safe, startOffset + 3),
    snack2: pickWithOffset(safe, startOffset + 4),
    altLunch: pickWithOffset(safe, startOffset + 5),
    altDinner: pickWithOffset(safe, startOffset + 6),
  };
}

export function answerHydrationQuestion(question, goal = "maintain") {
  const q = (question || "").toLowerCase();

  if (q.includes("coca") || q.includes("soda")) {
    return goal === "lose"
      ? "A 16h, evite le coca classique. Prends eau petillante + citron vert ou the glace sans sucre. Si envie forte: mini canette zero occasionnelle."
      : "Tu peux prendre un soda zero occasionnel, mais priorite eau, infusion ou eau coco sans sucre ajoute."
  }

  if (q.includes("soif") || q.includes("16h")) {
    return "A 16h: commence par 300-400 ml d'eau. Si faim associee, ajoute une collation simple (fruit + yaourt nature ou oeuf dur).";
  }

  if (q.includes("boire") || q.includes("boisson")) {
    return "Boissons recommandées: eau, eau citronnee, infusion menthe, the glace sans sucre, eau coco naturelle en petite portion.";
  }

  return "Hydrate-toi par petites gorgées toute la journee: eau au reveil, eau avant repas, et boisson sans sucre a 16h.";
}

export function buildWeeklyNutritionProgram({ ingredients, goal, weightKg, heightCm, today = new Date() }) {
  const targetCalories = calculateCalories({ weightKg, heightCm, goal });
  const picks = recommendRecipesFromIngredients(ingredients, 30);
  const weekStart = getWeekStart(today);

  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + idx);
    const offset = idx * 3;
    const selected = selectDiverse(picks, offset);
    const dayTheme = DAILY_COACH_THEMES[idx % DAILY_COACH_THEMES.length];

    return {
      dateKey: formatDateKey(date),
      dayName: DAY_NAMES[date.getDay()],
      dateLabel: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      theme: dayTheme,
      calories: targetCalories,
      meals: {
        breakfast: selected.breakfast,
        lunch: selected.lunch,
        snack: selected.snack1,
        dinner: selected.dinner,
        backup: selected.altDinner,
      },
      beverage: {
        morning: "Eau + boisson chaude sans sucre",
        afternoon: goal === "lose" ? "Eau petillante citron / infusion froide" : "Eau coco nature ou the glace sans sucre",
        evening: "Infusion menthe/verveine",
      },
    };
  });

  return {
    targetCalories,
    weekStart: formatDateKey(weekStart),
    days,
  };
}

export function getRealtimeCoach(programDay, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotWithMinutes = SLOTS.map((slot) => ({
    ...slot,
    value: toTimeMinutes(slot.time),
  }));

  let current = slotWithMinutes[0];
  let next = slotWithMinutes[0];

  for (let i = 0; i < slotWithMinutes.length; i += 1) {
    const slot = slotWithMinutes[i];
    if (currentMinutes >= slot.value) {
      current = slot;
      next = slotWithMinutes[i + 1] || slotWithMinutes[0];
    }
  }

  const nextMinutes = next.value >= currentMinutes ? next.value - currentMinutes : 24 * 60 - currentMinutes + next.value;
  const isTodayProgram = Boolean(programDay);

  return {
    nowLabel: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    currentSlot: current,
    nextSlot: next,
    minutesToNext: nextMinutes,
    message: isTodayProgram
      ? `Maintenant: ${current.label}. Prochaine etape dans ${nextMinutes} min (${next.label} ${next.time}).`
      : "Genere ton programme pour activer le suivi en direct.",
  };
}

export function buildDietPlan({ ingredients, goal, weightKg, heightCm }) {
  const targetCalories = calculateCalories({ weightKg, heightCm, goal });
  const picks = recommendRecipesFromIngredients(ingredients, 14);
  const offset = new Date().getDay();
  const meals = selectDiverse(picks, offset);
  const theme = DAILY_COACH_THEMES[offset];

  return {
    targetCalories,
    dailyTheme: theme,
    advice:
      goal === "lose"
        ? "Priorite deficit doux: garde une assiette dense en legumes et proteines, limite les fritures au weekend." 
        : goal === "gain"
          ? "Objectif muscle: ajoute 1 collation proteinee entre 16h et 17h et un diner complet." 
          : "Objectif maintien: portions stables, hydratation reguliere, constance.",
    hydration: "Hydratation guidee: eau au reveil, eau avant repas, boisson sans sucre l'apres-midi.",
    schedule: {
      breakfast: "07h30 - 08h30",
      lunch: "12h30 - 13h30",
      snack: "16h00",
      dinner: "19h00 - 20h00",
      lateSnack: "21h30 (optionnel)",
    },
    beveragePlan: {
      morning: "Eau + cafe/the non sucre",
      at16h: goal === "lose" ? "Eau petillante citron / infusion froide" : "Eau coco ou the glace non sucre",
      evening: "Infusion menthe/verveine",
      sodaRule: "Soda classique exceptionnel; prefere soda zero occasionnel et eau majoritaire.",
    },
    meals,
    coachMessage: answerHydrationQuestion("j'ai soif a 16h, je peux boire un coca ?", goal),
  };
}
