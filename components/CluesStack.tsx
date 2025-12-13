import * as React from "react";

type Props = {
  clues: string[];
  revealedCount: number; // e.g. day.clueIndex + 1
  maxClues: number;
};

export function ClueStack({ clues, revealedCount, maxClues }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">Clues</h2>
        <div className="text-xs text-white/50">
          {Math.min(revealedCount, maxClues)}/{maxClues}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-4">
        <div className="text-xs text-white/50">Current clue</div>
        <div className="mt-1 text-sm font-semibold text-white">
          {clues[Math.min(revealedCount - 1, maxClues - 1)]}
        </div>
      </div>

      <div className="mt-3 hidden lg:block max-h-105 overflow-y-auto pr-1">
        <ol className="space-y-2">
          {clues.slice(0, maxClues).map((c, idx) => {
            const revealed = idx < revealedCount;

            return (
              <li
                key={idx}
                className={[
                  "rounded-xl border px-3 py-2 text-sm leading-snug transition-all duration-150",
                  revealed
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/5 bg-black/30 text-white/35",
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
