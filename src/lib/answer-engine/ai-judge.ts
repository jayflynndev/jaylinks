import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { parseVerdict, type JudgeVerdict } from "./judge-verdict";

/**
 * Tier 2 of the three-tier answer engine (docs/ANSWER_ENGINE.md): the AI
 * judge, called only when Tier 1 fuzzy matching fails. Server-only — this
 * must never be reachable from client code, both because it needs
 * ANTHROPIC_API_KEY and because a client-callable judge would let a player
 * probe for the canonical answer by trial and error.
 */

export type { JudgeVerdict } from "./judge-verdict";

const JUDGE_MODEL = "claude-haiku-4-5";

// The game must never hang or break if the API is slow/down — 3s is the
// product-specified ceiling before we fall back to Tier 1's (reject) verdict.
const JUDGE_TIMEOUT_MS = 3000;

export interface JudgeAnswerParams {
  /** A short description of the puzzle's link, e.g. "The hidden theme connecting 5 revealed clue words." */
  linkContext: string;
  canonicalAnswer: string;
  alternatives: string[];
  playerAnswer: string;
}

const SYSTEM_PROMPT = `You are the link-guess judge for a daily chain-quiz game called Jay's Links. Each puzzle reveals 5 clue words/phrases that all share a hidden link (e.g. Sesame/Quality/Baker/Coronation/Fleet → "Streets"). A player's typed guess for the link did not match the canonical answer or any known alternative by simple fuzzy matching, so you make the final call.

Rules:
- Accept guesses that are semantically equivalent to the canonical link, even if worded differently (e.g. "Street" or "Types of street" for "Streets").
- Accept guesses that are MORE SPECIFIC than the canonical link, as long as they are still correct.
- REJECT guesses that are VAGUER or more general than the canonical link, even if related. Generosity flows toward precision, never toward vagueness.
- Reject guesses that are simply wrong or unrelated.

Respond with ONLY a single JSON object on one line, no other text, no markdown formatting:
{"verdict": "accept" or "reject", "confidence": a number from 0 to 1, "reason": a brief one-sentence explanation}`;

let cachedClient: Anthropic | null = null;

/** Lazily constructs the Anthropic client so a missing API key only errors when the judge is actually invoked. */
function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing ANTHROPIC_API_KEY. Copy .env.local.example to .env.local and add your Anthropic API key (see docs/ANSWER_ENGINE.md)."
      );
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

function buildUserPrompt(params: JudgeAnswerParams): string {
  const alternativesText =
    params.alternatives.length > 0 ? params.alternatives.join(", ") : "(none)";
  return `Puzzle: ${params.linkContext}
Canonical link answer: ${params.canonicalAnswer}
Known alternatives: ${alternativesText}
Player's guess: ${params.playerAnswer}`;
}

/**
 * Calls the Tier 2 AI judge. Returns null on timeout, API error, or a
 * malformed response — callers must treat null as "fall back to Tier 1's
 * verdict" (i.e. reject, since Tier 1 already failed to match). Never
 * throws for expected failure modes; the game must keep working if the
 * Anthropic API is unavailable.
 */
export async function judgeAnswer(params: JudgeAnswerParams): Promise<JudgeVerdict | null> {
  try {
    const client = getClient();
    const response = await client.messages.create(
      {
        model: JUDGE_MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(params) }],
      },
      { timeout: JUDGE_TIMEOUT_MS }
    );

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    return parseVerdict(textBlock.text);
  } catch {
    return null;
  }
}
