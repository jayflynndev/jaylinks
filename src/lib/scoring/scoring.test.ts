import { describe, expect, it } from "vitest";
import {
  CLUE_COUNT,
  CLUE_REVEAL_INTERVAL_MS,
  EXTRA_TIME_AFTER_FLOOR_MS,
  METER_FLOOR,
  METER_START,
  ROUND_DRAIN_DURATION_MS,
  ROUND_TIMEOUT_MS,
  isRoundTimedOut,
  meterValueAtElapsed,
  revealedClueCount,
} from "./scoring";

describe("meterValueAtElapsed", () => {
  it("starts at METER_START when no time has elapsed", () => {
    expect(meterValueAtElapsed(0)).toBe(METER_START);
  });

  it("treats negative elapsed time the same as zero", () => {
    expect(meterValueAtElapsed(-500)).toBe(METER_START);
  });

  it("drains linearly to the halfway point", () => {
    const half = ROUND_DRAIN_DURATION_MS / 2;
    const expected = METER_START - (METER_START - METER_FLOOR) / 2;
    expect(meterValueAtElapsed(half)).toBe(Math.round(expected));
  });

  it("hits exactly METER_FLOOR at the end of the drain duration", () => {
    expect(meterValueAtElapsed(ROUND_DRAIN_DURATION_MS)).toBe(METER_FLOOR);
  });

  it("holds at METER_FLOOR after the drain duration", () => {
    expect(meterValueAtElapsed(ROUND_DRAIN_DURATION_MS + 10_000)).toBe(METER_FLOOR);
  });
});

describe("isRoundTimedOut", () => {
  it("is false before the timeout", () => {
    expect(isRoundTimedOut(0)).toBe(false);
    expect(isRoundTimedOut(ROUND_DRAIN_DURATION_MS)).toBe(false);
    expect(isRoundTimedOut(ROUND_TIMEOUT_MS - 1)).toBe(false);
  });

  it("is true at and after the timeout (drain + grace period)", () => {
    expect(ROUND_TIMEOUT_MS).toBe(ROUND_DRAIN_DURATION_MS + EXTRA_TIME_AFTER_FLOOR_MS);
    expect(isRoundTimedOut(ROUND_TIMEOUT_MS)).toBe(true);
    expect(isRoundTimedOut(ROUND_TIMEOUT_MS + 1)).toBe(true);
  });
});

describe("revealedClueCount", () => {
  it("reveals the first clue immediately", () => {
    expect(revealedClueCount(0)).toBe(1);
    expect(revealedClueCount(-100)).toBe(1);
  });

  it("holds at 1 until the first interval elapses", () => {
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS - 1)).toBe(1);
  });

  it("reveals a new clue exactly on each interval boundary", () => {
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS)).toBe(2);
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS * 2)).toBe(3);
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS * 3)).toBe(4);
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS * 4)).toBe(5);
  });

  it("caps at CLUE_COUNT even long after all clues have revealed", () => {
    expect(revealedClueCount(CLUE_REVEAL_INTERVAL_MS * 100)).toBe(CLUE_COUNT);
  });
});
