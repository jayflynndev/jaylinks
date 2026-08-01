"use client";

import { useState } from "react";
import Link from "next/link";
import { useCountdownToNextPuzzle } from "@/hooks/use-countdown-to-next-puzzle";
import type { PlayerStats, PlayResult } from "@/lib/storage/types";
import { buildShareText, questionEmoji } from "@/lib/sharing/share-card";
import { ShareButton } from "./ShareButton";
import type { RevealedAnswer } from "./types";

interface ResultsScreenProps {
  puzzleTitle: string;
  result: PlayResult;
  revealedAnswers: RevealedAnswer[];
  /** The canonical link answer — always shown at this point, whether or not the player guessed it. */
  linkText: string;
  stats: PlayerStats;
}

/**
 * The end-of-puzzle results screen: score, per-question breakdown, link
 * reveal/bonus, current streak, a share card, and a countdown to the next
 * puzzle. Everything it needs (the PlayResult, the streak-updated
 * PlayerStats, and the revealed answers/link text) is computed by GameLoop
 * once the puzzle completes and handed down as props — this component is
 * purely presentational.
 */
export function ResultsScreen({
  puzzleTitle,
  result,
  revealedAnswers,
  linkText,
  stats,
}: ResultsScreenProps) {
  const countdown = useCountdownToNextPuzzle();

  // In practice this only ever renders client-side (reached through
  // GameLoop's "checking" -> ... -> "complete" client state machine, never
  // during SSR), but Next.js still does an initial server render pass for
  // "use client" components — guard against `window` genuinely not
  // existing there rather than relying solely on the caller's gating.
  const [appUrl] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const shareText = buildShareText({
    episodeNumber: result.episodeNumber,
    questionResults: result.questionResults,
    linkGuessedAfterRevealedCount: result.linkGuessedAfterRevealedCount,
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

      <ol className="flex flex-col gap-2">
        {revealedAnswers.map((answer, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-xl border border-yellow-300/20 bg-purple-950/40 px-4 py-2"
          >
            <span className="font-display text-xl leading-none">
              {questionEmoji(result.questionResults[index])}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-xs text-yellow-100/60">{answer.questionText}</p>
              <p className="font-sans text-base text-yellow-50">{answer.answerText}</p>
            </div>
            <span className="font-display text-lg tabular-nums text-yellow-300">
              +{result.questionResults[index].pointsBanked}
            </span>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border-2 border-yellow-300/40 bg-purple-900/60 p-4 text-center">
        <p className="font-sans text-xs tracking-wide text-yellow-100/60 uppercase">The link</p>
        <p className="mt-1 font-display text-2xl text-yellow-300">🔗 {linkText}</p>
        <p className="mt-1 font-sans text-yellow-100">
          {result.linkGuessedAfterRevealedCount !== null
            ? `Guessed after ${result.linkGuessedAfterRevealedCount} answer${result.linkGuessedAfterRevealedCount === 1 ? "" : "s"} — +${result.linkBonus}`
            : "Not guessed this time — 0 bonus"}
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
