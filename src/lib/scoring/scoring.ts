/**
 * Pure scoring math for the game loop — no timers, no React, no I/O. The
 * timer/UI layer (milestone 4e) calls these functions with elapsed
 * milliseconds it has tracked itself (pausing while an input is focused,
 * per the product brief), keeping the actual scoring rules in one place
 * that's easy to reason about and unit test.
 */

/** Points meter starts here for every question. */
export const METER_START = 1000;

/** Points meter never drains (or gets penalised) below this floor. */
export const METER_FLOOR = 100;

/** Time for the meter to drain from METER_START to METER_FLOOR. */
export const DRAIN_DURATION_MS = 15_000;

/** Points lost per wrong guess (never below METER_FLOOR). */
export const WRONG_GUESS_PENALTY = 100;

/**
 * Once the meter hits the floor, the player still has this long to keep
 * guessing before the question auto-reveals with 0 points.
 */
export const EXTRA_TIME_AFTER_FLOOR_MS = 5_000;

/** Total time (from question start) before a question auto-reveals unanswered. */
export const QUESTION_TIMEOUT_MS = DRAIN_DURATION_MS + EXTRA_TIME_AFTER_FLOOR_MS;

/**
 * The points meter's value from time-drain alone, given how many
 * milliseconds of *active* (non-paused) time have elapsed since the
 * question started. Linear drain from METER_START to METER_FLOOR over
 * DRAIN_DURATION_MS, then holds at the floor.
 */
export function meterValueAtElapsed(activeElapsedMs: number): number {
  if (activeElapsedMs <= 0) return METER_START;
  if (activeElapsedMs >= DRAIN_DURATION_MS) return METER_FLOOR;

  const drained = (METER_START - METER_FLOOR) * (activeElapsedMs / DRAIN_DURATION_MS);
  return Math.round(METER_START - drained);
}

/**
 * The score a correct guess would bank right now: time-drain value minus
 * WRONG_GUESS_PENALTY for every prior wrong guess on this question, never
 * below METER_FLOOR. This is also what the UI displays as the live meter,
 * since a wrong guess's penalty should be visible immediately.
 */
export function currentQuestionScore(activeElapsedMs: number, wrongGuessCount: number): number {
  const drainedValue = meterValueAtElapsed(activeElapsedMs);
  const penalised = drainedValue - WRONG_GUESS_PENALTY * wrongGuessCount;
  return Math.max(METER_FLOOR, penalised);
}

/**
 * True once a question's total time budget (drain + the extra grace
 * period after hitting the floor) has elapsed — the UI should auto-reveal
 * the answer and award 0 points.
 */
export function isQuestionTimedOut(activeElapsedMs: number): boolean {
  return activeElapsedMs >= QUESTION_TIMEOUT_MS;
}

/**
 * Link-guess bonus by how many answers have been revealed at guess time.
 * Per product decision: the "I KNOW THE LINK!" button is available from
 * the moment the first answer is revealed (not "from question 2" as an
 * earlier draft of the brief suggested — confirmed directly), with the
 * bonus decreasing the more answers the player has seen. Index 0 here
 * corresponds to 1 revealed answer.
 */
export const LINK_BONUS_TIERS = [2500, 2000, 1500, 1000, 500] as const;

/** True once a link guess is allowed — as soon as the first answer is revealed. */
export function isLinkGuessAvailable(revealedCount: number): boolean {
  return revealedCount >= 1 && revealedCount <= LINK_BONUS_TIERS.length;
}

/**
 * The link bonus for guessing correctly with `revealedCount` answers
 * revealed. Returns 0 outside the valid 1-5 range (e.g. guessing before
 * any answer is revealed, which the UI shouldn't allow in the first
 * place — see isLinkGuessAvailable) rather than throwing, since this may
 * be called from UI code that's easier to write defensively than to prove
 * exhaustively correct.
 */
export function linkBonusForRevealedCount(revealedCount: number): number {
  if (!isLinkGuessAvailable(revealedCount)) return 0;
  return LINK_BONUS_TIERS[revealedCount - 1];
}
