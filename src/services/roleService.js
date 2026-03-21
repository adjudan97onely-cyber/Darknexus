import { USER_ROLES } from "../core/userProfile";
import { getUserProfile, updateUserProfile } from "./userProfileService";

export { USER_ROLES };

const ROLE_RANK = { free: 0, standard: 1, premium: 2, admin: 3 };

// ────────────────────────────────────────────────────────────
// Feature matrix: feature key → minimum role required
// ────────────────────────────────────────────────────────────
export const FEATURES = {
  // Recettes
  recipes_basic: "free",
  recipes_standard: "standard",
  recipes_unlimited: "premium",

  // Scanner
  scanner_basic: "free",
  scanner_standard: "standard",
  scanner_unlimited: "premium",

  // Recommandations personnalisées
  feed_recommended: "standard",
  feed_because_liked: "premium",
  feed_you_could_like: "premium",

  // Coach & explications
  coach_explanations: "premium",

  // Planification régime
  diet_planner: "standard",
  diet_planner_full: "premium",

  // Assistant IA
  assistant_basic: "standard",
  assistant_full: "premium",

  // Profil
  profile_basic: "free",
  profile_advanced: "standard",

  // Admin
  admin_panel: "admin",
};

// ────────────────────────────────────────────────────────────
// Limites numériques par rôle
// ────────────────────────────────────────────────────────────
export const ROLE_LIMITS = {
  free:     { recipes: 4,  scanIngredients: 3,  scanResults: 4  },
  standard: { recipes: 9,  scanIngredients: 6,  scanResults: 9  },
  premium:  { recipes: 999, scanIngredients: 999, scanResults: 999 },
  admin:    { recipes: 999, scanIngredients: 999, scanResults: 999 },
};

// ────────────────────────────────────────────────────────────
// Messages d'upgrade
// ────────────────────────────────────────────────────────────
const UPGRADE_MESSAGES = {
  recipes_unlimited:    "Debloque des recettes illimitees avec Premium.",
  scanner_unlimited:    "Scan illimite et recommandations avancees avec Premium.",
  feed_recommended:     "Les recommandations personnalisees sont disponibles en Standard.",
  feed_because_liked:   "La section « Parce que tu as aime » est disponible en Premium.",
  feed_you_could_like:  "La section « Tu pourrais aussi aimer » est disponible en Premium.",
  coach_explanations:   "Les explications coach sont disponibles en Premium.",
  diet_planner:         "Le planificateur regime est disponible a partir de Standard.",
  diet_planner_full:    "Le planificateur complet est disponible en Premium.",
  assistant_basic:      "L'assistant culinaire est disponible a partir de Standard.",
  assistant_full:       "L'assistant coach complet est disponible en Premium.",
  profile_advanced:     "La personnalisation avancee du profil est disponible en Standard.",
  admin_panel:          "Le panneau admin est reserve aux administrateurs.",
};

const REQUIRED_ROLE_LABEL = {
  free:     "Gratuit",
  standard: "Standard",
  premium:  "Premium",
  admin:    "Admin",
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
export function getRoleRank(role) {
  return ROLE_RANK[role] ?? 0;
}

export function meetsRequirement(userRole, requiredRole) {
  return getRoleRank(userRole) >= getRoleRank(requiredRole);
}

export function hasAccess(feature, role) {
  const required = FEATURES[feature];
  if (!required) return true;
  return meetsRequirement(role || "free", required);
}

export function getUpgradeMessage(feature) {
  return UPGRADE_MESSAGES[feature] || "Cette fonctionnalite necessite un niveau superieur.";
}

export function getRequiredRoleLabel(feature) {
  const required = FEATURES[feature];
  return required ? REQUIRED_ROLE_LABEL[required] || required : null;
}

export function getLimits(role) {
  return ROLE_LIMITS[role] || ROLE_LIMITS.free;
}

// ────────────────────────────────────────────────────────────
// Accesseurs du rôle courant
// ────────────────────────────────────────────────────────────
export function getCurrentRole() {
  try {
    return getUserProfile()?.role || "free";
  } catch {
    return "free";
  }
}

export function setCurrentRole(role) {
  if (!USER_ROLES.includes(role)) return getCurrentRole();
  updateUserProfile({ role });
  return role;
}

export function isAdmin() {
  return getCurrentRole() === "admin";
}

export function isPremium() {
  return meetsRequirement(getCurrentRole(), "premium");
}

export function isStandardOrAbove() {
  return meetsRequirement(getCurrentRole(), "standard");
}

// ────────────────────────────────────────────────────────────
// Informations d'affichage par rôle
// ────────────────────────────────────────────────────────────
export const ROLE_INFO = {
  free: {
    label: "Gratuit",
    color: "text-slate-400",
    badgeClass: "bg-slate-400/20 text-slate-300",
    description: "Acces de base",
  },
  standard: {
    label: "Standard",
    color: "text-cyan-300",
    badgeClass: "bg-cyan-300/20 text-cyan-200",
    description: "Acces etendu",
  },
  premium: {
    label: "Premium",
    color: "text-amber-300",
    badgeClass: "bg-amber-300/20 text-amber-200",
    description: "Plein acces coach IA",
  },
  admin: {
    label: "Admin",
    color: "text-rose-300",
    badgeClass: "bg-rose-300/20 text-rose-200",
    description: "Controle total",
  },
};

// ────────────────────────────────────────────────────────────
// Comparateur utile pour filtrer des recettes par rôle
// ────────────────────────────────────────────────────────────
export function capRecipes(recipes, role) {
  const limit = getLimits(role).recipes;
  return (recipes || []).slice(0, limit);
}
