import { LocalStateV1 } from "./types";

const KEY = "jaylinks_v1";

export function defaultState(): LocalStateV1 {
  return {
    version: 1,
    history: {},
    stats: {
      played: 0,
      completed: 0,
      currentStreak: 0,
      longestStreak: 0,
      avgCluesUsed: 0,
    },
  };
}

export function loadState(): LocalStateV1 {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as LocalStateV1;
    if (parsed?.version !== 1) return defaultState();
    // Basic validation
    if (!parsed.history || typeof parsed.history !== "object")
      return defaultState();
    if (!parsed.stats || typeof parsed.stats !== "object")
      return defaultState();
    return parsed;
  } catch (error) {
    console.warn("Failed to load state from localStorage:", error);
    return defaultState();
  }
}

export function saveState(state: LocalStateV1): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save state to localStorage:", error);
    // Could implement fallback, like in-memory storage
  }
}
