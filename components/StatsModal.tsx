"use client";

import * as React from "react";
import type { StatsV1 } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  stats: StatsV1;
};

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function StatsModal({ open, onClose, stats }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close stats"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-amber-400/20
 bg-zinc-950 p-5 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Stats</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-amber-400/20
 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard label="Played" value={stats.played} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Current streak" value={stats.currentStreak} />
          <StatCard label="Longest streak" value={stats.longestStreak} />
          <StatCard label="Avg clues" value={round1(stats.avgCluesUsed)} />
        </div>

        <p className="mt-4 text-xs text-white/50">
          Stats are stored locally on this device (v1).
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="rounded-2xl border border-amber-400/20
 bg-white/5 p-4"
    >
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
