/**
 * Pure calendar-date arithmetic on "YYYY-MM-DD" strings (see
 * src/lib/time/london.ts) — never JS Dates or instants. Shared by streak
 * counting (src/lib/storage/streak.ts) and the admin dashboard's schedule
 * gap checker (src/lib/puzzles/schedule-gaps.ts).
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
