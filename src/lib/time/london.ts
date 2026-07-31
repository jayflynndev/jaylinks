/**
 * Europe/London date utilities — the single source of truth for "what day
 * is it" throughout the app (puzzle unlock dates, streaks, the "next
 * puzzle" countdown). Per the product brief this is non-negotiable: puzzles
 * unlock at UK midnight, which is NOT the same as the player's local
 * midnight, and NOT a fixed UTC offset (the UK observes British Summer
 * Time, so the offset is +00:00 in winter and +01:00 in summer).
 *
 * We intentionally avoid manual UTC-offset math (easy to get wrong across
 * the BST transition) and instead lean on the environment's IANA tz
 * database via Intl, which Node.js and all modern browsers ship with.
 */

const LONDON_TZ = "Europe/London";

// Reused across calls; Intl.DateTimeFormat construction isn't free.
const londonDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LONDON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Returns the current (or given) instant's calendar date in Europe/London,
 * as "YYYY-MM-DD". "en-CA" locale formats dates in that order by default,
 * which conveniently matches Postgres `date` text representation and
 * sorts/compares correctly as a plain string.
 */
export function londonDateString(instant: Date = new Date()): string {
  return londonDateFormatter.format(instant);
}

/**
 * True if two instants fall on the same Europe/London calendar day.
 * Used to decide "has this player already played today's puzzle" instead
 * of comparing raw timestamps, which would be wrong near midnight for
 * players in other timezones.
 */
export function isSameLondonDay(a: Date, b: Date): boolean {
  return londonDateString(a) === londonDateString(b);
}

/**
 * Milliseconds from `from` until the next Europe/London midnight (the
 * start of the following London calendar day). Used for the "next puzzle
 * unlocks in..." countdown on the results screen.
 *
 * Implementation: rather than guessing a UTC offset, we binary-search for
 * the instant where londonDateString() flips to tomorrow's date. This is a
 * few extra iterations of cheap Intl formatting, but it's correct across
 * the BST/GMT transition without hand-rolling DST rules.
 */
export function millisecondsUntilNextLondonMidnight(from: Date = new Date()): number {
  const today = londonDateString(from);

  // Coarse upper bound: London midnight is never more than ~25h away (25h
  // to safely cover the one day a year clocks go back and a London day is
  // 25h long). Start the search window there and binary-search down to the
  // exact millisecond the calendar date flips.
  let lo = from.getTime();
  let hi = from.getTime() + 25 * 60 * 60 * 1000;

  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (londonDateString(new Date(mid)) === today) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return hi - from.getTime();
}

/**
 * Parses a "YYYY-MM-DD" puzzle publish_date (as stored in Postgres) and
 * returns whether it is due to have unlocked by `now`, i.e. `now`'s
 * London calendar date is on or after the publish date. Used server-side
 * to decide which puzzle is "today's puzzle" regardless of what date the
 * player's device thinks it is.
 */
export function isPublishDateUnlocked(publishDate: string, now: Date = new Date()): boolean {
  return londonDateString(now) >= publishDate;
}
