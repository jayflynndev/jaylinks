/** One completed (or practice) play of a puzzle. */
export interface PlayResult {
  episodeNumber: number;
  puzzleId: string;
  /** Europe/London calendar date ("YYYY-MM-DD") this was played on — see src/lib/time/london.ts. */
  playedDate: string;
  /** True for replays of an already-completed puzzle — these don't affect stats/streak. */
  isPractice: boolean;
  /** All 5 clue words, in reveal order — always fully known once the round ends, guessed or not. */
  clueTexts: string[];
  /** How many clues had revealed at the moment the round ended (correct guess or timeout). */
  revealedClueCount: number;
  guessedCorrectly: boolean;
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
