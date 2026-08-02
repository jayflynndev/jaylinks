"use client";

import { useEffect, useState } from "react";
import { useElapsedTimer } from "@/hooks/use-elapsed-timer";
import { isRoundTimedOut, meterValueAtElapsed, revealedClueCount } from "@/lib/scoring/scoring";
import { getPlayerStore } from "@/lib/storage/player-store";
import type { PlayerStats, PlayResult } from "@/lib/storage/types";
import { londonDateString } from "@/lib/time/london";
import type { PublicPuzzle } from "@/lib/puzzles/get-daily-puzzle";
import { ClueList } from "./ClueList";
import { LinkGuessPanel } from "./LinkGuessPanel";
import { PointsMeter } from "./PointsMeter";
import { ResultsScreen } from "./ResultsScreen";
import type { LinkGuessOutcome } from "./types";

interface PuzzleRoundProps {
  puzzle: PublicPuzzle;
  isPractice: boolean;
  /** The signed-in player's id, or null — see GameLoop's prop of the same name. */
  currentUserId: string | null;
  /** Where to start the round's clocks — 0 for fresh, or real elapsed time if GameLoop is resuming a round the player left mid-way (its anti-cheat round-start tracking). */
  initialElapsedMs: number;
}

interface LinkGuessState {
  guessed: boolean;
  score: number | null;
  revealedClueCount: number | null;
  linkText: string | null;
}

const NOT_GUESSED: LinkGuessState = {
  guessed: false,
  score: null,
  revealedClueCount: null,
  linkText: null,
};

/**
 * Owns one full round: the shared points meter, the clue-reveal clock,
 * link guessing, and the round-end -> results transition. A fresh
 * instance per puzzle (GameLoop mounts this only once the "already
 * played?" gate resolves), so its timing hooks naturally (re)initialise
 * at the right moment rather than needing a reset effect — starting from
 * zero for a fresh round, or from `initialElapsedMs` when GameLoop is
 * resuming one the player left mid-way.
 */
export function PuzzleRound({ puzzle, isPractice, currentUserId, initialElapsedMs }: PuzzleRoundProps) {
  const [isGuessActive, setIsGuessActive] = useState(false);
  const [linkGuessState, setLinkGuessState] = useState<LinkGuessState>(NOT_GUESSED);

  const [finalResult, setFinalResult] = useState<PlayResult | null>(null);
  const [finalStats, setFinalStats] = useState<PlayerStats | null>(null);
  const [finalLinkText, setFinalLinkText] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const isRoundOver = finalResult !== null;

  // Both the points meter AND the clue-reveal clock pause together while
  // the guess input is open/submitting, once guessed correctly, and once
  // the round has ended — driving both off the same activeElapsedMs value
  // (rather than two independently-paused timers) guarantees they can
  // never drift apart. Without this, opening the guess form and stalling
  // would let every clue reveal for free while the meter sat frozen — a
  // real exploit, not just a cosmetic mismatch.
  const paused = isGuessActive || linkGuessState.guessed || isRoundOver;
  const activeElapsedMs = useElapsedTimer(paused, initialElapsedMs);
  const revealedCount = revealedClueCount(activeElapsedMs);
  const currentScore = meterValueAtElapsed(activeElapsedMs);

  function handleLinkCorrect(outcome: LinkGuessOutcome) {
    setLinkGuessState({
      guessed: true,
      score: outcome.score,
      revealedClueCount: outcome.revealedClueCount,
      linkText: outcome.linkText,
    });
  }

  // Round ends on a correct guess, or once every clue has shown and the
  // timeout grace period elapses unguessed. Skipped entirely while a
  // guess is actively being composed/submitted, so a timeout landing in
  // that exact instant doesn't race an in-flight submission — see
  // LinkGuessPanel's onActiveChange.
  useEffect(() => {
    if (isRoundOver || isGuessActive) return;
    if (!linkGuessState.guessed && !isRoundTimedOut(activeElapsedMs)) return;

    let cancelled = false;

    async function finish() {
      let linkText = linkGuessState.linkText;
      if (!linkGuessState.guessed) {
        try {
          const res = await fetch("/api/check-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puzzleId: puzzle.id, reveal: true }),
          });
          const data = (await res.json()) as { link?: string };
          linkText = data.link ?? null;
        } catch {
          linkText = null;
        }
      }
      if (cancelled) return;

      const result: PlayResult = {
        episodeNumber: puzzle.episodeNumber,
        puzzleId: puzzle.id,
        playedDate: londonDateString(),
        isPractice,
        clueTexts: puzzle.clues.map((c) => c.clueText),
        revealedClueCount: linkGuessState.guessed
          ? (linkGuessState.revealedClueCount ?? revealedCount)
          : revealedCount,
        guessedCorrectly: linkGuessState.guessed,
        totalScore: linkGuessState.guessed ? (linkGuessState.score ?? 0) : 0,
      };

      const store = getPlayerStore(currentUserId);

      try {
        const stats = await store.saveResult(result);
        if (cancelled) return;
        setFinalStats(stats);
      } catch {
        // Non-blocking: the round still ends and results still show — see
        // the "Couldn't save" notice ResultsScreen renders when stats is
        // null. A signed-in player's account just won't reflect this play
        // until they're back online and play again.
        if (cancelled) return;
        setSaveFailed(true);
      }

      // The round is genuinely over now — clear the anti-cheat "in
      // progress" marker (see GameLoop's checking effect) so it doesn't
      // linger. Best-effort: if this fails, the marker is just orphaned
      // (harmless — hasPlayed already gates future visits once saveResult
      // above succeeds; if that also failed, GameLoop's resume path will
      // correctly re-derive an already-timed-out round on the next visit
      // rather than silently granting a free replay).
      void store.clearRoundStart(puzzle.episodeNumber, puzzle.id).catch(() => {});

      setFinalLinkText(linkText);
      setFinalResult(result);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [
    isRoundOver,
    isGuessActive,
    linkGuessState,
    activeElapsedMs,
    puzzle,
    isPractice,
    revealedCount,
    currentUserId,
  ]);

  if (finalResult) {
    return (
      <ResultsScreen
        puzzleTitle={puzzle.title}
        result={finalResult}
        linkText={finalLinkText ?? "?"}
        stats={finalStats}
        saveFailed={saveFailed}
        currentUserId={currentUserId}
      />
    );
  }

  const visibleClues = puzzle.clues.slice(0, revealedCount).map((c) => c.clueText);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <PointsMeter value={currentScore} />
      <ClueList clues={visibleClues} />
      <LinkGuessPanel
        puzzleId={puzzle.id}
        revealedCount={revealedCount}
        currentScore={currentScore}
        guessed={linkGuessState.guessed}
        guessedScore={linkGuessState.score}
        onCorrect={handleLinkCorrect}
        onActiveChange={setIsGuessActive}
      />
    </div>
  );
}
