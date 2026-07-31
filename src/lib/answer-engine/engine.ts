import "server-only";
import { fuzzyMatch } from "./fuzzy-match";
import { normalizeAnswer } from "./normalize";
import { judgeAnswer } from "./ai-judge";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * The shared three-tier answer engine (docs/ANSWER_ENGINE.md), used
 * identically by /api/check-answer (regular questions) and /api/check-link
 * (link guesses) — callers just describe which "subject" is being judged.
 */

export interface AnswerSubject {
  /** "question" for a regular answer, "link" for a link guess. */
  type: "question" | "link";
  /** questions.id or puzzles.id, matching `type`. */
  id: string;
  /** Question text (or a description of the link) shown to the Tier 2 judge for context. */
  contextText: string;
  canonicalAnswer: string;
  alternatives: string[];
}

export type AnswerTier = 1 | 2 | 3;

export interface CheckAnswerResult {
  correct: boolean;
  /** Which tier resolved the verdict: 1 = fuzzy match, 2 = fresh AI judge call, 3 = cached prior judge verdict. */
  tier: AnswerTier;
}

/** Every "accept" and every low-confidence "reject" goes in the admin review queue — see docs/ANSWER_ENGINE.md Tier 3. */
const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

function subjectColumn(subject: AnswerSubject): "question_id" | "puzzle_id" {
  return subject.type === "question" ? "question_id" : "puzzle_id";
}

/**
 * Adjudicates one player answer against one subject (a question or a
 * link), running Tier 1 first and falling through to the Tier 3 cache and
 * then the Tier 2 AI judge only when needed. Never throws for expected
 * failure modes (AI judge timeout/error) — worst case the game treats the
 * answer as incorrect, matching Tier 1's verdict.
 */
export async function checkAnswer(
  subject: AnswerSubject,
  rawGuess: string
): Promise<CheckAnswerResult> {
  const tier1 = fuzzyMatch(rawGuess, subject.canonicalAnswer, subject.alternatives);
  if (tier1.correct) {
    return { correct: true, tier: 1 };
  }

  const normalized = normalizeAnswer(rawGuess);
  if (normalized.length === 0) {
    return { correct: false, tier: 1 };
  }

  const supabase = createServiceRoleClient();
  const column = subjectColumn(subject);

  const { data: cached } = await supabase
    .from("judged_answers")
    .select("id, verdict, times_seen")
    .eq(column, subject.id)
    .eq("normalized_answer", normalized)
    .maybeSingle();

  if (cached) {
    // Best-effort popularity counter — not load-bearing, so failures here
    // are swallowed rather than affecting the player-facing verdict.
    void supabase
      .from("judged_answers")
      .update({ times_seen: cached.times_seen + 1 })
      .eq("id", cached.id)
      .then(undefined, () => {});

    return { correct: cached.verdict === "accept", tier: 3 };
  }

  const judged = await judgeAnswer({
    questionText: subject.contextText,
    canonicalAnswer: subject.canonicalAnswer,
    alternatives: subject.alternatives,
    playerAnswer: rawGuess,
  });

  if (!judged) {
    // Timeout / API error — fall back to Tier 1's verdict (reject, since
    // Tier 1 already failed to match above).
    return { correct: false, tier: 1 };
  }

  const needsReview =
    judged.verdict === "accept" || judged.confidence < REVIEW_CONFIDENCE_THRESHOLD;

  // Built as a literal-keyed union rather than a computed `[column]: ...`
  // property: the latter widens to a generic string index signature, which
  // the Supabase Insert type (deliberately exact, no index signature)
  // rejects at compile time.
  const subjectFields =
    subject.type === "question" ? { question_id: subject.id } : { puzzle_id: subject.id };

  const { error } = await supabase.from("judged_answers").insert({
    ...subjectFields,
    normalized_answer: normalized,
    raw_answer: rawGuess,
    verdict: judged.verdict,
    confidence: judged.confidence,
    reason: judged.reason,
    source: "ai",
    review_status: needsReview ? "pending" : "not_applicable",
  });
  // Ignore unique-violation races (23505): another concurrent request for
  // the same never-before-seen variant already wrote the row. Any other
  // insert failure is logged but still shouldn't block the player.
  if (error && error.code !== "23505") {
    console.error("judged_answers insert failed", error);
  }

  return { correct: judged.verdict === "accept", tier: 2 };
}
