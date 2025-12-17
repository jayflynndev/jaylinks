import * as React from "react";
import { MAX_CLUES } from "@/lib/constants";

type Props = {
  clues: string[];
  revealedCount: number; // e.g. day.clueIndex + 1
  maxClues: number;
};

export function ClueStack({ clues, revealedCount, maxClues }: Props) {
  return (
    <div
      className="rounded-3xl border border-purple-400/20
 bg-purple-500/10 p-4 shadow-lg shadow-purple-500/10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">Clues</h2>
        <div className="text-xs text-white/50">
          {Math.min(revealedCount, maxClues)}/{maxClues}
        </div>
      </div>

      <div
        className="mt-3 rounded-3xl border border-yellow-400/30 
        bg-gradient-to-br from-yellow-400/15 via-yellow-300/10 to-transparent
        p-5 shadow-lg shadow-yellow-500/10"
      >
        <div className="text-xs uppercase tracking-wide text-amber-300/80">
          Today’s clues
        </div>
        <div className="mt-2 text-lg font-semibold text-white leading-relaxed transition-opacity duration-300">
          {clues[Math.min(revealedCount - 1, maxClues - 1)]}
        </div>
      </div>

      <div className="mt-3 hidden lg:block max-h-105 overflow-y-auto pr-1">
        <ol className="space-y-2">
          {clues.slice(0, MAX_CLUES).map((c, idx) => {
            const revealed = idx < revealedCount;

            return (
              <li
                key={idx}
                className={[
                  "rounded-xl border px-3 py-2 text-sm leading-snug transition-all duration-150",
                  revealed
                    ? " border-amber-400/20 text-white"
                    : "bg-[#1a1d24]  text-white/35",
                  revealed && idx === revealedCount - 1
                    ? "ring-2 ring-white/20"
                    : "",
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-white/50">Clue {idx + 1}</span>
                  {!revealed && <span className="text-xs">Locked</span>}
                </div>

                {revealed ? c : "Reveal the next clue to see this."}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
