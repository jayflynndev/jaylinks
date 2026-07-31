import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "./fuzzy-match";
import { levenshteinDistance } from "./levenshtein";
import { normalizeAnswer } from "./normalize";

describe("normalizeAnswer", () => {
  it("lowercases and trims", () => {
    expect(normalizeAnswer("  Sonnet  ")).toBe("sonnet");
  });

  it("strips diacritics", () => {
    expect(normalizeAnswer("Café")).toBe("cafe");
  });

  it("strips punctuation entirely rather than turning it into a space", () => {
    expect(normalizeAnswer("Don't Stop")).toBe("dont stop");
    expect(normalizeAnswer("Golden-Eye")).toBe("goldeneye");
    expect(normalizeAnswer("GoldenEye!!")).toBe("goldeneye");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeAnswer("Types   of   Poem")).toBe("types of poem");
  });
});

describe("levenshteinDistance", () => {
  it("is 0 for identical strings", () => {
    expect(levenshteinDistance("sonnet", "sonnet")).toBe(0);
  });

  it("counts a single substitution as distance 1", () => {
    expect(levenshteinDistance("sonnet", "sonnst")).toBe(1);
  });

  it("counts a single insertion/deletion as distance 1", () => {
    expect(levenshteinDistance("sonnet", "sonnnet")).toBe(1);
    expect(levenshteinDistance("sonnet", "sonet")).toBe(1);
  });

  it("handles empty strings", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });

  it("is symmetric", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(
      levenshteinDistance("sitting", "kitten")
    );
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });
});

describe("fuzzyMatch", () => {
  it("accepts an exact match, case-insensitively", () => {
    expect(fuzzyMatch("sonnet", "Sonnet").correct).toBe(true);
    expect(fuzzyMatch("SONNET", "Sonnet").correct).toBe(true);
  });

  it("accepts a match against a listed alternative", () => {
    const result = fuzzyMatch("cheeses", "Dairy", ["Cheeses", "Dairy products"]);
    expect(result.correct).toBe(true);
    expect(result.matchType).toBe("exact");
  });

  it("rejects a wrong answer with no useful overlap", () => {
    expect(fuzzyMatch("Sonnet", "Haiku").correct).toBe(false);
  });

  it("rejects an empty or whitespace-only guess", () => {
    expect(fuzzyMatch("", "Sonnet").correct).toBe(false);
    expect(fuzzyMatch("   ", "Sonnet").correct).toBe(false);
  });

  describe("typo tolerance", () => {
    it("allows Levenshtein <= 2 for targets >= 5 chars", () => {
      // "sonnet" (6 chars) vs "sonet" (missing an n): distance 1.
      expect(fuzzyMatch("sonet", "Sonnet").correct).toBe(true);
      // distance 2 from "sonnet": "sonnxt" -> substitute 2 letters "snnxt"? use a clean 2-edit case.
      expect(fuzzyMatch("sonnxx", "Sonnet").correct).toBe(true); // 2 substitutions
      // distance 3 should be rejected.
      expect(fuzzyMatch("xxxnet", "Sonnet").correct).toBe(false); // more than 2 edits away
    });

    it("allows Levenshtein <= 1 for targets shorter than 5 chars", () => {
      // "Ode" (3 chars): one substitution tolerated.
      expect(fuzzyMatch("ade", "Ode").correct).toBe(true);
      // two substitutions should be rejected for short targets.
      expect(fuzzyMatch("abe", "Ode").correct).toBe(false);
    });

    it("does not accept typo tolerance so loose that unrelated words match", () => {
      expect(fuzzyMatch("Elegy", "Limerick").correct).toBe(false);
    });
  });

  describe("surname-only matching for people", () => {
    it("accepts a surname-only guess against a full name canonical answer", () => {
      expect(fuzzyMatch("Connery", "Sean Connery").correct).toBe(true);
      expect(fuzzyMatch("connery", "Sean Connery").matchType).toBe("surname");
    });

    it("accepts a surname-only guess against a full name alternative", () => {
      const result = fuzzyMatch("Craig", "Daniel Craig", ["007", "Craig"]);
      expect(result.correct).toBe(true);
    });

    it("tolerates a small typo in a surname-only guess", () => {
      expect(fuzzyMatch("Konnery", "Sean Connery").correct).toBe(true);
    });

    it("does not accept a first-name-only guess", () => {
      expect(fuzzyMatch("Sean", "Sean Connery").correct).toBe(false);
    });

    it("does not apply surname matching to single-word canonical answers", () => {
      expect(fuzzyMatch("Superior", "Ontario").correct).toBe(false);
    });
  });

  describe("real puzzle data (episode 281: Types of Poem)", () => {
    it("accepts clean and lightly-typo'd answers", () => {
      expect(fuzzyMatch("elegy", "Elegy").correct).toBe(true);
      expect(fuzzyMatch("Haikus", "Haiku").correct).toBe(true); // 1-char typo tolerance
    });

    it("link guess accepts documented alternatives", () => {
      const linkAlternatives = ["Poems", "Poem types", "Types of poetry", "Poetry forms"];
      expect(fuzzyMatch("poems", "Types of Poem", linkAlternatives).correct).toBe(true);
      expect(fuzzyMatch("poetry forms", "Types of Poem", linkAlternatives).correct).toBe(true);
      expect(fuzzyMatch("types of poetry", "Types of Poem", linkAlternatives).correct).toBe(true);
    });
  });
});
