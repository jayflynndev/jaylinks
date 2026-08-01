import { daysBetweenDateStrings } from "@/lib/time/date-math";

export interface ScheduleGap {
  afterDate: string;
  beforeDate: string;
  missingDays: number;
}

/**
 * Given a list of dated (Daily-category) puzzle publish dates, finds gaps
 * of more than one day between consecutive scheduled dates — surfaced as
 * warnings on the admin dashboard so Jay notices a missing day before it
 * arrives. Duplicate dates collapse to one (a same-day double-booking is
 * already prevented by the DB's unique index, not this check). Order of
 * the input doesn't matter — this sorts internally.
 */
export function findScheduleGaps(publishDates: string[]): ScheduleGap[] {
  const sorted = [...new Set(publishDates)].sort();
  const gaps: ScheduleGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = daysBetweenDateStrings(sorted[i], sorted[i + 1]);
    if (diff > 1) {
      gaps.push({ afterDate: sorted[i], beforeDate: sorted[i + 1], missingDays: diff - 1 });
    }
  }

  return gaps;
}
