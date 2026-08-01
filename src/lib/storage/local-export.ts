"use client";

import { readResults } from "./player-store";
import type { PlayResult } from "./types";

/**
 * All non-practice local results, for the one-time upload into an account
 * on first sign-in (see AccountDashboard.tsx). Deliberately outside the
 * PlayerStore interface — this is a merge-only concern, not a per-
 * implementation capability.
 *
 * Note: `readResults()` only ever holds each episode's *latest* attempt
 * (this is a pre-existing property of LocalStoragePlayerStore, not
 * something new here) — so if a real play was later superseded by a
 * practice replay of the same puzzle, that episode's original real score
 * is no longer recoverable from localStorage and won't be included here.
 * A rare edge case for a beta feature, not worth a bigger storage
 * redesign to prevent.
 */
export function exportLocalHistory(): PlayResult[] {
  return Object.values(readResults()).filter((result) => !result.isPractice);
}
