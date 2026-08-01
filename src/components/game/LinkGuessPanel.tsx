"use client";

import { useState } from "react";
import { isLinkGuessAvailable, linkBonusForRevealedCount } from "@/lib/scoring/scoring";
import type { LinkGuessOutcome } from "./types";

interface LinkGuessPanelProps {
  puzzleId: string;
  /** How many questions have been fully resolved (revealed) so far — the link button is available from 1 onward. */
  revealedCount: number;
  /** True once the link has already been correctly guessed (parent-owned, so the state survives question advances). */
  guessed: boolean;
  guessedBonus: number | null;
  onCorrect: (outcome: LinkGuessOutcome) => void;
}

interface CheckLinkResponse {
  correct: boolean;
  link?: string;
  error?: string;
}

/**
 * The persistent "I KNOW THE LINK!" button and its inline guess form. A
 * wrong guess locks the button until the next answer is revealed (one
 * attempt per bonus tier, per the product brief) — tracked by remembering
 * the revealedCount a wrong guess happened at, and only re-enabling once
 * revealedCount has moved past it.
 */
export function LinkGuessPanel({
  puzzleId,
  revealedCount,
  guessed,
  guessedBonus,
  onCorrect,
}: LinkGuessPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guessValue, setGuessValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedAtRevealedCount, setLockedAtRevealedCount] = useState<number | null>(null);
  const [wrongMessage, setWrongMessage] = useState<string | null>(null);

  if (guessed) {
    return (
      <div className="w-full rounded-2xl border-2 border-emerald-300/60 bg-emerald-900/30 px-5 py-3 text-center">
        <p className="font-display text-lg tracking-wide text-emerald-300">
          🔗 Link guessed! +{guessedBonus}
        </p>
      </div>
    );
  }

  if (!isLinkGuessAvailable(revealedCount)) {
    return null;
  }

  const isLocked = lockedAtRevealedCount !== null && revealedCount <= lockedAtRevealedCount;
  const currentBonus = linkBonusForRevealedCount(revealedCount);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting || isLocked) return;
    const guess = guessValue.trim();
    if (guess.length === 0) return;

    setIsSubmitting(true);
    setWrongMessage(null);

    fetch("/api/check-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId, guess }),
    })
      .then((res) => res.json() as Promise<CheckLinkResponse>)
      .then((data) => {
        if (data.correct) {
          onCorrect({ bonus: currentBonus, revealedAtCount: revealedCount, linkText: data.link ?? guess });
          setIsOpen(false);
        } else {
          setLockedAtRevealedCount(revealedCount);
          setWrongMessage("Not quite — locked until the next answer is revealed.");
          setGuessValue("");
        }
      })
      .catch(() => {
        setWrongMessage("Couldn't check that guess — check your connection.");
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isLocked}
          className="w-full rounded-full border-2 border-yellow-300 bg-purple-800/80 px-5 py-3 font-display text-lg tracking-wide text-yellow-300 transition disabled:cursor-not-allowed disabled:border-yellow-300/30 disabled:text-yellow-300/40"
        >
          {isLocked ? "Locked until next clue…" : `🔗 I KNOW THE LINK! (+${currentBonus})`}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border-2 border-yellow-300/50 bg-purple-950/70 p-4 sm:flex-row"
        >
          <input
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            value={guessValue}
            onChange={(event) => setGuessValue(event.target.value)}
            disabled={isSubmitting}
            placeholder="What's the link?"
            className="flex-1 rounded-full border-2 border-yellow-300/50 bg-purple-900/70 px-5 py-3 text-lg text-yellow-50 placeholder:text-yellow-100/40 focus:border-yellow-300 focus:outline-none disabled:opacity-60"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || guessValue.trim().length === 0}
              className="flex-1 rounded-full bg-yellow-300 px-6 py-3 font-display text-lg tracking-wide text-purple-950 transition disabled:opacity-50 sm:flex-none"
            >
              {isSubmitting ? "Checking…" : "Guess"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border-2 border-yellow-300/40 px-4 py-3 font-sans text-yellow-100/80"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {wrongMessage && (
        <p className="mt-2 text-center font-sans text-sm text-red-300">{wrongMessage}</p>
      )}
    </div>
  );
}
