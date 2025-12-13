import type { PuzzleV1 } from "./types";
import puzzlesRaw from "@/data/puzzles.json";

export const PUZZLES_V1: PuzzleV1[] = puzzlesRaw as PuzzleV1[];

type GetPuzzleResult =
  | { puzzle: PuzzleV1; isFallback: false }
  | { puzzle: PuzzleV1; isFallback: true; requestedDateISO: string };

export function getPuzzleForDate(
  dateISO: string,
  devFallback: boolean
): GetPuzzleResult | null {
  const exact = PUZZLES_V1.find((p) => p.dateISO === dateISO);
  if (exact) return { puzzle: exact, isFallback: false };

  if (!devFallback) return null;

  const sorted = [...PUZZLES_V1].sort((a, b) =>
    a.dateISO < b.dateISO ? 1 : -1
  );
  const latest = sorted[0];
  if (!latest) return null;

  return { puzzle: latest, isFallback: true, requestedDateISO: dateISO };
}
