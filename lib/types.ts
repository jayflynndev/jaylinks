export type PuzzleV1 = {
  id: number;
  dateISO: string; // YYYY-MM-DD in Europe/London
  options: { id: string; label: string }[]; // 9–16
  answerOptionId: string;
  clues: string[]; // 3–5, max 5
  explanation: string; // 1–2 sentences
};

export type DayStatus = "in_progress" | "solved" | "revealed";

export type DayResultV1 = {
  dateISO: string;
  puzzleId: number;
  status: DayStatus;
  clueIndex: number; // 0-based
  eliminatedOptionIds: string[];
  guesses: string[];
  completedAtISO?: string;
  cluesUsed?: number;
};

export type StatsV1 = {
  played: number;
  completed: number;
  currentStreak: number;
  longestStreak: number;
  avgCluesUsed: number;
};

export type LocalStateV1 = {
  version: 1;
  history: Record<string, DayResultV1>;
  stats: StatsV1;
};
