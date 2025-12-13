import * as React from "react";

type Props = {
  clueText: string;
  clueIndex: number; // 0-based
  clueTotal: number;
};

export function ClueCard({ clueText, clueIndex, clueTotal }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Clue</h2>
        <span className="text-sm text-white/60">
          {clueIndex + 1}/{clueTotal}
        </span>
      </div>

      <p className="mt-3 text-base leading-relaxed text-white/90">{clueText}</p>
    </div>
  );
}
