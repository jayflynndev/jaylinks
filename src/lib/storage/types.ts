/** Per-question outcome, used both for scoring history and the share-card emoji grid. */
export interface QuestionResult {
  correct: boolean;
  /** Points banked for this question (0 if missed/revealed/timed out). */
  pointsBanked: number;
}

/** One completed (or practice) play of a puzzle. */
export interface PlayResult {
  episodeNumber: number;
  puzzleId: string;
  /** Europe/London calendar date ("YYYY-MM-DD") this was played on — see src/lib/time/london.ts. */
  playedDate: string;
  /** True for replays of an already-completed puzzle — these don't affect stats/streak. */
  isPractice: boolean;
  /** Always 5 entries, in question order. */
  questionResults: QuestionResult[];
  linkBonus: number;
  /** How many answers were revealed when the link was correctly guessed, or null if never guessed. */
  linkGuessedAfterRevealedCount: number | null;
  totalScore: number;
}

/** Aggregate player stats derived from all non-practice PlayResults. */
export interface PlayerStats {
  currentStreak: number;
  longestStreak: number;
  /** Count of non-practice completed puzzles. */
  gamesPlayed: number;
  averageScore: number;
  /** Europe/London calendar date of the last non-practice play, or null. */
  lastPlayedDate: string | null;
}
