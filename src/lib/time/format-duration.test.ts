import { describe, expect, it } from "vitest";
import { formatCountdown } from "./format-duration";

describe("formatCountdown", () => {
  it("formats zero as 00:00:00", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatCountdown(61_000)).toBe("00:01:01");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatCountdown(3_661_000)).toBe("01:01:01");
  });

  it("rounds up to the nearest second rather than truncating", () => {
    // 1500ms remaining should read as 2 seconds left, not 1.
    expect(formatCountdown(1_500)).toBe("00:00:02");
  });

  it("clamps negative durations to zero", () => {
    expect(formatCountdown(-5000)).toBe("00:00:00");
  });
});
