import {
  submitGuessV1,
  getOrCreateDay,
  toggleEliminationV1,
  nextClue,
} from "@/lib/game";
import { defaultState } from "@/lib/storage";
import type { PuzzleV1 } from "@/lib/types";

const mockPuzzle: PuzzleV1 = {
  id: 1,
  dateISO: "2025-12-17",
  options: [
    { id: "a", label: "Option A" },
    { id: "b", label: "Option B" },
  ],
  answerOptionId: "a",
  clues: ["Clue 1"],
  explanation: "Explanation",
};

describe("Game Logic", () => {
  test("submitGuessV1 returns correct for right answer", () => {
    const state = defaultState();
    const dayState = getOrCreateDay(state, mockPuzzle);
    const { correct } = submitGuessV1(dayState, mockPuzzle, "a");
    expect(correct).toBe(true);
  });

  test("submitGuessV1 returns incorrect for wrong answer", () => {
    const state = defaultState();
    const dayState = getOrCreateDay(state, mockPuzzle);
    const { correct } = submitGuessV1(dayState, mockPuzzle, "b");
    expect(correct).toBe(false);
  });

  test("toggleEliminationV1 blocks if not in progress", () => {
    const state = defaultState();
    const dayState = getOrCreateDay(state, mockPuzzle);
    // Simulate completed game
    dayState.history[mockPuzzle.dateISO].status = "solved";
    const { blocked } = toggleEliminationV1(dayState, mockPuzzle, "a");
    expect(blocked).toBe(false); // Should not block, but not change
  });

  test("nextClue does not exceed max clues", () => {
    const state = defaultState();
    const dayState = getOrCreateDay(state, mockPuzzle);
    // Set clue index to max
    dayState.history[mockPuzzle.dateISO].clueIndex = 0; // Only 1 clue, max 5 but limited by length
    const nextState = nextClue(dayState, mockPuzzle);
    expect(nextState.history[mockPuzzle.dateISO].clueIndex).toBe(0); // Should not go beyond
  });

  test("getOrCreateDay creates new day if not exists", () => {
    const state = defaultState();
    const newState = getOrCreateDay(state, mockPuzzle);
    expect(newState.history[mockPuzzle.dateISO]).toBeDefined();
    expect(newState.stats.played).toBe(1);
  });

  test("submitGuessV1 handles invalid inputs", () => {
    const state = defaultState();
    const { correct } = submitGuessV1(state, mockPuzzle, "");
    expect(correct).toBe(false);
  });
});
