/** What a resolved question hands back to the game loop. */
export interface QuestionOutcome {
  correct: boolean;
  pointsBanked: number;
  answerText: string;
}
