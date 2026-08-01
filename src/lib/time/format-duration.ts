/**
 * Formats a millisecond duration as a zero-padded "HH:MM:SS" countdown
 * string — used for the "next puzzle unlocks in..." display on the
 * results screen. Rounds up to the nearest second (so a countdown never
 * flashes "00:00:00" while there's still sub-second time left) and clamps
 * negative input to zero rather than showing a negative countdown.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
