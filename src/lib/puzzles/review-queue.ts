import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/answer-engine/normalize";
import { startOfLondonDay } from "@/lib/time/london";
import type { JudgedAnswerVerdict } from "@/lib/supabase/types";

export interface ReviewQueueItem {
  id: string;
  puzzleId: string;
  episodeNumber: number;
  puzzleTitle: string;
  linkAnswer: string;
  rawAnswer: string;
  verdict: JudgedAnswerVerdict;
  confidence: number | null;
  reason: string | null;
  timesSeen: number;
  createdAt: string;
}

/**
 * Every `JL_judged_answers` row still awaiting a human decision — every AI
 * "accept" (a candidate to promote into `link_alternatives`) plus every
 * low-confidence "reject" (a candidate the AI wasn't sure about), per the
 * Tier 3 design in docs/ANSWER_ENGINE.md. `JL_judged_answers` has no FK
 * embed configured (see Database["public"]["Tables"] in types.ts), so the
 * puzzle context is joined here in application code rather than via a
 * nested select.
 */
export async function listPendingReviewItems(): Promise<ReviewQueueItem[]> {
  const supabase = createServiceRoleClient();

  const { data: rows } = await supabase
    .from("JL_judged_answers")
    .select("id, puzzle_id, raw_answer, verdict, confidence, reason, times_seen, created_at")
    .eq("review_status", "pending")
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) return [];

  const puzzleIds = [...new Set(rows.map((r) => r.puzzle_id))];
  const { data: puzzles } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title, link_answer")
    .in("id", puzzleIds);

  const puzzleById = new Map((puzzles ?? []).map((p) => [p.id, p]));

  return rows.flatMap((row) => {
    const puzzle = puzzleById.get(row.puzzle_id);
    if (!puzzle) return []; // Orphaned row (puzzle deleted since) — skip rather than crash the page.
    return [
      {
        id: row.id,
        puzzleId: row.puzzle_id,
        episodeNumber: puzzle.episode_number,
        puzzleTitle: puzzle.title,
        linkAnswer: puzzle.link_answer,
        rawAnswer: row.raw_answer,
        verdict: row.verdict,
        confidence: row.confidence,
        reason: row.reason,
        timesSeen: row.times_seen,
        createdAt: row.created_at,
      },
    ];
  });
}

/**
 * Every `JL_judged_answers` row is, by construction, the result of exactly
 * one real Tier 2 API call (see checkAnswer in engine.ts) — so counting
 * today's rows doubles as a cost tracker without a separate log table.
 * "Today" is the Europe/London calendar day, matching every other
 * date boundary in the app.
 */
export async function countJudgeCallsToday(): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from("JL_judged_answers")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfLondonDay().toISOString());

  return count ?? 0;
}

export type ReviewDecisionResult = { ok: true } | { ok: false; error: string };

/**
 * Approves a pending variant: promotes it into the puzzle's
 * `link_alternatives` (so it's a Tier 1 fuzzy match forever after) and
 * flips the cached verdict to "accept" — covers both the common case (an
 * AI "accept" the admin agrees with) and overturning a low-confidence
 * "reject" the admin judges was actually correct.
 */
export async function approveReviewItem(id: string): Promise<ReviewDecisionResult> {
  const supabase = createServiceRoleClient();

  const { data: row } = await supabase
    .from("JL_judged_answers")
    .select("puzzle_id, raw_answer")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "That review item no longer exists." };

  const { data: puzzle } = await supabase
    .from("JL_puzzles")
    .select("link_alternatives")
    .eq("id", row.puzzle_id)
    .maybeSingle();
  if (!puzzle) return { ok: false, error: "The puzzle for this review item no longer exists." };

  const alreadyPresent = puzzle.link_alternatives.some(
    (alt) => normalizeAnswer(alt) === normalizeAnswer(row.raw_answer)
  );
  if (!alreadyPresent) {
    const { error: puzzleError } = await supabase
      .from("JL_puzzles")
      .update({ link_alternatives: [...puzzle.link_alternatives, row.raw_answer] })
      .eq("id", row.puzzle_id);
    if (puzzleError) return { ok: false, error: puzzleError.message };
  }

  const { error } = await supabase
    .from("JL_judged_answers")
    .update({
      verdict: "accept",
      source: "admin_override",
      review_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/**
 * Rejects a pending variant: flips the cached verdict to "reject" for
 * future players — covers overturning an AI "accept" the admin disagrees
 * with. Does not touch `link_alternatives`.
 */
export async function rejectReviewItem(id: string): Promise<ReviewDecisionResult> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("JL_judged_answers")
    .update({
      verdict: "reject",
      source: "admin_override",
      review_status: "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Clears a pending item from the queue without changing its cached verdict — "the AI already got this one right." */
export async function dismissReviewItem(id: string): Promise<ReviewDecisionResult> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("JL_judged_answers")
    .update({ review_status: "dismissed", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
