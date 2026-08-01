/**
 * Derives PlayerStats fresh from a full list of real (non-practice) plays
 * — used both by SupabasePlayerStore.saveResult/getStats and by the
 * one-time local-history merge (see player-history-queries.ts). Always
 * recomputing from the full row set, rather than incrementally patching a
 * stored streak number, is what makes both of those callers correct
 * regardless of write order, retries, or merging rows from another
 * device.
 */
import { computeStreakUpdate } from "./streak";
import type { PlayerStats } from "./types";

export interface HistoryEntry {
  /** Europe/London calendar date ("YYYY-MM-DD") — see src/lib/time/london.ts. */
  playedDate: string;
  totalScore: number;
}

const EMPTY_STATS: PlayerStats = {
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  averageScore: 0,
  lastPlayedDate: null,
};

/** `entries` must be pre-sorted ascending by playedDate — callers query with `order by played_date asc`. */
export function computeStatsFromHistory(entries: HistoryEntry[]): PlayerStats {
  if (entries.length === 0) return EMPTY_STATS;

  let currentStreak = 0;
  let longestStreak = 0;
  let lastPlayedDate: string | null = null;
  let scoreSum = 0;

  for (const entry of entries) {
    currentStreak = computeStreakUpdate(currentStreak, lastPlayedDate, entry.playedDate);
    longestStreak = Math.max(longestStreak, currentStreak);
    lastPlayedDate = entry.playedDate;
    scoreSum += entry.totalScore;
  }

  return {
    currentStreak,
    longestStreak,
    gamesPlayed: entries.length,
    averageScore: scoreSum / entries.length,
    lastPlayedDate,
  };
}
