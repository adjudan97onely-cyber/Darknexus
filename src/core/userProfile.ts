export type UserGoal = "lose" | "gain" | "maintain";
export type UserPreference = "healthy" | "rapide" | "gourmand";
export type UserRole = "free" | "standard" | "premium" | "admin";

export const USER_ROLES: UserRole[] = ["free", "standard", "premium", "admin"];

export interface UserProfile {
  goal: UserGoal;
  preferences: UserPreference[];
  allergies: string[];
  avoidedFoods: string[];
  role: UserRole;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  goal: "maintain",
  preferences: ["healthy"],
  allergies: [],
  avoidedFoods: [],
  role: "free",
};

function normalizeString(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeUserProfile(input?: Partial<UserProfile> | null): UserProfile {
  const goal = input?.goal === "lose" || input?.goal === "gain" || input?.goal === "maintain" ? input.goal : DEFAULT_USER_PROFILE.goal;
  const preferences = unique((input?.preferences || DEFAULT_USER_PROFILE.preferences).map((item) => normalizeString(item))) as UserPreference[];
  const allergies = unique((input?.allergies || []).map((item) => normalizeString(item)));
  const avoidedFoods = unique((input?.avoidedFoods || []).map((item) => normalizeString(item)));
  const role: UserRole = USER_ROLES.includes(input?.role as UserRole) ? (input!.role as UserRole) : DEFAULT_USER_PROFILE.role;
  return {
    goal,
    preferences: preferences.length ? preferences : DEFAULT_USER_PROFILE.preferences,
    allergies,
    avoidedFoods,
    role,
  };
}

export function isBlockedIngredient(ingredient: string, profile?: Partial<UserProfile> | null): boolean {
  const normalizedProfile = normalizeUserProfile(profile);
  const name = normalizeString(ingredient);
  return normalizedProfile.allergies.some((item) => name.includes(item) || item.includes(name))
    || normalizedProfile.avoidedFoods.some((item) => name.includes(item) || item.includes(name));
}

export function recipeBlockedByProfile(ingredients: string[] = [], profile?: Partial<UserProfile> | null): boolean {
  return ingredients.some((ingredient) => isBlockedIngredient(ingredient, profile));
}
