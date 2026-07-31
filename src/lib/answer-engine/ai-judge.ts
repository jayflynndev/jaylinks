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
  /** The question text (or a description of "the link" for link guesses). */
  questionText: string;
  canonicalAnswer: string;
  alternatives: string[];
  playerAnswer: string;
}

const SYSTEM_PROMPT = `You are the answer judge for a trivia game called Jay's Links. A player's typed answer did not match the canonical answer or any known alternative by simple fuzzy matching, so you make the final call.

Rules:
- Accept answers that are semantically equivalent to the canonical answer, even if worded differently.
- Accept answers that are MORE SPECIFIC than the canonical answer, as long as they are still correct (e.g. if the canonical answer is "Dairy", accept "Cheeses").
- REJECT answers that are VAGUER or more general than the canonical answer, even if related (e.g. if the canonical answer is "Dairy", reject "Food"). Generosity flows toward precision, never toward vagueness.
- Reject answers that are simply wrong or unrelated.

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
  return `Question: ${params.questionText}
Canonical answer: ${params.canonicalAnswer}
Known alternatives: ${alternativesText}
Player's answer: ${params.playerAnswer}`;
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
