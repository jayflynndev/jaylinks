"use client";

import { computeStreakUpdate } from "./streak";
import type { PlayerStats, PlayResult } from "./types";

/**
 * The player-state persistence interface. Every piece of game code that
 * needs to read or write player history (streaks, past results, stats)
 * goes through this interface — never `localStorage` directly. v1 ships
 * only `LocalStoragePlayerStore` (no player accounts), but the interface
 * is the seam for a future Supabase-backed implementation (e.g.
 * `SupabasePlayerStore`) once accounts exist: swap what `getPlayerStore()`
 * returns and no game-loop/results code needs to change.
 */
export interface PlayerStore {
  /** The result for a given episode, or null if that puzzle hasn't been played on this device. */
  getResult(episodeNumber: number): PlayResult | null;
  /** True if a *non-practice* result already exists for this episode (the "one real play per puzzle" rule). */
  hasPlayed(episodeNumber: number): boolean;
  /** Persists a result and (for non-practice plays) updates aggregate stats/streak. Returns the up-to-date stats. */
  saveResult(result: PlayResult): PlayerStats;
  getStats(): PlayerStats;
}

const RESULTS_KEY = "jayslinks:results:v1";
const STATS_KEY = "jayslinks:stats:v1";
const COMPLETED_KEY = "jayslinks:completed:v1";

const EMPTY_STATS: PlayerStats = {
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  averageScore: 0,
  lastPlayedDate: null,
};

/** True only in a browser context — every method below no-ops safely otherwise (e.g. during SSR). */
function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readResults(): Record<number, PlayResult> {
  if (!hasLocalStorage()) return {};
  try {
    const raw = window.localStorage.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, PlayResult>) : {};
  } catch {
    // Corrupted/foreign JSON shouldn't crash the game — treat as empty history.
    return {};
  }
}

function writeResults(results: Record<number, PlayResult>): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

function readStats(): PlayerStats {
  if (!hasLocalStorage()) return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as PlayerStats) : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

function writeStats(stats: PlayerStats): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * Episode numbers with at least one *non-practice* completion, tracked
 * separately from `readResults()` (which always holds the latest play,
 * practice or not, for display purposes). Without this separate record, a
 * practice replay would overwrite the day's real result and `hasPlayed()`
 * would forget the player already completed it for real.
 */
function readCompletedEpisodes(): number[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function markEpisodeCompleted(episodeNumber: number): void {
  if (!hasLocalStorage()) return;
  const completed = new Set(readCompletedEpisodes());
  completed.add(episodeNumber);
  window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
}

class LocalStoragePlayerStore implements PlayerStore {
  getResult(episodeNumber: number): PlayResult | null {
    return readResults()[episodeNumber] ?? null;
  }

  hasPlayed(episodeNumber: number): boolean {
    return readCompletedEpisodes().includes(episodeNumber);
  }

  saveResult(result: PlayResult): PlayerStats {
    const results = readResults();
    results[result.episodeNumber] = result;
    writeResults(results);

    if (result.isPractice) {
      // Practice replays are recorded (so the UI can show the latest
      // attempt) but deliberately don't move streaks/averages, and don't
      // touch the completed-episodes record — see the brief's
      // "practice — doesn't count" rule.
      return readStats();
    }

    markEpisodeCompleted(result.episodeNumber);

    const previousStats = readStats();
    const newStreak = computeStreakUpdate(
      previousStats.currentStreak,
      previousStats.lastPlayedDate,
      result.playedDate
    );
    const newGamesPlayed = previousStats.gamesPlayed + 1;
    const newAverageScore =
      (previousStats.averageScore * previousStats.gamesPlayed + result.totalScore) /
      newGamesPlayed;

    const newStats: PlayerStats = {
      currentStreak: newStreak,
      longestStreak: Math.max(previousStats.longestStreak, newStreak),
      gamesPlayed: newGamesPlayed,
      averageScore: newAverageScore,
      lastPlayedDate: result.playedDate,
    };

    writeStats(newStats);
    return newStats;
  }

  getStats(): PlayerStats {
    return readStats();
  }
}

let cachedStore: PlayerStore | null = null;

/** The single PlayerStore instance the app should use — see the interface doc above for the future Supabase swap point. */
export function getPlayerStore(): PlayerStore {
  if (!cachedStore) {
    cachedStore = new LocalStoragePlayerStore();
  }
  return cachedStore;
}
