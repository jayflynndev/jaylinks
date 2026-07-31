"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getPlayerStore } from "@/lib/storage/player-store";
import type { QuestionResult, PlayResult } from "@/lib/storage/types";
import { londonDateString } from "@/lib/time/london";
import type { PublicPuzzle } from "@/lib/puzzles/get-daily-puzzle";
import { QuestionCard } from "./QuestionCard";
import { LinkGuessPanel } from "./LinkGuessPanel";
import { RevealedAnswersList } from "./RevealedAnswersList";
import type { QuestionOutcome } from "./types";

interface GameLoopProps {
  puzzle: PublicPuzzle;
}

interface RevealedAnswer {
  questionText: string;
  answerText: string;
  correct: boolean;
}

interface LinkGuessState {
  guessed: boolean;
  bonus: number | null;
  revealedAtCount: number | null;
}

/** How long the "Correct!"/"Missed it" celebration stays visible before advancing to the next question. */
const ADVANCE_DELAY_MS = 1400;

type Gate = "checking" | "ready" | "already-played";

/**
 * Orchestrates one full play-through: the "already played today?" gate,
 * the 5-question sequence, link guessing, and (for now, pending milestone
 * 5's full results screen) a minimal completion summary. Owns all game
 * state; QuestionCard/LinkGuessPanel are controlled/callback-driven.
 */
export function GameLoop({ puzzle }: GameLoopProps) {
  const [gate, setGate] = useState<Gate>("checking");
  const [isPractice, setIsPractice] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState<RevealedAnswer[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [linkGuessState, setLinkGuessState] = useState<LinkGuessState>({
    guessed: false,
    bonus: null,
    revealedAtCount: null,
  });

  const [finalResult, setFinalResult] = useState<PlayResult | null>(null);
  const [revealedLinkIfMissed, setRevealedLinkIfMissed] = useState<string | null>(null);

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One play per puzzle per device per day — see PlayerStore.hasPlayed.
  // This has to be an effect, not state computed during render: localStorage
  // (what PlayerStore reads) doesn't exist during SSR, so the check can only
  // run after this client component has mounted in the browser. The gate
  // starts at "checking" precisely so the server-rendered and first-client-
  // render markup match before this effect updates it.
  useEffect(() => {
    const alreadyPlayed = getPlayerStore().hasPlayed(puzzle.episodeNumber);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGate(alreadyPlayed ? "already-played" : "ready");
  }, [puzzle.episodeNumber]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  function handleQuestionResolved(outcome: QuestionOutcome) {
    const question = puzzle.questions[currentIndex];
    setRevealedAnswers((prev) => [
      ...prev,
      { questionText: question.questionText, answerText: outcome.answerText, correct: outcome.correct },
    ]);
    setQuestionResults((prev) => [...prev, { correct: outcome.correct, pointsBanked: outcome.pointsBanked }]);

    advanceTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((index) => index + 1);
    }, ADVANCE_DELAY_MS);
  }

  function handleLinkCorrect(outcome: { bonus: number; revealedAtCount: number }) {
    setLinkGuessState({ guessed: true, bonus: outcome.bonus, revealedAtCount: outcome.revealedAtCount });
  }

  // Puzzle complete once every question has resolved.
  useEffect(() => {
    if (gate !== "ready" || questionResults.length < puzzle.questions.length || finalResult) return;

    let cancelled = false;

    async function finish() {
      let missedLink: string | null = null;
      if (!linkGuessState.guessed) {
        try {
          const res = await fetch("/api/check-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puzzleId: puzzle.id, reveal: true }),
          });
          const data = (await res.json()) as { link?: string };
          missedLink = data.link ?? null;
        } catch {
          missedLink = null;
        }
      }
      if (cancelled) return;

      const totalScore =
        questionResults.reduce((sum, q) => sum + q.pointsBanked, 0) + (linkGuessState.bonus ?? 0);

      const result: PlayResult = {
        episodeNumber: puzzle.episodeNumber,
        puzzleId: puzzle.id,
        playedDate: londonDateString(),
        isPractice,
        questionResults,
        linkBonus: linkGuessState.bonus ?? 0,
        linkGuessedAfterRevealedCount: linkGuessState.revealedAtCount,
        totalScore,
      };

      getPlayerStore().saveResult(result);
      setRevealedLinkIfMissed(missedLink);
      setFinalResult(result);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [gate, questionResults, puzzle, linkGuessState, finalResult, isPractice]);

  if (gate === "checking") {
    return null;
  }

  if (gate === "already-played") {
    return (
      <div className="w-full max-w-md rounded-3xl border-2 border-yellow-300/40 bg-purple-900/60 p-6 text-center">
        <p className="font-display text-2xl text-yellow-300">Already played today!</p>
        <p className="mt-2 font-sans text-yellow-100">
          You&apos;ve completed Link #{puzzle.episodeNumber} today. Come back tomorrow for the next
          one, or play again for practice — it won&apos;t count toward your streak.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full border-2 border-yellow-300/50 px-6 py-3 font-sans text-yellow-100"
          >
            Back home
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsPractice(true);
              setGate("ready");
            }}
            className="rounded-full bg-yellow-300 px-6 py-3 font-display tracking-wide text-purple-950"
          >
            Play for practice
          </button>
        </div>
      </div>
    );
  }

  // Placeholder completion summary — milestone 5 replaces this with the
  // full results screen (share card, streak, next-puzzle countdown).
  if (finalResult) {
    return (
      <div className="w-full max-w-md rounded-3xl border-2 border-yellow-300/40 bg-purple-900/60 p-6 text-center">
        {isPractice && (
          <p className="mb-2 font-sans text-sm tracking-wide text-yellow-100/70 uppercase">
            Practice — doesn&apos;t count
          </p>
        )}
        <p className="font-display text-3xl text-yellow-300">Score: {finalResult.totalScore}</p>
        {!linkGuessState.guessed && revealedLinkIfMissed && (
          <p className="mt-2 font-sans text-yellow-100">The link was: {revealedLinkIfMissed}</p>
        )}
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-yellow-300 px-6 py-3 font-display tracking-wide text-purple-950"
        >
          Back home
        </Link>
      </div>
    );
  }

  const currentQuestion = puzzle.questions[currentIndex];

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <RevealedAnswersList answers={revealedAnswers} />

      {currentQuestion && (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          onResolved={handleQuestionResolved}
        />
      )}

      <LinkGuessPanel
        puzzleId={puzzle.id}
        revealedCount={revealedAnswers.length}
        guessed={linkGuessState.guessed}
        guessedBonus={linkGuessState.bonus}
        onCorrect={handleLinkCorrect}
      />
    </div>
  );
}
