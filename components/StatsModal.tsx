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
        className="relative w-full max-w-md rounded-2xl border border-purple-400/20
 bg-black/90 p-5 text-white shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center justify-center relative">
          <h2 className="text-lg font-semibold tracking-tight">Stats</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 rounded-xl border border-purple-400/30
 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-200 hover:bg-purple-500/20"
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
      className="rounded-2xl border border-yellow-400/20
 bg-yellow-500/10 p-4 shadow-lg shadow-yellow-500/10"
    >
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
