import { describe, expect, it } from "vitest";
import { buildShareText } from "./share-card";

describe("buildShareText", () => {
  it("matches the documented format when the link was guessed", () => {
    const text = buildShareText({
      episodeNumber: 281,
      guessedCorrectly: true,
      revealedClueCount: 2,
      totalScore: 1850,
      appUrl: "https://jayslinks.example",
    });

    expect(text).toBe(
      "Jay's Links #281 🔗\nGuessed after 2 clues — 1,850 pts\nhttps://jayslinks.example"
    );
  });

  it("uses singular 'clue' when guessed after exactly one", () => {
    const text = buildShareText({
      episodeNumber: 281,
      guessedCorrectly: true,
      revealedClueCount: 1,
      totalScore: 970,
      appUrl: "https://jayslinks.example",
    });

    expect(text).toContain("Guessed after 1 clue —");
  });

  it("shows a 'missed it' line with 0 pts when never guessed", () => {
    const text = buildShareText({
      episodeNumber: 281,
      guessedCorrectly: false,
      revealedClueCount: 5,
      totalScore: 0,
      appUrl: "https://jayslinks.example",
    });

    expect(text).toBe(
      "Jay's Links #281 🔗\nMissed it this time — 0 pts\nhttps://jayslinks.example"
    );
  });
});
