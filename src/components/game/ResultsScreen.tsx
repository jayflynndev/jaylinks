"use client";

import { useState } from "react";
import Link from "next/link";
import { useCountdownToNextPuzzle } from "@/hooks/use-countdown-to-next-puzzle";
import type { PlayerStats, PlayResult } from "@/lib/storage/types";
import { buildShareText } from "@/lib/sharing/share-card";
import { ShareButton } from "./ShareButton";

interface ResultsScreenProps {
  puzzleTitle: string;
  result: PlayResult;
  /** The canonical link answer — always shown at this point, whether or not the player guessed it. */
  linkText: string;
  stats: PlayerStats;
}

/**
 * The end-of-round results screen: score, the 5 clue words, the link
 * reveal, current streak, a share card, and a countdown to the next
 * puzzle. Everything it needs (the PlayResult and the streak-updated
 * PlayerStats) is computed by GameLoop once the round completes and
 * handed down as props — this component is purely presentational.
 */
export function ResultsScreen({ puzzleTitle, result, linkText, stats }: ResultsScreenProps) {
  const countdown = useCountdownToNextPuzzle();

  // In practice this only ever renders client-side (reached through
  // GameLoop's "checking" -> ... -> "complete" client state machine, never
  // during SSR), but Next.js still does an initial server render pass for
  // "use client" components — guard against `window` genuinely not
  // existing there rather than relying solely on the caller's gating.
  const [appUrl] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const shareText = buildShareText({
    episodeNumber: result.episodeNumber,
    guessedCorrectly: result.guessedCorrectly,
    revealedClueCount: result.revealedClueCount,
    totalScore: result.totalScore,
    appUrl,
  });

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="rounded-3xl border-2 border-yellow-300/40 bg-purple-900/60 p-6 text-center">
        {result.isPractice && (
          <p className="mb-2 font-sans text-sm tracking-wide text-yellow-100/70 uppercase">
            Practice — doesn&apos;t count
          </p>
        )}
        <p className="font-sans text-yellow-100/80">{puzzleTitle}</p>
        <p className="mt-1 font-display text-4xl text-yellow-300">
          {result.totalScore.toLocaleString("en-GB")}
        </p>
        <p className="font-sans text-sm text-yellow-100/60">points</p>
      </div>

      <ol className="flex flex-wrap justify-center gap-2">
        {result.clueTexts.map((clue, index) => (
          <li
            key={index}
            className="rounded-full border-2 border-yellow-300/30 bg-purple-950/40 px-4 py-1.5 font-sans text-yellow-50"
          >
            {clue}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border-2 border-yellow-300/40 bg-purple-900/60 p-4 text-center">
        <p className="font-sans text-xs tracking-wide text-yellow-100/60 uppercase">The link</p>
        <p className="mt-1 font-display text-2xl text-yellow-300">🔗 {linkText}</p>
        <p className="mt-1 font-sans text-yellow-100">
          {result.guessedCorrectly
            ? `Guessed after ${result.revealedClueCount} clue${result.revealedClueCount === 1 ? "" : "s"}`
            : "Not guessed this time"}
        </p>
      </div>

      {!result.isPractice && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-yellow-300/40 bg-purple-900/60 p-4 text-center">
          <span className="font-display text-2xl text-yellow-300">🔥 {stats.currentStreak}</span>
          <span className="font-sans text-yellow-100/80">
            day{stats.currentStreak === 1 ? "" : "s"} streak
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <ShareButton text={shareText} />
        <p className="font-sans text-sm text-yellow-100/60">Next puzzle in {countdown}</p>
        <Link href="/" className="font-sans text-yellow-100/80 underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
