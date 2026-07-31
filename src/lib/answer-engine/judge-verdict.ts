/**
 * Pure parsing logic for Tier 2 AI judge responses, split out from
 * ai-judge.ts so it can be unit tested without pulling in the "server-only"
 * import guard (which intentionally throws outside a server context, incl.
 * under the test runner).
 */

export interface JudgeVerdict {
  verdict: "accept" | "reject";
  confidence: number;
  reason: string;
}

/**
 * Extracts and validates a JudgeVerdict from the model's raw text response.
 * Defensive by design (per the product brief): the model is instructed to
 * return bare JSON, but we tolerate surrounding whitespace/markdown fences
 * and reject anything that doesn't parse into the expected shape, rather
 * than throwing — a malformed response is treated the same as a Tier 2
 * failure (caller falls back to Tier 1's reject verdict).
 */
export function parseVerdict(rawText: string): JudgeVerdict | null {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("verdict" in parsed) ||
      (parsed.verdict !== "accept" && parsed.verdict !== "reject")
    ) {
      return null;
    }

    const confidenceRaw = "confidence" in parsed ? parsed.confidence : undefined;
    const confidence =
      typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)
        ? Math.min(1, Math.max(0, confidenceRaw))
        : 0.5;

    const reasonRaw = "reason" in parsed ? parsed.reason : undefined;
    const reason = typeof reasonRaw === "string" ? reasonRaw : "";

    return { verdict: parsed.verdict, confidence, reason };
  } catch {
    return null;
  }
}
