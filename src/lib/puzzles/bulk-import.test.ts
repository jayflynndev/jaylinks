import { describe, expect, it } from "vitest";
import { findDuplicateEpisodeNumbers, parseBulkImportPayload } from "./bulk-import";

function fiveClues() {
  return ["Sesame", "Quality", "Baker", "Coronation", "Fleet"];
}

function validPuzzle(overrides: Record<string, unknown> = {}) {
  return {
    episode_number: 281,
    publish_date: "2026-08-01",
    title: "Streets",
    clues: fiveClues(),
    link_answer: "Streets",
    link_alternatives: ["Types of Street"],
    ...overrides,
  };
}

describe("parseBulkImportPayload", () => {
  it("parses a valid single-puzzle payload", () => {
    const result = parseBulkImportPayload(JSON.stringify([validPuzzle()]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzles).toHaveLength(1);
    expect(result.puzzles[0]).toEqual({
      episodeNumber: 281,
      publishDate: "2026-08-01",
      categorySlug: "daily",
      title: "Streets",
      clues: ["Sesame", "Quality", "Baker", "Coronation", "Fleet"],
      linkAnswer: "Streets",
      linkAlternatives: ["Types of Street"],
    });
  });

  it("defaults publish_date to null and category_slug to daily when omitted", () => {
    const puzzle = validPuzzle();
    delete (puzzle as Record<string, unknown>).publish_date;
    const result = parseBulkImportPayload(JSON.stringify([puzzle]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzles[0].publishDate).toBeNull();
    expect(result.puzzles[0].categorySlug).toBe("daily");
  });

  it("rejects invalid JSON", () => {
    const result = parseBulkImportPayload("{not json");
    expect(result).toEqual({ ok: false, error: "That's not valid JSON." });
  });

  it("rejects a non-array or empty payload", () => {
    expect(parseBulkImportPayload("{}").ok).toBe(false);
    expect(parseBulkImportPayload("[]").ok).toBe(false);
  });

  it("rejects a puzzle missing a title", () => {
    const puzzle = validPuzzle({ title: "" });
    const result = parseBulkImportPayload(JSON.stringify([puzzle]));
    expect(result).toEqual({ ok: false, error: "Puzzle #1: title is required." });
  });

  it("rejects a puzzle without exactly 5 clues", () => {
    const puzzle = validPuzzle({ clues: fiveClues().slice(0, 4) });
    const result = parseBulkImportPayload(JSON.stringify([puzzle]));
    expect(result).toEqual({ ok: false, error: "Puzzle #1: clues must be an array of exactly 5 strings." });
  });

  it("rejects a clue that is blank, identifying the puzzle and clue index", () => {
    const clues = fiveClues();
    clues[2] = "";
    const puzzle = validPuzzle({ clues });
    const result = parseBulkImportPayload(JSON.stringify([puzzle]));
    expect(result).toEqual({ ok: false, error: "Puzzle #1, clue 3: expected a non-empty string." });
  });

  it("identifies the failing puzzle by position when a later entry is invalid", () => {
    const result = parseBulkImportPayload(JSON.stringify([validPuzzle(), validPuzzle({ title: "" })]));
    expect(result).toEqual({ ok: false, error: "Puzzle #2: title is required." });
  });

  it("filters non-string entries out of alternatives arrays defensively", () => {
    const puzzle = validPuzzle({ link_alternatives: ["Streets", 42, null, "Street Names"] });
    const result = parseBulkImportPayload(JSON.stringify([puzzle]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzles[0].linkAlternatives).toEqual(["Streets", "Street Names"]);
  });
});

describe("findDuplicateEpisodeNumbers", () => {
  it("returns an empty array when all episode numbers are unique", () => {
    const result = parseBulkImportPayload(
      JSON.stringify([validPuzzle({ episode_number: 281 }), validPuzzle({ episode_number: 282 })])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(findDuplicateEpisodeNumbers(result.puzzles)).toEqual([]);
  });

  it("finds episode numbers repeated within the payload", () => {
    const result = parseBulkImportPayload(
      JSON.stringify([
        validPuzzle({ episode_number: 281 }),
        validPuzzle({ episode_number: 282 }),
        validPuzzle({ episode_number: 281 }),
      ])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(findDuplicateEpisodeNumbers(result.puzzles)).toEqual([281]);
  });
});
