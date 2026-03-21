import { DEFAULT_USER_PROFILE, normalizeUserProfile } from "../core/userProfile";

const STORAGE_KEY = "killagain-food:user-profile";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getUserProfile() {
  if (!canUseStorage()) return DEFAULT_USER_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return normalizeUserProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile) {
  const normalized = normalizeUserProfile(profile);
  if (!canUseStorage()) return normalized;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateUserProfile(partialProfile) {
  const current = getUserProfile();
  return saveUserProfile({
    ...current,
    ...partialProfile,
    preferences: partialProfile?.preferences || current.preferences,
    allergies: partialProfile?.allergies || current.allergies,
    avoidedFoods: partialProfile?.avoidedFoods || current.avoidedFoods,
  });
}

export function resetUserProfile() {
  if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_USER_PROFILE;
}
