"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlayerStore } from "@/lib/storage/player-store";
import type { PublicPuzzle } from "@/lib/puzzles/get-daily-puzzle";
import { Countdown } from "./Countdown";
import { PuzzleRound } from "./PuzzleRound";

interface GameLoopProps {
  puzzle: PublicPuzzle;
  /**
   * "preview" is used by the admin puzzle-preview screen: skips the
   * "already played today" gate entirely and always plays as practice
   * (reusing the existing isPractice plumbing — see PlayerStore.saveResult
   * — so a preview play never touches real streak/stats, the same as a
   * player's "play again for practice" replay).
   */
  mode?: "play" | "preview";
  /** The signed-in player's id, or null — resolved server-side once (see src/lib/supabase/player-auth.ts) and passed down; picks which PlayerStore backend this round uses. */
  currentUserId: string | null;
}

type Gate = "checking" | "countdown" | "already-played" | "playing";

/**
 * Handles the "already played today?" gate and the pre-round countdown,
 * then hands off to PuzzleRound for the actual round (meter, clue reveal,
 * link guessing, results). Kept separate from PuzzleRound so that
 * component's timing hooks only ever mount once the gate has resolved to
 * "playing" — starting them any earlier (e.g. during the localStorage
 * check, or while the countdown is still running) would let the clock run
 * before the player is actually ready.
 */
export function GameLoop({ puzzle, mode = "play", currentUserId }: GameLoopProps) {
  const [gate, setGate] = useState<Gate>(mode === "preview" ? "countdown" : "checking");
  const [isPractice, setIsPractice] = useState(mode === "preview");
  // How far into the round to start PuzzleRound's clocks — 0 for a fresh
  // round, or real elapsed wall-clock time when resuming one left
  // mid-way (see the checking effect below). Never touched for practice
  // plays, which always start fresh.
  const [initialElapsedMs, setInitialElapsedMs] = useState(0);

  // One play per puzzle per device/account per day — see PlayerStore.hasPlayed.
  // This has to be an effect, not state computed during render: the
  // localStorage-backed store can't be read during SSR, and the
  // account-backed store is a network call either way. The gate starts at
  // "checking" precisely so the server-rendered and first-client-render
  // markup match before this effect updates it. Fails open (treats an
  // error as "not played yet") — safe because SupabasePlayerStore.saveResult
  // always upserts-then-recomputes from the full history rather than
  // incrementing, so a stray re-play just overwrites the same row instead
  // of double-counting.
  //
  // Anti-cheat: beyond "already played", this also records (or reads back)
  // the round's true start time via getOrStartRound — see PlayerStore.
  // Without this, a player could watch all 5 clues reveal, back out before
  // the round naturally times out (nothing gets saved until it does), and
  // come back to a brand-new round with full knowledge of the answer and a
  // full meter. If a round was already started earlier, this skips the
  // countdown and resumes PuzzleRound's clocks from the real elapsed time
  // instead — which, if enough real time has passed, may mean the round
  // is already over the instant it mounts. PuzzleRound's own timeout
  // handling takes it from there unchanged; nothing else needed to special-
  // case that here.
  useEffect(() => {
    if (mode === "preview") return; // gate already starts "countdown" — see useState above.
    let cancelled = false;
    async function check() {
      const store = getPlayerStore(currentUserId);
      let alreadyPlayed = false;
      try {
        alreadyPlayed = await store.hasPlayed(puzzle.episodeNumber);
      } catch {
        alreadyPlayed = false;
      }
      if (cancelled) return;
      if (alreadyPlayed) {
        setGate("already-played");
        return;
      }

      try {
        const round = await store.getOrStartRound(puzzle.episodeNumber, puzzle.id);
        if (cancelled) return;
        if (round.isNew) {
          setGate("countdown");
        } else {
          setInitialElapsedMs(Date.now() - round.startedAtMs);
          setGate("playing");
        }
      } catch {
        // Couldn't record/read a round start (e.g. offline) — fail open
        // with a normal fresh round rather than blocking play entirely.
        if (!cancelled) setGate("countdown");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [puzzle.episodeNumber, puzzle.id, mode, currentUserId]);

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
              setGate("countdown");
            }}
            className="rounded-full bg-yellow-300 px-6 py-3 font-display tracking-wide text-purple-950"
          >
            Play for practice
          </button>
        </div>
      </div>
    );
  }

  if (gate === "countdown") {
    return (
      <Countdown episodeNumber={puzzle.episodeNumber} onComplete={() => setGate("playing")} />
    );
  }

  return (
    <PuzzleRound
      key={puzzle.id}
      puzzle={puzzle}
      isPractice={isPractice}
      currentUserId={currentUserId}
      initialElapsedMs={initialElapsedMs}
    />
  );
}
