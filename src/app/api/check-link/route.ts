import { NextResponse } from "next/server";
import { checkAnswer } from "@/lib/answer-engine/engine";
import { isRateLimited } from "@/lib/answer-engine/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Adjudicates a player's link guess for a puzzle. Same shared engine as
 * /api/check-answer (see docs/ANSWER_ENGINE.md) — phrasing varies more for
 * links ("Types of Poem" / "poems" / "poetry forms"), which is exactly what
 * the fuzzy matcher's alternatives list and the Tier 2 judge are for.
 */
export async function POST(request: Request) {
  const clientKey = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(clientKey)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("puzzleId" in body) ||
    !("guess" in body) ||
    typeof body.puzzleId !== "string" ||
    typeof body.guess !== "string" ||
    body.puzzleId.length === 0 ||
    body.guess.length === 0
  ) {
    return NextResponse.json(
      { error: "Expected { puzzleId: string, guess: string }" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: puzzle, error } = await supabase
    .from("puzzles")
    .select("link_answer, link_alternatives")
    .eq("id", body.puzzleId)
    .maybeSingle();

  if (error || !puzzle) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  const result = await checkAnswer(
    {
      type: "link",
      id: body.puzzleId,
      contextText: "The hidden link/theme connecting the answers to all 5 questions in this puzzle.",
      canonicalAnswer: puzzle.link_answer,
      alternatives: puzzle.link_alternatives,
    },
    body.guess
  );

  return NextResponse.json({
    correct: result.correct,
    link: result.correct ? puzzle.link_answer : undefined,
  });
}
