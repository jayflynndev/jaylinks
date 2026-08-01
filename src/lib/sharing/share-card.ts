/**
 * Share-card text generation — the short summary players post after
 * finishing a round. Kept as a pure function (no DOM/clipboard/Web Share
 * API here — see ShareButton for that) so the exact text format is easy
 * to unit test.
 */

export interface ShareTextParams {
  episodeNumber: number;
  guessedCorrectly: boolean;
  /** How many clues had revealed when the round ended (guessed or timed out). */
  revealedClueCount: number;
  totalScore: number;
  /** The app's URL, appended as the last line — read from window.location.origin by the caller. */
  appUrl: string;
}

/**
 * Builds the shareable text block, e.g.:
 *
 *   Jay's Links #281 🔗
 *   Guessed after 2 clues — 1,850 pts
 *   https://jayslinks.example
 *
 * or, if the round ended without a correct guess:
 *
 *   Jay's Links #281 🔗
 *   Missed it this time — 0 pts
 *   https://jayslinks.example
 */
export function buildShareText(params: ShareTextParams): string {
  const resultLine = params.guessedCorrectly
    ? `Guessed after ${params.revealedClueCount} clue${params.revealedClueCount === 1 ? "" : "s"} — ${params.totalScore.toLocaleString("en-GB")} pts`
    : "Missed it this time — 0 pts";

  return [`Jay's Links #${params.episodeNumber} 🔗`, resultLine, params.appUrl].join("\n");
}
