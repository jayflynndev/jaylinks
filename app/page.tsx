export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
      <main
        className="min-h-dvh text-white"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(147,51,234,0.40), transparent 55%)," +
            "radial-gradient(80% 60% at 20% 30%, rgba(139,69,19,0.25), transparent 55%)," +
            "radial-gradient(60% 40% at 90% 40%, rgba(245,158,11,0.20), transparent 55%)," +
            "#0a0613",
        }}
      >
        <div className="mx-auto w-full max-w-xl px-4 py-10">
          <header className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Jay’s Links</h1>
            <p className="mt-1 text-sm text-white/60">
              <span className="font-mono">{todayISO}</span>
            </p>
          </header>

          <div
            className="mt-6 rounded-2xl border border-yellow-400/20
 bg-yellow-500/10 p-5 text-yellow-200"
          >
            Today’s puzzle isn’t available.
          </div>

          <p className="mt-3 text-sm text-white/50">Check back later.</p>
        </div>
      </main>
    );
  }

  const { puzzle } = result;

  return (
    <main
      className="min-h-dvh text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, rgba(168,85,247,0.30), transparent 55%)," +
          "radial-gradient(80% 60% at 20% 30%, rgba(99,102,241,0.18), transparent 55%)," +
          "radial-gradient(60% 40% at 90% 40%, rgba(245,158,11,0.10), transparent 55%)," +
          "#0a0613",
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="text-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Jay’s Links
            </h1>

            <p className="mt-1 text-sm text-white/70">
              Today’s puzzle is ready 👀
            </p>

            <div className="mx-auto mt-3 h-px w-24 bg-linear-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </header>

        {result.isFallback && (
          <div className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
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
