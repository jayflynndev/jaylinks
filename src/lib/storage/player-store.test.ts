// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerStore } from "./player-store";
import type { PlayResult } from "./types";

// player-store.ts imports the "use server" actions module so
// SupabasePlayerStore can call it directly — that's the standard Next.js
// pattern for calling Server Actions from client code, but outside Next's
// own build pipeline (i.e. under plain Vitest) that file's real imports
// (next/headers, "server-only") aren't buildable at all. These tests only
// exercise LocalStoragePlayerStore, so the actions are mocked out purely
// to let the module load — never actually called here.
vi.mock("@/app/actions/player-store-actions", () => ({
  hasPlayedAction: vi.fn(),
  getResultAction: vi.fn(),
  saveResultAction: vi.fn(),
  getStatsAction: vi.fn(),
}));

function makeResult(overrides: Partial<PlayResult> = {}): PlayResult {
  return {
    episodeNumber: 281,
    puzzleId: "puzzle-281",
    playedDate: "2026-07-31",
    isPractice: false,
    clueTexts: ["Sesame", "Quality", "Baker", "Coronation", "Fleet"],
    revealedClueCount: 2,
    guessedCorrectly: true,
    totalScore: 5000,
    ...overrides,
  };
}

describe("LocalStoragePlayerStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null and default stats when nothing has been played", async () => {
    const store = getPlayerStore(null);
    expect(await store.getResult(281)).toBeNull();
    expect(await store.hasPlayed(281)).toBe(false);
    expect(await store.getStats()).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      gamesPlayed: 0,
      averageScore: 0,
      lastPlayedDate: null,
    });
  });

  it("saves and retrieves a result by episode number", async () => {
    const store = getPlayerStore(null);
    const result = makeResult();
    await store.saveResult(result);
    expect(await store.getResult(281)).toEqual(result);
    expect(await store.hasPlayed(281)).toBe(true);
  });

  it("starts a streak of 1 on the first non-practice play", async () => {
    const store = getPlayerStore(null);
    const stats = await store.saveResult(makeResult({ playedDate: "2026-07-31" }));
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.averageScore).toBe(5000);
    expect(stats.lastPlayedDate).toBe("2026-07-31");
  });

  it("continues the streak across consecutive days and averages scores", async () => {
    const store = getPlayerStore(null);
    await store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-31", totalScore: 5000 }));
    const stats = await store.saveResult(
      makeResult({ episodeNumber: 282, playedDate: "2026-08-01", totalScore: 3000 })
    );
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.averageScore).toBe(4000);
  });

  it("resets the streak after a missed day but keeps the longest streak on record", async () => {
    const store = getPlayerStore(null);
    await store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-29" }));
    await store.saveResult(makeResult({ episodeNumber: 282, playedDate: "2026-07-30" }));
    const stats = await store.saveResult(makeResult({ episodeNumber: 283, playedDate: "2026-08-02" }));
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(2);
  });

  it("does not affect streak/stats for a practice play", async () => {
    const store = getPlayerStore(null);
    await store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-31" }));
    const statsBefore = await store.getStats();

    const statsAfter = await store.saveResult(
      makeResult({ episodeNumber: 281, playedDate: "2026-07-31", isPractice: true, totalScore: 9999 })
    );

    expect(statsAfter).toEqual(statsBefore);
    // The practice result is still recorded so the UI can show it...
    expect((await store.getResult(281))?.isPractice).toBe(true);
    // ...but the earlier real completion is still remembered, so the
    // "one real play per puzzle per day" rule isn't forgotten by replaying.
    expect(await store.hasPlayed(281)).toBe(true);
  });
});
