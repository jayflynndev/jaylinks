"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/time/format-duration";
import { millisecondsUntilNextLondonMidnight } from "@/lib/time/london";

/**
 * A "next puzzle unlocks in HH:MM:SS" countdown, ticking every second.
 * Only ever mounted client-side (the results screen only appears after
 * the game loop's client-side state reaches "complete"), so there's no
 * SSR/hydration mismatch to worry about here — unlike GameLoop's
 * localStorage-dependent gate check, this can safely compute its initial
 * value directly.
 */
export function useCountdownToNextPuzzle(): string {
  const [remainingMs, setRemainingMs] = useState(() => millisecondsUntilNextLondonMidnight());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingMs(millisecondsUntilNextLondonMidnight());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return formatCountdown(remainingMs);
}
