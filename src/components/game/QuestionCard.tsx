"use client";

import { useEffect, useRef, useState } from "react";
import { useElapsedTimer } from "@/hooks/use-elapsed-timer";
import { currentQuestionScore, isQuestionTimedOut } from "@/lib/scoring/scoring";
import type { PublicQuestion } from "@/lib/puzzles/get-daily-puzzle";
import { PointsMeter } from "./PointsMeter";
import type { QuestionOutcome } from "./types";

interface QuestionCardProps {
  question: PublicQuestion;
  onResolved: (outcome: QuestionOutcome) => void;
}

type Phase = "active" | "correct" | "revealed";

interface CheckAnswerResponse {
  correct: boolean;
  answer?: string;
  error?: string;
}

/**
 * One interactive question: draining points meter, guess input, wrong-guess
 * shake, and the correct/reveal end states. Calls onResolved exactly once,
 * whether the player got it right or it timed out — the parent (GameLoop)
 * owns deciding when to actually advance to the next question, so this
 * component keeps rendering its resolved state until it's unmounted.
 */
export function QuestionCard({ question, onResolved }: QuestionCardProps) {
  const [guessValue, setGuessValue] = useState("");
  const [wrongGuessCount, setWrongGuessCount] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>("active");
  const [answerText, setAnswerText] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The meter pauses while the input is focused (on-screen keyboard up),
  // while a check-answer request is in flight, and once the question is
  // no longer active — see docs/ANSWER_ENGINE.md / the product brief.
  const paused = isInputFocused || isSubmitting || phase !== "active";
  const activeElapsedMs = useElapsedTimer(paused);
  const liveScore = currentQuestionScore(activeElapsedMs, wrongGuessCount);

  // GameLoop mounts a fresh QuestionCard per question (keyed on
  // question.id), so every piece of state above already starts fresh for
  // each question via its useState initial value — no reset-on-prop-change
  // effect needed. resolvedRef (below) guards against onResolved firing
  // twice for the same instance (e.g. a timeout landing just as a correct
  // guess resolves); a ref, not state, since it's read-only bookkeeping
  // that doesn't drive rendering.
  const resolvedRef = useRef(false);
  // Guards against the auto-reveal effect firing more than once while its
  // fetch is in flight (it re-runs on every elapsed-time tick). A ref
  // rather than state: flipping it doesn't need to trigger a re-render,
  // and mutating it synchronously inside the effect (unlike calling
  // setState there) doesn't trigger extra render passes.
  const revealInFlightRef = useRef(false);

  // Auto-reveal once the drain + grace period has fully elapsed.
  useEffect(() => {
    if (phase !== "active" || revealInFlightRef.current) return;
    if (!isQuestionTimedOut(activeElapsedMs)) return;

    revealInFlightRef.current = true;
    let cancelled = false;

    fetch("/api/check-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, reveal: true }),
    })
      .then((res) => res.json() as Promise<CheckAnswerResponse>)
      .then((data) => {
        if (cancelled) return;
        const revealed = data.answer ?? "";
        setAnswerText(revealed);
        setPhase("revealed");
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          onResolved({ correct: false, pointsBanked: 0, answerText: revealed });
        }
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("Couldn't reveal the answer — check your connection.");
      })
      .finally(() => {
        revealInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeElapsedMs, phase, question.id]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (phase !== "active" || isSubmitting) return;
    const guess = guessValue.trim();
    if (guess.length === 0) return;

    // Freeze the score the player sees right now — it's what gets banked
    // if this guess is correct, unaffected by network latency.
    const scoreAtSubmit = liveScore;
    setIsSubmitting(true);
    setErrorMessage(null);

    fetch("/api/check-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, guess }),
    })
      .then((res) => res.json() as Promise<CheckAnswerResponse>)
      .then((data) => {
        if (data.correct) {
          const revealed = data.answer ?? guess;
          setAnswerText(revealed);
          setPhase("correct");
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            onResolved({ correct: true, pointsBanked: scoreAtSubmit, answerText: revealed });
          }
        } else {
          setWrongGuessCount((count) => count + 1);
          setGuessValue("");
          setIsShaking(true);
        }
      })
      .catch(() => {
        setErrorMessage("Couldn't check that answer — check your connection and try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <div className="w-full rounded-3xl border-2 border-yellow-300/40 bg-purple-900/60 p-5 shadow-lg backdrop-blur-sm sm:p-7">
      <PointsMeter value={phase === "revealed" ? 0 : liveScore} />

      <p className="mt-5 text-center font-sans text-xl leading-snug text-yellow-50 sm:text-2xl">
        {question.questionText}
      </p>

      {phase === "active" && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={guessValue}
            onChange={(event) => setGuessValue(event.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onAnimationEnd={() => setIsShaking(false)}
            disabled={isSubmitting}
            placeholder="Type your answer…"
            className={`flex-1 rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-5 py-3 text-lg text-yellow-50 placeholder:text-yellow-100/40 focus:border-yellow-300 focus:outline-none disabled:opacity-60 ${isShaking ? "animate-shake" : ""}`}
          />
          <button
            type="submit"
            disabled={isSubmitting || guessValue.trim().length === 0}
            className="rounded-full bg-yellow-300 px-6 py-3 font-display text-lg tracking-wide text-purple-950 transition disabled:opacity-50"
          >
            {isSubmitting ? "Checking…" : "Guess"}
          </button>
        </form>
      )}

      {phase === "correct" && (
        <div className="mt-6 text-center">
          <p className="font-display text-2xl text-emerald-300">Correct! +{liveScore}</p>
          <p className="mt-1 font-sans text-lg text-yellow-100">{answerText}</p>
        </div>
      )}

      {phase === "revealed" && (
        <div className="mt-6 text-center">
          <p className="font-display text-2xl text-red-300">Missed it — 0 points</p>
          <p className="mt-1 font-sans text-lg text-yellow-100">{answerText}</p>
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-center font-sans text-sm text-red-300">{errorMessage}</p>
      )}
    </div>
  );
}
