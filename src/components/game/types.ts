/** What a correct link guess hands back to the game loop. */
export interface LinkGuessOutcome {
  /** The points meter's value at the moment of the correct guess — this is what gets banked. */
  score: number;
  /** How many clues had revealed at the moment of the correct guess. */
  revealedClueCount: number;
  linkText: string;
}
