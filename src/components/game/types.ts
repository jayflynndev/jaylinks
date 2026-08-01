/** What a resolved question hands back to the game loop. */
export interface QuestionOutcome {
  correct: boolean;
  pointsBanked: number;
  answerText: string;
}

/** One entry in the growing list of already-answered questions, shown throughout the puzzle and in the results breakdown. */
export interface RevealedAnswer {
  questionText: string;
  answerText: string;
  correct: boolean;
}

/** What a correct link guess hands back to the game loop. */
export interface LinkGuessOutcome {
  bonus: number;
  revealedAtCount: number;
  linkText: string;
}
