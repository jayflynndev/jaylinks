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
 * There's no "reset" API: callers that need a fresh timer per question
 * (e.g. QuestionCard) should mount a fresh component instance by keying
 * it on the question id, which naturally re-initialises this hook's
 * refs/state — simpler and avoids an effect whose only job is resetting
 * state in response to a prop change.
 */
export function useElapsedTimer(paused: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  // Total active ms accumulated in *previous* run segments (before the
  // current pause/resume cycle).
  const accumulatedRef = useRef(0);
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
