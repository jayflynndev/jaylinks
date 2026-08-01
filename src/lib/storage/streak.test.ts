import { describe, expect, it } from "vitest";
import { computeStreakUpdate } from "./streak";

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
