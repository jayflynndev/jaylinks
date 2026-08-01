import { describe, expect, it } from "vitest";
import {
  isPublishDateUnlocked,
  isSameLondonDay,
  londonDateString,
  millisecondsUntilNextLondonMidnight,
  startOfLondonDay,
} from "./london";

describe("londonDateString", () => {
  it("matches London's calendar date in winter (GMT, UTC+0)", () => {
    expect(londonDateString(new Date("2026-01-15T10:00:00Z"))).toBe("2026-01-15");
  });

  it("matches London's calendar date in summer (BST, UTC+1) — after UTC midnight but still London's previous day", () => {
    // 2026-07-15T00:30:00Z is 01:30 BST, already the 15th in London.
    expect(londonDateString(new Date("2026-07-15T00:30:00Z"))).toBe("2026-07-15");
    // 2026-07-14T22:30:00Z is 23:30 BST on the 14th — still the 14th in London.
    expect(londonDateString(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-14");
  });
});

describe("isSameLondonDay", () => {
  it("is true for two instants on the same London calendar day", () => {
    expect(isSameLondonDay(new Date("2026-01-15T00:05:00Z"), new Date("2026-01-15T23:55:00Z"))).toBe(
      true
    );
  });

  it("is false across a London midnight boundary even if UTC dates match", () => {
    // Both instants share a UTC date in summer, but 23:30 BST and 00:30 BST are different London days.
    expect(isSameLondonDay(new Date("2026-07-14T22:30:00Z"), new Date("2026-07-15T00:30:00Z"))).toBe(
      false
    );
  });
});

describe("startOfLondonDay", () => {
  it("returns UTC midnight in winter (GMT, UTC+0)", () => {
    const start = startOfLondonDay(new Date("2026-01-15T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("returns 23:00 UTC the previous day in summer (BST, UTC+1)", () => {
    const start = startOfLondonDay(new Date("2026-07-15T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-07-14T23:00:00.000Z");
  });

  it("is always on the same London calendar day as `now`, and never after it", () => {
    const now = new Date("2026-07-15T10:00:00Z");
    const start = startOfLondonDay(now);
    expect(londonDateString(start)).toBe(londonDateString(now));
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it("is consistent with millisecondsUntilNextLondonMidnight (exactly one day apart on a non-transition day)", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const start = startOfLondonDay(now);
    const nextMidnight = now.getTime() + millisecondsUntilNextLondonMidnight(now);
    expect(nextMidnight - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe("millisecondsUntilNextLondonMidnight", () => {
  it("counts down to exactly zero at the moment of the next London midnight", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const remaining = millisecondsUntilNextLondonMidnight(now);
    const nextMidnight = new Date(now.getTime() + remaining);
    expect(londonDateString(nextMidnight)).toBe("2026-01-16");
    expect(londonDateString(new Date(nextMidnight.getTime() - 1))).toBe("2026-01-15");
  });
});

describe("isPublishDateUnlocked", () => {
  it("is true once London's current date is on or after the publish date", () => {
    expect(isPublishDateUnlocked("2026-01-15", new Date("2026-01-15T00:00:01Z"))).toBe(true);
    expect(isPublishDateUnlocked("2026-01-15", new Date("2026-01-20T00:00:00Z"))).toBe(true);
  });

  it("is false before the publish date has arrived in London", () => {
    expect(isPublishDateUnlocked("2026-01-15", new Date("2026-01-14T23:59:59Z"))).toBe(false);
  });
});
