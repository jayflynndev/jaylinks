import { describe, expect, it } from "vitest";
import { parseVerdict } from "./judge-verdict";

describe("parseVerdict", () => {
  it("parses a clean JSON accept verdict", () => {
    const result = parseVerdict(
      '{"verdict": "accept", "confidence": 0.9, "reason": "Cheeses is a more specific correct answer for Dairy."}'
    );
    expect(result).toEqual({
      verdict: "accept",
      confidence: 0.9,
      reason: "Cheeses is a more specific correct answer for Dairy.",
    });
  });

  it("parses a clean JSON reject verdict", () => {
    const result = parseVerdict('{"verdict": "reject", "confidence": 0.4, "reason": "Too vague."}');
    expect(result).toEqual({ verdict: "reject", confidence: 0.4, reason: "Too vague." });
  });

  it("extracts JSON even when wrapped in extra text or markdown fences", () => {
    const result = parseVerdict(
      'Here is my answer:\n```json\n{"verdict": "accept", "confidence": 0.8, "reason": "ok"}\n```'
    );
    expect(result).toEqual({ verdict: "accept", confidence: 0.8, reason: "ok" });
  });

  it("defaults confidence to 0.5 when missing or non-numeric", () => {
    expect(parseVerdict('{"verdict": "accept"}')?.confidence).toBe(0.5);
    expect(parseVerdict('{"verdict": "accept", "confidence": "high"}')?.confidence).toBe(0.5);
  });

  it("clamps out-of-range confidence into [0, 1]", () => {
    expect(parseVerdict('{"verdict": "accept", "confidence": 5}')?.confidence).toBe(1);
    expect(parseVerdict('{"verdict": "accept", "confidence": -2}')?.confidence).toBe(0);
  });

  it("defaults reason to an empty string when missing or non-string", () => {
    expect(parseVerdict('{"verdict": "reject"}')?.reason).toBe("");
  });

  it("returns null for invalid verdict values", () => {
    expect(parseVerdict('{"verdict": "maybe", "confidence": 0.5}')).toBeNull();
  });

  it("returns null for non-JSON text", () => {
    expect(parseVerdict("I think that's correct!")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseVerdict('{"verdict": "accept", confidence: 0.9')).toBeNull();
  });
});
