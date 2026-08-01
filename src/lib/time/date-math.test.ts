import { describe, expect, it } from "vitest";
import { daysBetweenDateStrings } from "./date-math";

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

  it("handles multi-day gaps", () => {
    expect(daysBetweenDateStrings("2026-08-01", "2026-08-05")).toBe(4);
  });
});
