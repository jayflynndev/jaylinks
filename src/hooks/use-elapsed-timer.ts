"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks *active* (non-paused) milliseconds elapsed since this hook's
 * component instance mounted — the ticking clock behind each question's
 * points meter. The product brief requires the drain to pause while the
 * on-screen keyboard/input is focused, so this hook accumulates elapsed
 * time across pause/resume segments rather than just diffing a single
 * start time.
 *
 * `initialElapsedMs` seeds the starting position instead of 0 — used to
 * resume a round a player left mid-way and came back to (see GameLoop's
 * anti-cheat round-start tracking): the meter/clue-reveal state picks up
 * from real wall-clock elapsed time rather than restarting fresh, which
 * is exactly what closes the "peek all clues, back out, come back to a
 * reset round" exploit. Only read on first mount (a plain initializer,
 * not re-applied on prop changes) — callers that need a fresh timer per
 * round should mount a fresh component instance by keying it on the
 * puzzle id, which naturally re-initialises this hook's refs/state.
 *
 * There's no "reset" API for the same reason.
 */
export function useElapsedTimer(paused: boolean, initialElapsedMs = 0): number {
  const [elapsedMs, setElapsedMs] = useState(initialElapsedMs);

  // Total active ms accumulated in *previous* run segments (before the
  // current pause/resume cycle).
  const accumulatedRef = useRef(initialElapsedMs);
  // Wall-clock time the current running segment started, or null if paused.
  const segmentStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      if (segmentStartRef.current !== null) {
        accumulatedRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      return;
    }

    segmentStartRef.current = Date.now();
    const intervalId = setInterval(() => {
      const runningMs = segmentStartRef.current !== null ? Date.now() - segmentStartRef.current : 0;
      setElapsedMs(accumulatedRef.current + runningMs);
    }, 100);

    return () => clearInterval(intervalId);
  }, [paused]);

  return elapsedMs;
}
