/**
 * Pure scoring/timing math for the game loop — no timers, no React, no I/O.
 * The UI layer calls these functions with elapsed milliseconds it has
 * tracked itself (pausing while the guess input is open, per the product
 * brief), keeping the actual rules in one place that's easy to reason
 * about and unit test.
 *
 * The game is one continuous round per puzzle: 5 clue words auto-reveal on
 * a fixed, never-paused 5-second clock, while a single points meter drains
 * for the whole round (pausing only while the player has the guess input
 * open) until they guess the link correctly or time runs out.
 */

/** Points meter starts here when the round begins (clue 1 reveals). */
export const METER_START = 1000;

/** Points meter never drains below this floor. */
export const METER_FLOOR = 100;

/** How often a new clue reveals — independent of the points meter's pause state. */
export const CLUE_REVEAL_INTERVAL_MS = 5_000;

/** Every puzzle has exactly 5 clues. */
export const CLUE_COUNT = 5;

/**
 * Time for the points meter to drain from METER_START to METER_FLOOR.
 * Spans all 5 clue reveals (0s, 5s, 10s, 15s, 20s) with a 5s buffer so the
 * meter doesn't bottom out the instant the last clue appears. Starting
 * default — tune after seeing it live.
 */
export const ROUND_DRAIN_DURATION_MS = 25_000;

/**
 * Once the meter hits the floor, the player still has this long to guess
 * before the round auto-ends (link revealed, 0 points banked).
 */
export const EXTRA_TIME_AFTER_FLOOR_MS = 5_000;

/** Total time (from round start) before an unguessed round auto-ends. */
export const ROUND_TIMEOUT_MS = ROUND_DRAIN_DURATION_MS + EXTRA_TIME_AFTER_FLOOR_MS;

/**
 * The points meter's value given how many milliseconds of *active*
 * (non-paused) time have elapsed since the round started. Linear drain
 * from METER_START to METER_FLOOR over ROUND_DRAIN_DURATION_MS, then holds
 * at the floor. This is also exactly what a correct guess banks — the
 * meter pausing while the guess input is open is what makes "freeze the
 * score, then bank it on a correct answer" work with no extra bookkeeping.
 */
export function meterValueAtElapsed(activeElapsedMs: number): number {
  if (activeElapsedMs <= 0) return METER_START;
  if (activeElapsedMs >= ROUND_DRAIN_DURATION_MS) return METER_FLOOR;

  const drained = (METER_START - METER_FLOOR) * (activeElapsedMs / ROUND_DRAIN_DURATION_MS);
  return Math.round(METER_START - drained);
}

/**
 * True once the round's total time budget (drain + the extra grace period
 * after hitting the floor) has elapsed — the UI should auto-reveal the
 * link and award 0 points.
 */
export function isRoundTimedOut(activeElapsedMs: number): boolean {
  return activeElapsedMs >= ROUND_TIMEOUT_MS;
}

/**
 * How many clues have revealed by `elapsedMs` on the *unpaused* wall-clock
 * since the round started — clue 1 is visible immediately, then one more
 * every CLUE_REVEAL_INTERVAL_MS, capped at CLUE_COUNT. Deliberately a
 * separate clock from the points meter: clue reveals never pause, even
 * while the player has the guess input open.
 */
export function revealedClueCount(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1;
  const count = Math.floor(elapsedMs / CLUE_REVEAL_INTERVAL_MS) + 1;
  return Math.min(CLUE_COUNT, count);
}
