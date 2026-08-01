import type { QuestionResult } from "@/lib/storage/types";

/**
 * Share-card text generation — the emoji grid + score summary players post
 * after finishing a puzzle. Kept as pure functions (no DOM/clipboard/Web
 * Share API here — see ShareButton for that) so the exact text format is
 * easy to unit test.
 */

/** Banked score at/above this counts as a "fast" correct answer for the emoji grid. */
const FAST_CORRECT_THRESHOLD = 700;

/** 🟩 fast correct (≥700 banked), 🟨 slower correct, 🟥 missed — per the product brief's share-card legend. */
export function questionEmoji(result: QuestionResult): string {
  if (!result.correct) return "🟥";
  return result.pointsBanked >= FAST_CORRECT_THRESHOLD ? "🟩" : "🟨";
}

export function buildShareGrid(questionResults: QuestionResult[]): string {
  return questionResults.map(questionEmoji).join("");
}

export interface ShareTextParams {
  episodeNumber: number;
  questionResults: QuestionResult[];
  /** How many answers were revealed when the link was guessed, or null if never guessed. */
  linkGuessedAfterRevealedCount: number | null;
  totalScore: number;
  /** The app's URL, appended as the last line — read from window.location.origin by the caller. */
  appUrl: string;
}

/**
 * Builds the shareable text block, e.g.:
 *
 *   Jay's Links #281 🔗
 *   🟩🟩🟨🟥🟩 + 🔗×3
 *   Score: 4,750
 *   https://jayslinks.example
 *
 * The "🔗×N" suffix only appears if the link was guessed — a puzzle
 * finished without guessing the link just shows the emoji grid and score.
 */
export function buildShareText(params: ShareTextParams): string {
  const grid = buildShareGrid(params.questionResults);
  const linkSuffix =
    params.linkGuessedAfterRevealedCount !== null
      ? ` + 🔗×${params.linkGuessedAfterRevealedCount}`
      : "";

  return [
    `Jay's Links #${params.episodeNumber} 🔗`,
    `${grid}${linkSuffix}`,
    `Score: ${params.totalScore.toLocaleString("en-GB")}`,
    params.appUrl,
  ].join("\n");
}
