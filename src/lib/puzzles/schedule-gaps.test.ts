import { describe, expect, it } from "vitest";
import { findScheduleGaps } from "./schedule-gaps";

describe("findScheduleGaps", () => {
  it("returns no gaps for an empty or single-date list", () => {
    expect(findScheduleGaps([])).toEqual([]);
    expect(findScheduleGaps(["2026-08-01"])).toEqual([]);
  });

  it("returns no gaps for consecutive dates", () => {
    expect(findScheduleGaps(["2026-08-01", "2026-08-02", "2026-08-03"])).toEqual([]);
  });

  it("finds a single-day gap", () => {
    expect(findScheduleGaps(["2026-08-01", "2026-08-03"])).toEqual([
      { afterDate: "2026-08-01", beforeDate: "2026-08-03", missingDays: 1 },
    ]);
  });

  it("finds a multi-day gap", () => {
    expect(findScheduleGaps(["2026-08-01", "2026-08-06"])).toEqual([
      { afterDate: "2026-08-01", beforeDate: "2026-08-06", missingDays: 4 },
    ]);
  });

  it("finds multiple gaps across a longer schedule", () => {
    expect(findScheduleGaps(["2026-08-01", "2026-08-02", "2026-08-05", "2026-08-06", "2026-08-10"])).toEqual([
      { afterDate: "2026-08-02", beforeDate: "2026-08-05", missingDays: 2 },
      { afterDate: "2026-08-06", beforeDate: "2026-08-10", missingDays: 3 },
    ]);
  });

  it("sorts unordered input and ignores duplicate dates", () => {
    expect(findScheduleGaps(["2026-08-05", "2026-08-01", "2026-08-01", "2026-08-02"])).toEqual([
      { afterDate: "2026-08-02", beforeDate: "2026-08-05", missingDays: 2 },
    ]);
  });
});
