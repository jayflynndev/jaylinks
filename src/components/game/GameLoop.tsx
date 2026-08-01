"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlayerStore } from "@/lib/storage/player-store";
import type { PublicPuzzle } from "@/lib/puzzles/get-daily-puzzle";
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
}

type Gate = "checking" | "ready" | "already-played";

/**
 * Handles the "already played today?" gate, then hands off to PuzzleRound
 * for the actual round (meter, clue reveal, link guessing, results). Kept
 * separate from PuzzleRound so that component's timing hooks only ever
 * mount once the gate has resolved to "ready" — starting them any earlier
 * (e.g. during the localStorage check itself) would let the clock run
 * before the player can actually see/play the round.
 */
export function GameLoop({ puzzle, mode = "play" }: GameLoopProps) {
  const [gate, setGate] = useState<Gate>(mode === "preview" ? "ready" : "checking");
  const [isPractice, setIsPractice] = useState(mode === "preview");

  // One play per puzzle per device per day — see PlayerStore.hasPlayed.
  // This has to be an effect, not state computed during render: localStorage
  // (what PlayerStore reads) doesn't exist during SSR, so the check can only
  // run after this client component has mounted in the browser. The gate
  // starts at "checking" precisely so the server-rendered and first-client-
  // render markup match before this effect updates it.
  useEffect(() => {
    if (mode === "preview") return; // gate already starts "ready" — see useState above.
    const alreadyPlayed = getPlayerStore().hasPlayed(puzzle.episodeNumber);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGate(alreadyPlayed ? "already-played" : "ready");
  }, [puzzle.episodeNumber, mode]);

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

  return <PuzzleRound key={puzzle.id} puzzle={puzzle} isPractice={isPractice} />;
}
