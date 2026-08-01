"use client";

import { useEffect, useState } from "react";

/**
 * The "First Time?" trigger + its instructions modal, shown on the home
 * screen above the Play CTA. A brand-new visitor has no other explanation
 * of the clue-reveal/link-guess mechanic anywhere on the page, so this is
 * the one place a first-timer can find out what they're about to do
 * before committing to today's play.
 */
export function HowToPlayModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape, and stop the page scrolling behind the modal while
  // it's open — only wired up while actually open, so it costs nothing
  // the rest of the time.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border-2 border-yellow-300/60 px-6 py-2 font-sans text-sm text-yellow-100 transition hover:border-yellow-300"
      >
        First time? How to play
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-to-play-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="bulb-ring max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[2rem] border-4 border-yellow-300 bg-gradient-to-b from-purple-700 to-purple-950 p-6 shadow-[0_0_45px_rgba(250,204,21,0.2)] sm:p-8"
          >
            <h2
              id="how-to-play-title"
              className="text-center font-display text-3xl tracking-wide text-yellow-300 [text-shadow:0_2px_0_rgba(46,16,101,1)]"
            >
              How to play
            </h2>

            <ol className="mt-5 flex flex-col gap-4 font-sans text-yellow-50">
              <li>
                <span className="font-display text-yellow-300">1. A new puzzle every day.</span>{" "}
                5 clue words reveal one at a time, 5 seconds apart. You don&apos;t answer the
                clues — just watch them appear.
              </li>
              <li>
                <span className="font-display text-yellow-300">2. They all share one hidden link.</span>{" "}
                E.g. Sesame, Quality, Baker, Coronation, Fleet → all types of{" "}
                <span className="italic">Street</span>.
              </li>
              <li>
                <span className="font-display text-yellow-300">3. Guess the link, any time.</span>{" "}
                Tap &ldquo;Guess the link&rdquo; as soon as you think you know it — even after just
                one clue.
              </li>
              <li>
                <span className="font-display text-yellow-300">4. Faster is worth more.</span>{" "}
                Your score drains the longer you wait, so an early correct guess scores higher
                than a late one.
              </li>
              <li>
                <span className="font-display text-yellow-300">5. Wrong guess?</span> The button
                locks until the next clue appears — then you can try again.
              </li>
              <li>
                <span className="font-display text-yellow-300">6. One play a day.</span> Nail it
                before all 5 clues run out, then come back tomorrow for the next one.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full rounded-full bg-yellow-300 px-8 py-3 font-display text-lg tracking-wide text-purple-950 transition active:translate-y-0.5"
            >
              Got it, let&apos;s play
            </button>
          </div>
        </div>
      )}
    </>
  );
}
