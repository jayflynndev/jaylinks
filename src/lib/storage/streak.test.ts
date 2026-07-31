import { describe, expect, it } from "vitest";
import { computeStreakUpdate, daysBetweenDateStrings } from "./streak";

describe("daysBetweenDateStrings", () => {
  it("is 0 for the same date", () => {
    expect(daysBetweenDateStrings("2026-07-31", "2026-07-31")).toBe(0);
  });

  it("is 1 for consecutive days", () => {
    expect(daysBetweenDateStrings("2026-07-31", "2026-08-01")).toBe(1);
  });

  it("handles month and year rollovers", () => {
    expect(daysBetweenDateStrings("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("can be negative for an out-of-order pair", () => {
    expect(daysBetweenDateStrings("2026-08-01", "2026-07-31")).toBe(-1);
  });
});

describe("computeStreakUpdate", () => {
  it("starts a new streak at 1 on the very first play", () => {
    expect(computeStreakUpdate(0, null, "2026-07-31")).toBe(1);
  });

  it("continues the streak for a play on the very next day", () => {
    expect(computeStreakUpdate(5, "2026-07-30", "2026-07-31")).toBe(6);
  });

  it("resets to 1 after a missed day", () => {
    expect(computeStreakUpdate(5, "2026-07-29", "2026-07-31")).toBe(1);
  });

  it("leaves the streak unchanged for a same-day call", () => {
    expect(computeStreakUpdate(5, "2026-07-31", "2026-07-31")).toBe(5);
  });

  it("resets to 1 for an out-of-order date", () => {
    expect(computeStreakUpdate(5, "2026-07-31", "2026-07-30")).toBe(1);
  });
});
