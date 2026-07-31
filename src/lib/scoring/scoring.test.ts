import { describe, expect, it } from "vitest";
import {
  DRAIN_DURATION_MS,
  EXTRA_TIME_AFTER_FLOOR_MS,
  LINK_BONUS_TIERS,
  METER_FLOOR,
  METER_START,
  QUESTION_TIMEOUT_MS,
  WRONG_GUESS_PENALTY,
  currentQuestionScore,
  isLinkGuessAvailable,
  isQuestionTimedOut,
  linkBonusForRevealedCount,
  meterValueAtElapsed,
} from "./scoring";

describe("meterValueAtElapsed", () => {
  it("starts at METER_START when no time has elapsed", () => {
    expect(meterValueAtElapsed(0)).toBe(METER_START);
  });

  it("treats negative elapsed time the same as zero", () => {
    expect(meterValueAtElapsed(-500)).toBe(METER_START);
  });

  it("drains linearly to the halfway point", () => {
    const half = DRAIN_DURATION_MS / 2;
    const expected = METER_START - (METER_START - METER_FLOOR) / 2;
    expect(meterValueAtElapsed(half)).toBe(Math.round(expected));
  });

  it("hits exactly METER_FLOOR at the end of the drain duration", () => {
    expect(meterValueAtElapsed(DRAIN_DURATION_MS)).toBe(METER_FLOOR);
  });

  it("holds at METER_FLOOR after the drain duration", () => {
    expect(meterValueAtElapsed(DRAIN_DURATION_MS + 10_000)).toBe(METER_FLOOR);
  });
});

describe("currentQuestionScore", () => {
  it("equals the drained meter value with zero wrong guesses", () => {
    expect(currentQuestionScore(0, 0)).toBe(METER_START);
    expect(currentQuestionScore(DRAIN_DURATION_MS, 0)).toBe(METER_FLOOR);
  });

  it("subtracts WRONG_GUESS_PENALTY per wrong guess", () => {
    expect(currentQuestionScore(0, 1)).toBe(METER_START - WRONG_GUESS_PENALTY);
    expect(currentQuestionScore(0, 3)).toBe(METER_START - 3 * WRONG_GUESS_PENALTY);
  });

  it("never drops below METER_FLOOR even with many wrong guesses", () => {
    expect(currentQuestionScore(0, 50)).toBe(METER_FLOOR);
  });

  it("combines drain and penalties correctly mid-question", () => {
    // At the drain halfway point the meter is 550; two wrong guesses take 200 more.
    const half = DRAIN_DURATION_MS / 2;
    expect(currentQuestionScore(half, 2)).toBe(550 - 200);
  });
});

describe("isQuestionTimedOut", () => {
  it("is false before the timeout", () => {
    expect(isQuestionTimedOut(0)).toBe(false);
    expect(isQuestionTimedOut(DRAIN_DURATION_MS)).toBe(false);
    expect(isQuestionTimedOut(QUESTION_TIMEOUT_MS - 1)).toBe(false);
  });

  it("is true at and after the timeout (drain + grace period)", () => {
    expect(QUESTION_TIMEOUT_MS).toBe(DRAIN_DURATION_MS + EXTRA_TIME_AFTER_FLOOR_MS);
    expect(isQuestionTimedOut(QUESTION_TIMEOUT_MS)).toBe(true);
    expect(isQuestionTimedOut(QUESTION_TIMEOUT_MS + 1)).toBe(true);
  });
});

describe("link bonus", () => {
  it("is available starting from the first revealed answer", () => {
    expect(isLinkGuessAvailable(0)).toBe(false);
    expect(isLinkGuessAvailable(1)).toBe(true);
    expect(isLinkGuessAvailable(5)).toBe(true);
    expect(isLinkGuessAvailable(6)).toBe(false);
  });

  it("maps revealed count 1-5 to the documented bonus tiers", () => {
    expect(LINK_BONUS_TIERS).toEqual([2500, 2000, 1500, 1000, 500]);
    expect(linkBonusForRevealedCount(1)).toBe(2500);
    expect(linkBonusForRevealedCount(2)).toBe(2000);
    expect(linkBonusForRevealedCount(3)).toBe(1500);
    expect(linkBonusForRevealedCount(4)).toBe(1000);
    expect(linkBonusForRevealedCount(5)).toBe(500);
  });

  it("returns 0 outside the valid revealed-count range", () => {
    expect(linkBonusForRevealedCount(0)).toBe(0);
    expect(linkBonusForRevealedCount(6)).toBe(0);
  });
});
