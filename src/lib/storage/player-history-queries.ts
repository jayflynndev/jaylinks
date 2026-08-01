import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeStatsFromHistory } from "./compute-stats-from-history";
import type { PlayerStats, PlayResult } from "./types";

/**
 * Server-only reads/writes against "JL_play_history" — the account-backed
 * counterpart to LocalStoragePlayerStore, used once a player signs in. Every
 * function here takes an already-verified `userId` — callers (the Server
 * Actions in src/app/actions/player-store-actions.ts) are the actual trust
 * boundary that derives it from the session cookie; nothing here re-checks
 * auth, so this module must never be reachable from a client component.
 */

function toPlayResult(row: {
  episode_number: number;
  puzzle_id: string;
  played_date: string;
  clue_texts: string[];
  revealed_clue_count: number;
  guessed_correctly: boolean;
  total_score: number;
}): PlayResult {
  return {
    episodeNumber: row.episode_number,
    puzzleId: row.puzzle_id,
    playedDate: row.played_date,
    isPractice: false, // practice plays are never persisted here — see the migration's design notes.
    clueTexts: row.clue_texts,
    revealedClueCount: row.revealed_clue_count,
    guessedCorrectly: row.guessed_correctly,
    totalScore: row.total_score,
  };
}

/** True if this account already has a real (non-practice) play recorded for this episode. */
export async function hasPlayed(userId: string, episodeNumber: number): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_play_history")
    .select("id")
    .eq("user_id", userId)
    .eq("episode_number", episodeNumber)
    .maybeSingle();
  return data !== null;
}

/** This account's saved result for an episode, or null if it hasn't been played (for real) yet. */
export async function getResult(userId: string, episodeNumber: number): Promise<PlayResult | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_play_history")
    .select("episode_number, puzzle_id, played_date, clue_texts, revealed_clue_count, guessed_correctly, total_score")
    .eq("user_id", userId)
    .eq("episode_number", episodeNumber)
    .maybeSingle();
  return data ? toPlayResult(data) : null;
}

async function computeStats(userId: string): Promise<PlayerStats> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_play_history")
    .select("played_date, total_score")
    .eq("user_id", userId)
    .order("played_date", { ascending: true });

  return computeStatsFromHistory(
    (data ?? []).map((row) => ({ playedDate: row.played_date, totalScore: row.total_score }))
  );
}

export async function getStats(userId: string): Promise<PlayerStats> {
  return computeStats(userId);
}

export interface PlayHistoryItem {
  episodeNumber: number;
  playedDate: string;
  guessedCorrectly: boolean;
  totalScore: number;
}

/** Most recent plays first, capped at `limit` — no pagination in v1, fine for a daily single-puzzle game (≤365 rows/year). */
export async function listPlayHistory(userId: string, limit: number): Promise<PlayHistoryItem[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_play_history")
    .select("episode_number, played_date, guessed_correctly, total_score")
    .eq("user_id", userId)
    .order("played_date", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    episodeNumber: row.episode_number,
    playedDate: row.played_date,
    guessedCorrectly: row.guessed_correctly,
    totalScore: row.total_score,
  }));
}

/**
 * Saves a real play (upsert on the (user_id, puzzle_id) unique constraint,
 * so a retry/replay overwrites rather than duplicates) and returns freshly
 * recomputed stats. Practice plays are a deliberate no-op — they're never
 * written server-side, matching LocalStoragePlayerStore's "practice
 * doesn't count" rule; the caller still gets current stats back either way.
 */
export async function saveResult(userId: string, result: PlayResult): Promise<PlayerStats> {
  if (result.isPractice) {
    return computeStats(userId);
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("JL_play_history").upsert(
    {
      user_id: userId,
      puzzle_id: result.puzzleId,
      episode_number: result.episodeNumber,
      played_date: result.playedDate,
      clue_texts: result.clueTexts,
      revealed_clue_count: result.revealedClueCount,
      guessed_correctly: result.guessedCorrectly,
      total_score: result.totalScore,
    },
    { onConflict: "user_id,puzzle_id" }
  );

  if (error) {
    throw new Error(`Failed to save play history: ${error.message}`);
  }

  return computeStats(userId);
}

/**
 * One-time upload of a device's local play history into an account on
 * first sign-in (src/components/player/AccountDashboard.tsx). Existing
 * account rows always win — `on conflict do nothing` means this only ever
 * fills gaps, never overwrites — so it's safe to call repeatedly or from
 * multiple devices; the union is correct by construction since stats are
 * always recomputed from the full table afterward, never patched
 * incrementally. Bad rows (e.g. a puzzle_id that no longer exists) are
 * skipped individually rather than failing the whole batch, matching
 * insertPuzzle's existing per-row error handling in admin-writes.ts.
 */
export async function mergeLocalHistory(userId: string, results: PlayResult[]): Promise<PlayerStats> {
  const supabase = createServiceRoleClient();
  const realResults = results.filter((r) => !r.isPractice);

  for (const result of realResults) {
    const { error } = await supabase.from("JL_play_history").upsert(
      {
        user_id: userId,
        puzzle_id: result.puzzleId,
        episode_number: result.episodeNumber,
        played_date: result.playedDate,
        clue_texts: result.clueTexts,
        revealed_clue_count: result.revealedClueCount,
        guessed_correctly: result.guessedCorrectly,
        total_score: result.totalScore,
      },
      { onConflict: "user_id,puzzle_id", ignoreDuplicates: true }
    );
    if (error) {
      console.error(`Skipping local history row for episode ${result.episodeNumber} during merge:`, error);
    }
  }

  return computeStats(userId);
}
