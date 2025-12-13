export function msUntilNextLondonMidnight(now = new Date()): number {
  // Next midnight in Europe/London.
  // We compute London "today", then create a Date for tomorrow 00:00 in London by using Intl parts.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));

  // Treat London date parts as if they are in UTC for day math; then we’ll add one day.
  const londonMidnightUTC = new Date(Date.UTC(y, m - 1, d));
  const next = new Date(londonMidnightUTC);
  next.setUTCDate(next.getUTCDate() + 1);

  // This gives an instant; difference is stable enough for a countdown display.
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
