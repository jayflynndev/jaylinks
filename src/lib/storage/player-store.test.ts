// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { getPlayerStore } from "./player-store";
import type { PlayResult } from "./types";

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

  it("returns null and default stats when nothing has been played", () => {
    const store = getPlayerStore();
    expect(store.getResult(281)).toBeNull();
    expect(store.hasPlayed(281)).toBe(false);
    expect(store.getStats()).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      gamesPlayed: 0,
      averageScore: 0,
      lastPlayedDate: null,
    });
  });

  it("saves and retrieves a result by episode number", () => {
    const store = getPlayerStore();
    const result = makeResult();
    store.saveResult(result);
    expect(store.getResult(281)).toEqual(result);
    expect(store.hasPlayed(281)).toBe(true);
  });

  it("starts a streak of 1 on the first non-practice play", () => {
    const store = getPlayerStore();
    const stats = store.saveResult(makeResult({ playedDate: "2026-07-31" }));
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.averageScore).toBe(5000);
    expect(stats.lastPlayedDate).toBe("2026-07-31");
  });

  it("continues the streak across consecutive days and averages scores", () => {
    const store = getPlayerStore();
    store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-31", totalScore: 5000 }));
    const stats = store.saveResult(
      makeResult({ episodeNumber: 282, playedDate: "2026-08-01", totalScore: 3000 })
    );
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.averageScore).toBe(4000);
  });

  it("resets the streak after a missed day but keeps the longest streak on record", () => {
    const store = getPlayerStore();
    store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-29" }));
    store.saveResult(makeResult({ episodeNumber: 282, playedDate: "2026-07-30" }));
    const stats = store.saveResult(makeResult({ episodeNumber: 283, playedDate: "2026-08-02" }));
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(2);
  });

  it("does not affect streak/stats for a practice play", () => {
    const store = getPlayerStore();
    store.saveResult(makeResult({ episodeNumber: 281, playedDate: "2026-07-31" }));
    const statsBefore = store.getStats();

    const statsAfter = store.saveResult(
      makeResult({ episodeNumber: 281, playedDate: "2026-07-31", isPractice: true, totalScore: 9999 })
    );

    expect(statsAfter).toEqual(statsBefore);
    // The practice result is still recorded so the UI can show it...
    expect(store.getResult(281)?.isPractice).toBe(true);
    // ...but the earlier real completion is still remembered, so the
    // "one real play per puzzle per day" rule isn't forgotten by replaying.
    expect(store.hasPlayed(281)).toBe(true);
  });
});
