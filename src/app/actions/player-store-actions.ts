"use server";

import { createServerAuthClient } from "@/lib/supabase/server-auth";
import * as playerHistory from "@/lib/storage/player-history-queries";
import type { RoundStartResult } from "@/lib/storage/player-history-queries";
import type { PlayerStats, PlayResult } from "@/lib/storage/types";

/**
 * The actual trust boundary for SupabasePlayerStore (src/lib/storage/player-store.ts):
 * every action here re-derives the signed-in user from the session cookie
 * itself — never from a client-supplied id — before touching
 * player-history-queries.ts. A signed-out caller (shouldn't normally
 * happen, since SupabasePlayerStore is only selected once a user id is
 * known server-side, but this is the real check) gets a thrown error
 * rather than silently operating on the wrong account.
 */
async function requireUserId(): Promise<string> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }
  return user.id;
}

export async function hasPlayedAction(episodeNumber: number): Promise<boolean> {
  const userId = await requireUserId();
  return playerHistory.hasPlayed(userId, episodeNumber);
}

export async function getResultAction(episodeNumber: number): Promise<PlayResult | null> {
  const userId = await requireUserId();
  return playerHistory.getResult(userId, episodeNumber);
}

export async function saveResultAction(result: PlayResult): Promise<PlayerStats> {
  const userId = await requireUserId();
  return playerHistory.saveResult(userId, result);
}

export async function getStatsAction(): Promise<PlayerStats> {
  const userId = await requireUserId();
  return playerHistory.getStats(userId);
}

export async function mergeLocalHistoryAction(results: PlayResult[]): Promise<PlayerStats> {
  const userId = await requireUserId();
  // Generous but bounded cap — abuse/bug protection on a public Server
  // Action any signed-in user can call, not a realistic usage limit (a
  // daily game produces at most ~365 real results/year).
  const capped = results.slice(0, 2000);
  return playerHistory.mergeLocalHistory(userId, capped);
}

/** Deletes this account's saved play history — a data-safety action, not account deletion (see AccountDashboard.tsx). */
export async function clearHistoryAction(): Promise<void> {
  const userId = await requireUserId();
  await playerHistory.clearHistory(userId);
}

/** Anti-cheat round-start marker — see player-history-queries.ts's getOrStartRound for the full explanation. */
export async function getOrStartRoundAction(
  episodeNumber: number,
  puzzleId: string
): Promise<RoundStartResult> {
  const userId = await requireUserId();
  return playerHistory.getOrStartRound(userId, puzzleId, episodeNumber);
}

export async function clearRoundStartAction(puzzleId: string): Promise<void> {
  const userId = await requireUserId();
  await playerHistory.clearRoundStart(userId, puzzleId);
}
