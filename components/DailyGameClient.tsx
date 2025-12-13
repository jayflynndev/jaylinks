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
import { ClueCard } from "./ClueCard";
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
      <section className="mt-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
          Could not load today’s state.
        </div>
      </section>
    );
  }

  const isComplete = day.status === "solved" || day.status === "revealed";
  const clueText = puzzle.clues[day.clueIndex] ?? puzzle.clues[0];
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
    saveState(nextState);
    setState(nextState);

    if (!correct) showToast("Not quite.");
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
    <section className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStatsOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Stats
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Share
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <div>
          🔥{" "}
          <span className="font-medium text-white/80">
            {state.stats.currentStreak}
          </span>{" "}
          <span className="text-white/50">streak</span>
        </div>
        <div>
          Clue{" "}
          <span className="font-medium text-white/80">{day.clueIndex + 1}</span>
          /<span className="font-medium text-white/80">{maxClues}</span>
        </div>
      </div>

      <ClueCard
        clueText={clueText}
        clueIndex={day.clueIndex}
        clueTotal={maxClues}
      />

      <OptionGrid
        options={puzzle.options}
        eliminatedIds={new Set(day.eliminatedOptionIds)}
        selectedId={selectedId}
        onToggle={handleTileClick}
      />

      {!isComplete ? (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleNextClue}
            disabled={isLastClue}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
          >
            Next clue
          </button>

          <button
            type="button"
            onClick={handleGuess}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Guess
          </button>

          <button
            type="button"
            onClick={handleReveal}
            disabled={!isLastClue}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
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
            {day.status === "solved" ? "Solved" : "Revealed"} •{" "}
            {day.cluesUsed ?? day.clueIndex + 1} clue
            {(day.cluesUsed ?? day.clueIndex + 1) === 1 ? "" : "s"}
          </div>

          <div className="mt-2 text-xl font-semibold">
            Answer:{" "}
            {puzzle.options.find((o) => o.id === puzzle.answerOptionId)
              ?.label ?? "—"}
          </div>

          <p className="mt-3 text-white/80">{puzzle.explanation}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => setStatsOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Stats
            </button>
            <p className="mt-3 text-white/80">
              Come back tomorrow for the next puzzle.
            </p>
            <p className="mt-2 text-sm text-white/60">
              Next puzzle in{" "}
              <span className="font-mono">{formatCountdown(untilResetMs)}</span>
            </p>
          </div>
        </div>
      )}

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
