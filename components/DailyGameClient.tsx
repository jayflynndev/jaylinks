"use client";
import * as React from "react";
import type { PuzzleV1, LocalStateV1 } from "@/lib/types";
import { loadState, saveState, defaultState } from "@/lib/storage";
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
import {
  MAX_CLUES,
  TOAST_TIMEOUT_MS,
  RELOAD_THRESHOLD_MS,
  RELOAD_DELAY_MS,
} from "@/lib/constants";

type Props = {
  puzzle: PuzzleV1;
};

export function DailyGameClient({ puzzle }: Props) {
  const maxClues = Math.min(puzzle.clues.length, MAX_CLUES);

  const [mounted, setMounted] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [state, setState] = React.useState<LocalStateV1>(defaultState());

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [untilResetMs, setUntilResetMs] = React.useState<number>(() =>
    msUntilNextLondonMidnight()
  );

  const hasReloadedRef = React.useRef(false);

  React.useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (hasReloadedRef.current) return;

    // When we hit midnight, msUntilNextLondonMidnight() will jump back up to ~24h.
    // But there's a short moment where it's very close to 0. Use that to reload once.
    if (untilResetMs <= RELOAD_THRESHOLD_MS) {
      hasReloadedRef.current = true;

      window.setTimeout(() => {
        window.location.reload();
      }, RELOAD_DELAY_MS);
    }
  }, [untilResetMs]);

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
    window.setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
  }

  const day = state.history[puzzle.dateISO];
  if (!day) {
    return (
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          className="rounded-2xl border border-amber-400/20
 bg-white/5 p-5 text-white/70"
        >
          Could not load today’s state.
        </div>
      </section>
    );
  }

  const isComplete = day.status === "solved" || day.status === "revealed";
  const isLastClue = day.clueIndex >= maxClues - 1;

  const selectedIsEliminated =
    !!selectedId && day.eliminatedOptionIds.includes(selectedId);

  const streak = state.stats.currentStreak ?? 0;

  function handleSelect(optionId: string) {
    if (isComplete) return;
    // Prevent selecting eliminated options after clues have been revealed
    if (day.eliminatedOptionIds.includes(optionId) && day.clueIndex > 0) return;
    setSelectedId(optionId);
  }

  function handleNextClue() {
    if (isComplete) return;

    const nextState = nextClue(state, puzzle);
    saveState(nextState);
    setState(nextState);
  }

  function handleEliminate() {
    if (isComplete) return;
    if (day.clueIndex > 0) return; // Lock eliminations after clues are revealed
    if (!selectedId) {
      showToast("Select an option first.");
      return;
    }

    const { nextState } = toggleEliminationV1(state, puzzle, selectedId);
    saveState(nextState);
    setState(nextState);
  }

  function handleGuess() {
    if (isComplete) return;
    if (!selectedId) {
      showToast("Select an option first.");
      return;
    }
    if (selectedIsEliminated) {
      showToast("That option is eliminated — select another.");
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

  if (!mounted) {
    return null;
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left: clues */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 self-start space-y-4">
        <div
          className="rounded-2xl border border-purple-400/20
 bg-purple-500/10 p-3 flex items-center justify-between shadow-lg shadow-purple-500/10"
        >
          <div className="text-sm text-white/70">
            <span className="text-white/90 font-semibold">🔥 {streak}</span>{" "}
            <span className="text-white/50">
              {streak === 1 ? "day in a row" : "days in a row"}
            </span>
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
            onToggle={handleSelect}
          />
        )}

        {!isComplete ? (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleNextClue}
              disabled={isLastClue}
              className="rounded-xl border border-purple-400/30
 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/20 disabled:opacity-40 transition"
            >
              Reveal Next clue
            </button>

            <button
              type="button"
              onClick={handleEliminate}
              disabled={!selectedId}
              className="rounded-xl border border-yellow-400/40 bg-yellow-400/15
  px-5 py-2.5 text-sm font-bold
  text-yellow-100 hover:bg-yellow-400/25
  shadow-sm shadow-yellow-500/20 transition"
              title={
                !selectedId ? "Select an option first" : "Eliminate this option"
              }
            >
              Eliminate
            </button>

            <button
              type="button"
              onClick={handleGuess}
              disabled={!selectedId || selectedIsEliminated}
              title={
                !selectedId
                  ? "Select an option first"
                  : selectedIsEliminated
                  ? "That option is eliminated — pick another"
                  : "Submit your guess"
              }
              className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-700
  px-5 py-2.5 text-sm font-semibold text-white
  shadow-lg shadow-purple-500/40
  hover:brightness-110 active:scale-[0.98] transition-all duration-150"
            >
              Guess
            </button>

            <button
              type="button"
              onClick={handleReveal}
              disabled={!isLastClue}
              className="rounded-xl border border-yellow-400/30
 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/20 disabled:opacity-40 transition"
            >
              Reveal answer
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-yellow-400/20
 bg-yellow-500/10 p-5 shadow-lg shadow-yellow-500/10"
          >
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
                className="rounded-xl border border-purple-400/30
 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/20 transition"
              >
                Share
              </button>

              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                className="rounded-xl border border-yellow-400/30
 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/20 transition"
              >
                Stats
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-purple-500/20 p-3 text-sm text-purple-200 border border-purple-400/20">
              Next puzzle in{" "}
              <span className="font-mono text-yellow-300">
                {formatCountdown(untilResetMs)}
              </span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-xl bg-purple-900/90 border border-purple-400/30 px-4 py-2 text-sm text-yellow-200 shadow-lg shadow-purple-500/20 animate-[slideIn_0.3s_ease-out]">
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
