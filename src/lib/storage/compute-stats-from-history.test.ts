import { describe, expect, it } from "vitest";
import { computeStatsFromHistory } from "./compute-stats-from-history";

describe("computeStatsFromHistory", () => {
  it("returns zeroed stats for an empty history", () => {
    expect(computeStatsFromHistory([])).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      gamesPlayed: 0,
      averageScore: 0,
      lastPlayedDate: null,
    });
  });

  it("computes stats for a single play", () => {
    expect(computeStatsFromHistory([{ playedDate: "2026-07-31", totalScore: 800 }])).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      gamesPlayed: 1,
      averageScore: 800,
      lastPlayedDate: "2026-07-31",
    });
  });

  it("continues the streak across consecutive days", () => {
    const stats = computeStatsFromHistory([
      { playedDate: "2026-07-29", totalScore: 500 },
      { playedDate: "2026-07-30", totalScore: 700 },
      { playedDate: "2026-07-31", totalScore: 900 },
    ]);
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.averageScore).toBeCloseTo(700);
    expect(stats.lastPlayedDate).toBe("2026-07-31");
  });

  it("resets the current streak after a gap but keeps the longest streak from before it", () => {
    const stats = computeStatsFromHistory([
      { playedDate: "2026-07-20", totalScore: 100 },
      { playedDate: "2026-07-21", totalScore: 100 },
      { playedDate: "2026-07-22", totalScore: 100 },
      // gap — 23rd and 24th missed
      { playedDate: "2026-07-25", totalScore: 100 },
    ]);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(3);
    expect(stats.gamesPlayed).toBe(4);
  });

  it("averages scores correctly across an uneven set", () => {
    const stats = computeStatsFromHistory([
      { playedDate: "2026-07-29", totalScore: 1000 },
      { playedDate: "2026-07-30", totalScore: 0 },
      { playedDate: "2026-07-31", totalScore: 500 },
    ]);
    expect(stats.averageScore).toBeCloseTo(500);
  });
});
