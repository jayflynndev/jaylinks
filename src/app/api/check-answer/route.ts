import { NextResponse } from "next/server";
import { checkAnswer } from "@/lib/answer-engine/engine";
import { isRateLimited } from "@/lib/answer-engine/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Adjudicates a player's answer to one question, or reveals it once the
 * question's timer has run out. Never receives or returns the canonical
 * answer/alternatives up front — it looks them up server-side from
 * Supabase and only echoes the canonical answer back once a guess is
 * confirmed correct, or an explicit reveal is requested (used when the
 * player's points meter/grace period has run out — see
 * src/lib/scoring/scoring.ts's isQuestionTimedOut), keeping unsolved
 * answers out of dev tools per docs/ANSWER_ENGINE.md's security note.
 */
export async function POST(request: Request) {
  // Best-effort client identifier for rate limiting — there's no player
  // auth, so the forwarded IP is the only signal available. See
  // src/lib/answer-engine/rate-limit.ts for the accepted trade-offs.
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
    !("questionId" in body) ||
    typeof body.questionId !== "string" ||
    body.questionId.length === 0
  ) {
    return NextResponse.json(
      { error: "Expected { questionId: string, guess: string } or { questionId: string, reveal: true }" },
      { status: 400 }
    );
  }

  const isReveal = "reveal" in body && body.reveal === true;
  const guess = "guess" in body && typeof body.guess === "string" ? body.guess : null;

  if (!isReveal && (!guess || guess.length === 0)) {
    return NextResponse.json(
      { error: "Expected { questionId: string, guess: string } or { questionId: string, reveal: true }" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: question, error } = await supabase
    .from("questions")
    .select("question_text, answer, alternatives")
    .eq("id", body.questionId)
    .maybeSingle();

  if (error || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (isReveal) {
    return NextResponse.json({ correct: false, answer: question.answer });
  }

  const result = await checkAnswer(
    {
      type: "question",
      id: body.questionId,
      contextText: question.question_text,
      canonicalAnswer: question.answer,
      alternatives: question.alternatives,
    },
    guess as string
  );

  return NextResponse.json({
    correct: result.correct,
    // Only reveal the canonical answer once the guess has been confirmed
    // correct — a wrong or pending guess gets no hint.
    answer: result.correct ? question.answer : undefined,
  });
}
