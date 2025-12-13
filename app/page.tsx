import * as React from "react";
import { todayISOInLondon } from "@/lib/date";
import { getPuzzleForDate } from "@/lib/puzzles";
import { DailyGameClient } from "@/components/DailyGameClient";

export default function Page() {
  const todayISO = todayISOInLondon();

  const devFallback = process.env.NODE_ENV === "development";
  const result = getPuzzleForDate(todayISO, devFallback);

  if (!result) {
    return (
      <main className="min-h-dvh bg-zinc-950 text-white">
        <div className="mx-auto w-full max-w-xl px-4 py-10">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">Jay’s Links</h1>
            <p className="mt-1 text-sm text-white/60">
              <span className="font-mono">{todayISO}</span>
            </p>
          </header>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
            Today’s puzzle isn’t available.
          </div>

          <p className="mt-3 text-sm text-white/50">Check back later.</p>
        </div>
      </main>
    );
  }

  const { puzzle } = result;

  return (
    <main className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jay’s Links</h1>
            <p className="mt-1 text-sm text-white/60">
              #{puzzle.id} • <span className="font-mono">{puzzle.dateISO}</span>
            </p>
          </div>
        </header>

        {result.isFallback && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Dev fallback: no puzzle for{" "}
            <span className="font-mono">{result.requestedDateISO}</span> —
            showing <span className="font-mono">{puzzle.dateISO}</span>.
          </div>
        )}

        <DailyGameClient puzzle={puzzle} />
      </div>
    </main>
  );
}
