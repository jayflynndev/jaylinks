"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownProps {
  episodeNumber: number;
  onComplete: () => void;
}

const STEPS = ["3", "2", "1", "GO!"];
const STEP_MS = 700;

/**
 * A brief "3, 2, 1, GO" beat shown between clicking Play and the round
 * actually starting. Without this, PuzzleRound's clocks (the points meter
 * and clue reveal) start ticking the instant it mounts — no warning, no
 * time to get ready. Rendered by GameLoop as its own gate state, so
 * PuzzleRound only ever mounts (and starts its timers) once this
 * component's onComplete fires.
 */
export function Countdown({ episodeNumber, onComplete }: CountdownProps) {
  const [stepIndex, setStepIndex] = useState(0);

  // Avoids needing onComplete in the countdown effect's dependency array
  // (it's a fresh function identity every parent render) while still
  // always calling the latest version. Ref writes must happen in an
  // effect, not during render, per the React Compiler's rules.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex((i) => i + 1);
      } else {
        onCompleteRef.current();
      }
    }, STEP_MS);
    return () => clearTimeout(timeout);
  }, [stepIndex]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <p className="font-display text-lg tracking-wide text-yellow-100/80">
        Get ready for Link #{episodeNumber}…
      </p>
      <p
        key={stepIndex}
        className="animate-[pulse_0.3s_ease-out] font-display text-8xl text-yellow-300 [text-shadow:0_4px_0_rgba(46,16,101,1)]"
      >
        {STEPS[stepIndex]}
      </p>
    </div>
  );
}
