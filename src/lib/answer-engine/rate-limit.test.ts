import { describe, expect, it } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  it("allows the first 30 requests in a window and rejects the 31st", () => {
    const key = "session-a";
    const start = 1_000_000;
    for (let i = 0; i < 30; i++) {
      expect(isRateLimited(key, start + i)).toBe(false);
    }
    expect(isRateLimited(key, start + 30)).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const start = 2_000_000;
    for (let i = 0; i < 30; i++) {
      isRateLimited("session-b", start + i);
    }
    // session-b is now over budget, but a fresh key should still be allowed.
    expect(isRateLimited("session-b", start + 30)).toBe(true);
    expect(isRateLimited("session-c", start + 30)).toBe(false);
  });

  it("resets the count once the window elapses", () => {
    const key = "session-d";
    const start = 3_000_000;
    for (let i = 0; i < 30; i++) {
      isRateLimited(key, start + i);
    }
    expect(isRateLimited(key, start + 30)).toBe(true); // still in-window, over budget
    expect(isRateLimited(key, start + 60_000)).toBe(false); // new window
  });
});
