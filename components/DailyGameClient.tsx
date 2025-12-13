"use client";

import * as React from "react";
import type { PuzzleV1, LocalStateV1 } from "@/lib/types";
import { loadState, saveState } from "@/lib/storage";
import {
  getOrCreateDay,
  nextClue,
  toggleEliminationV1,
  submitGuessV1,
  revealAnswerV1,
} from "@/lib/game";
import { ClueStack } from "./CluesStack";
import { OptionGrid } from "./OptionGrid";
import { StatsModal } from "./StatsModal";
import { msUntilNextLondonMidnight, formatCountdown } from "@/lib/reset";

type Props = {
  puzzle: PuzzleV1;
};

export function DailyGameClient({ puzzle }: Props) {
  const maxClues = Math.min(puzzle.clues.length, 5);

  const [toast, setToast] = React.useState<string | null>(null);
  const [state, setState] = React.useState<LocalStateV1>(() => loadState());

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [untilResetMs, setUntilResetMs] = React.useState<number>(() =>
    msUntilNextLondonMidnight()
  );

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setUntilResetMs(msUntilNextLondonMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    const withDay = getOrCreateDay(state, puzzle);
    saveState(withDay);
    setState(withDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  const day = state.history[puzzle.dateISO];
  if (!day) {
    return (
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
          Could not load today’s state.
        </div>
      </section>
    );
  }

  const isComplete = day.status === "solved" || day.status === "revealed";
  const isLastClue = day.clueIndex >= maxClues - 1;

  function handleTileClick(optionId: string) {
    if (isComplete) return;

    // If it's eliminated, clicking it just un-eliminates.
    // If it's active, clicking selects it as your "guess candidate" AND still allows elimination with a long-press later.
    // For v1 simplicity: click selects. Shift/eliminate is a separate control? No.
    // So: we keep your original mechanic: click toggles elimination.
    // And selection is set as well (so user can guess without typing).
    setSelectedId(optionId);

    const { nextState, blocked } = toggleEliminationV1(state, puzzle, optionId);
    if (blocked) {
      showToast("That still fits the clues so far.");
      return;
    }

    saveState(nextState);
    setState(nextState);
  }

  function handleNextClue() {
    if (isComplete) return;

    const nextState = nextClue(state, puzzle);
    saveState(nextState);
    setState(nextState);
  }

  function handleGuess() {
    if (isComplete) return;
    if (!selectedId) {
      showToast("Select an option first.");
      return;
    }

    const { nextState, correct } = submitGuessV1(state, puzzle, selectedId);

    // If wrong, end the game by revealing the answer immediately (v1: no "failed" status needed)
    const finalState = correct ? nextState : revealAnswerV1(nextState, puzzle);

    saveState(finalState);
    setState(finalState);

    showToast(correct ? "Correct!" : "Not quite.");
  }

  function handleReveal() {
    if (isComplete) return;

    const nextState = revealAnswerV1(state, puzzle);
    saveState(nextState);
    setState(nextState);
  }

  async function handleShare() {
    const cluesUsed = day.cluesUsed ?? day.clueIndex + 1;
    const text = `Jay’s Links #${puzzle.id}\nSolved in ${cluesUsed} clue${
      cluesUsed === 1 ? "" : "s"
    }\n${window.location.href}`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // fall back to clipboard
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard.");
    } catch {
      showToast("Couldn’t share on this device.");
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left: clues */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 self-start space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
          <div className="text-sm text-white/70">
            <span className="text-white/90 font-semibold">
              🔥 {state.stats.currentStreak}
            </span>{" "}
            <span className="text-white/50">day streak</span>
          </div>

          <div className="text-sm text-white/60">
            Clue{" "}
            <span className="font-medium text-white/80">
              {day.clueIndex + 1}
            </span>
            /<span className="font-medium text-white/80">{maxClues}</span>
          </div>
        </div>

        <ClueStack
          clues={puzzle.clues}
          revealedCount={day.clueIndex + 1}
          maxClues={maxClues}
        />
      </div>

      {/* Right: grid + actions */}
      <div className="lg:col-span-7 space-y-4">
        {!isComplete && (
          <OptionGrid
            options={puzzle.options}
            eliminatedIds={new Set(day.eliminatedOptionIds)}
            selectedId={selectedId}
            onToggle={handleTileClick}
          />
        )}

        {!isComplete ? (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleNextClue}
              disabled={isLastClue}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40 transition"
            >
              Next clue
            </button>

            <button
              type="button"
              onClick={handleGuess}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 transition"
              disabled={!selectedId}
              title={
                !selectedId ? "Select an option first" : "Submit your guess"
              }
            >
              Guess
            </button>

            <button
              type="button"
              onClick={handleReveal}
              disabled={!isLastClue}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40 transition"
              title={
                !isLastClue
                  ? "Reveal becomes available on the final clue"
                  : "Reveal the answer"
              }
            >
              Reveal answer
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">
              {day.status === "solved" ? "✅ Correct!" : "❌ Not quite."} •{" "}
              {day.cluesUsed ?? day.clueIndex + 1} clue
              {(day.cluesUsed ?? day.clueIndex + 1) === 1 ? "" : "s"}
            </div>

            <div className="mt-2 text-xl font-semibold">
              Answer:{" "}
              {puzzle.options.find((o) => o.id === puzzle.answerOptionId)
                ?.label ?? "—"}
            </div>

            <p className="mt-3 text-white/80">{puzzle.explanation}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Share
              </button>

              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              >
                Stats
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white/80">
              Next puzzle in{" "}
              <span className="font-mono">{formatCountdown(untilResetMs)}</span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-xl bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={state.stats}
      />
    </section>
  );
}
