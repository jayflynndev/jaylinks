import { describe, expect, it } from "vitest";
import { buildShareGrid, buildShareText, questionEmoji } from "./share-card";
import type { QuestionResult } from "@/lib/storage/types";

describe("questionEmoji", () => {
  it("is a red square for a missed question", () => {
    expect(questionEmoji({ correct: false, pointsBanked: 0 })).toBe("🟥");
  });

  it("is a green square for a fast correct answer (>= 700 banked)", () => {
    expect(questionEmoji({ correct: true, pointsBanked: 700 })).toBe("🟩");
    expect(questionEmoji({ correct: true, pointsBanked: 950 })).toBe("🟩");
  });

  it("is a yellow square for a slower correct answer (< 700 banked)", () => {
    expect(questionEmoji({ correct: true, pointsBanked: 699 })).toBe("🟨");
    expect(questionEmoji({ correct: true, pointsBanked: 100 })).toBe("🟨");
  });
});

describe("buildShareGrid", () => {
  it("concatenates one emoji per question in order", () => {
    const results: QuestionResult[] = [
      { correct: true, pointsBanked: 900 },
      { correct: true, pointsBanked: 800 },
      { correct: true, pointsBanked: 500 },
      { correct: false, pointsBanked: 0 },
      { correct: true, pointsBanked: 600 },
    ];
    expect(buildShareGrid(results)).toBe("🟩🟩🟨🟥🟨");
  });
});

describe("buildShareText", () => {
  const baseResults: QuestionResult[] = [
    { correct: true, pointsBanked: 900 },
    { correct: true, pointsBanked: 800 },
    { correct: true, pointsBanked: 700 },
    { correct: false, pointsBanked: 0 },
    { correct: true, pointsBanked: 600 },
  ];

  it("matches the documented format when the link was guessed", () => {
    const text = buildShareText({
      episodeNumber: 281,
      questionResults: baseResults,
      linkGuessedAfterRevealedCount: 3,
      totalScore: 4750,
      appUrl: "https://jayslinks.example",
    });

    expect(text).toBe(
      "Jay's Links #281 🔗\n🟩🟩🟩🟥🟨 + 🔗×3\nScore: 4,750\nhttps://jayslinks.example"
    );
  });

  it("omits the link suffix when the link was never guessed", () => {
    const text = buildShareText({
      episodeNumber: 281,
      questionResults: baseResults,
      linkGuessedAfterRevealedCount: null,
      totalScore: 3000,
      appUrl: "https://jayslinks.example",
    });

    expect(text).toBe(
      "Jay's Links #281 🔗\n🟩🟩🟩🟥🟨\nScore: 3,000\nhttps://jayslinks.example"
    );
  });
});
