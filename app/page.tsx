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
    <main className="min-h-dvh text-white bg-zinc-950 [background:radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%),radial-gradient(60%_40%_at_10%_20%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(60%_40%_at_90%_30%,rgba(59,130,246,0.14),transparent_55%),#09090b]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="flex items-end justify-between gap-4">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Jay’s Links
            </h1>

            <p className="text-sm text-white/60">
              Daily puzzle · {puzzle.dateISO}
            </p>

            <div className="mx-auto mt-3 h-px w-24 bg-linear-to-r from-transparent via-white/20 to-transparent" />
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
