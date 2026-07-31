/**
 * Pure streak-counting math, kept separate from the storage layer so it's
 * easy to unit test. Dates in/out are Europe/London calendar dates as
 * "YYYY-MM-DD" strings (see src/lib/time/london.ts) — never JS Dates or
 * instants, since streaks are about calendar days, not 24-hour periods.
 */

/**
 * Parses a "YYYY-MM-DD" string as a UTC-midnight timestamp purely for day
 * arithmetic. This is safe (no timezone ambiguity) specifically because
 * the input is already a calendar date, not an instant — we're not
 * converting a real moment in time, just diffing two labelled days.
 */
function parseDateStringAsUTC(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole-day difference between two "YYYY-MM-DD" dates (`to` minus `from`). */
export function daysBetweenDateStrings(from: string, to: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((parseDateStringAsUTC(to) - parseDateStringAsUTC(from)) / MS_PER_DAY);
}

/**
 * Computes the new streak count after a non-practice play on `newPlayDate`,
 * given the previous streak and the date of the last non-practice play (or
 * null if this is the player's first ever completed puzzle).
 *
 * - First play ever → streak starts at 1.
 * - Same day as last play → streak unchanged (idempotent; shouldn't
 *   normally happen since only one non-practice play per puzzle per day
 *   is recorded, but this keeps the function safe to call defensively).
 * - Exactly one day after the last play → streak continues (+1).
 * - Any bigger gap (missed a day, or an out-of-order date) → streak
 *   resets to 1, since a streak means *consecutive* days.
 */
export function computeStreakUpdate(
  previousStreak: number,
  lastPlayedDate: string | null,
  newPlayDate: string
): number {
  if (lastPlayedDate === null) return 1;

  const dayDiff = daysBetweenDateStrings(lastPlayedDate, newPlayDate);
  if (dayDiff === 0) return previousStreak;
  if (dayDiff === 1) return previousStreak + 1;
  return 1;
}
