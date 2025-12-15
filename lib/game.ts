import { LocalStateV1, PuzzleV1 } from "./types";
import { isoMinusDays } from "./date";

export function getOrCreateDay(
  state: LocalStateV1,
  puzzle: PuzzleV1
): LocalStateV1 {
  if (state.history[puzzle.dateISO]) return state;

  const next = structuredClone(state);
  next.history[puzzle.dateISO] = {
    dateISO: puzzle.dateISO,
    puzzleId: puzzle.id,
    status: "in_progress",
    clueIndex: 0,
    eliminatedOptionIds: [],
    guesses: [],
  };
  next.stats.played += 1;
  return next;
}

export function toggleEliminationV1(
  state: LocalStateV1,
  puzzle: PuzzleV1,
  optionId: string
): { nextState: LocalStateV1; blocked: boolean } {
  const day = state.history[puzzle.dateISO];
  if (!day || day.status !== "in_progress") {
    return { nextState: state, blocked: false };
  }

  const nextState: LocalStateV1 = structuredClone(state);
  const ids = new Set(nextState.history[puzzle.dateISO].eliminatedOptionIds);

  if (ids.has(optionId)) ids.delete(optionId);
  else ids.add(optionId);

  nextState.history[puzzle.dateISO].eliminatedOptionIds = Array.from(ids);
  return { nextState, blocked: false };
}

export function nextClue(state: LocalStateV1, puzzle: PuzzleV1): LocalStateV1 {
  const day = state.history[puzzle.dateISO];
  if (!day || day.status !== "in_progress") return state;

  const max = Math.min(puzzle.clues.length, 5);
  const next = structuredClone(state);
  next.history[puzzle.dateISO].clueIndex = Math.min(day.clueIndex + 1, max - 1);
  return next;
}

export function complete(
  state: LocalStateV1,
  puzzle: PuzzleV1,
  status: "solved" | "revealed"
): LocalStateV1 {
  const day = state.history[puzzle.dateISO];
  if (!day || day.status !== "in_progress") return state;

  day.status = status;
  day.completedAtISO = new Date().toISOString();
  day.cluesUsed = day.clueIndex + 1;

  state.stats.completed += 1;

  // average clues
  const completedDays = Object.values(state.history).filter(
    (d) => d.status === "solved" || d.status === "revealed"
  );
  const sum = completedDays.reduce((a, d) => a + (d.cluesUsed ?? 0), 0);
  state.stats.avgCluesUsed = sum / completedDays.length;

  // streaks
  const yesterday = isoMinusDays(puzzle.dateISO, 1);
  const y = state.history[yesterday];
  const continues = y && (y.status === "solved" || y.status === "revealed");

  state.stats.currentStreak = continues ? state.stats.currentStreak + 1 : 1;
  state.stats.longestStreak = Math.max(
    state.stats.longestStreak,
    state.stats.currentStreak
  );

  return state;
}

export function submitGuessV1(
  state: LocalStateV1,
  puzzle: PuzzleV1,
  optionId: string
): { nextState: LocalStateV1; correct: boolean } {
  const day = state.history[puzzle.dateISO];
  if (!day) return { nextState: state, correct: false };

  if (day.status !== "in_progress") {
    return { nextState: state, correct: optionId === puzzle.answerOptionId };
  }

  const nextState: LocalStateV1 = structuredClone(state);
  const nextDay = nextState.history[puzzle.dateISO];

  nextDay.guesses.push(optionId);

  if (optionId === puzzle.answerOptionId) {
    // complete mutates the passed state — so call it on our cloned state
    const completed = complete(nextState, puzzle, "solved");
    return { nextState: completed, correct: true };
  }

  return { nextState, correct: false };
}

export function revealAnswerV1(
  state: LocalStateV1,
  puzzle: PuzzleV1
): LocalStateV1 {
  const day = state.history[puzzle.dateISO];
  if (!day) return state;
  if (day.status !== "in_progress") return state;

  const nextState: LocalStateV1 = structuredClone(state);
  return complete(nextState, puzzle, "revealed");
}
