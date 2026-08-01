"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mergeLocalHistoryAction } from "@/app/actions/player-store-actions";
import { signOutAction } from "@/app/account/actions";
import { exportLocalHistory } from "@/lib/storage/local-export";
import type { PlayerStats } from "@/lib/storage/types";
import type { PlayHistoryItem } from "@/lib/storage/player-history-queries";

interface AccountDashboardProps {
  userId: string;
  email: string | null;
  stats: PlayerStats;
  history: PlayHistoryItem[];
}

const MERGE_FLAG_KEY = "jayslinks:merged:v1";

/**
 * Signed-in view of /account: stats, history, sign out, and the one-time
 * local-history merge. The merge trigger lives here (not in
 * PlayerAuthForm) so it fires exactly once regardless of which path
 * landed the player here — a direct sign-in/up, or clicking an email
 * confirmation link (which also points at /account).
 */
export function AccountDashboard({ userId, email, stats, history }: AccountDashboardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(MERGE_FLAG_KEY) === userId) return;

    const localHistory = exportLocalHistory();
    if (localHistory.length === 0) {
      window.localStorage.setItem(MERGE_FLAG_KEY, userId);
      return;
    }

    let cancelled = false;
    async function merge() {
      setIsSyncing(true);
      try {
        await mergeLocalHistoryAction(localHistory);
        window.localStorage.setItem(MERGE_FLAG_KEY, userId);
        if (!cancelled) router.refresh();
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }
    void merge();
    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="rounded-3xl border-2 border-yellow-300/40 bg-purple-900/60 p-6 text-center">
        {email && <p className="font-sans text-yellow-100/80">{email}</p>}
        {isSyncing && (
          <p className="mt-2 font-sans text-sm text-yellow-100/60">Syncing your progress…</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Streak" value={`🔥 ${stats.currentStreak}`} />
        <StatCard label="Best streak" value={String(stats.longestStreak)} />
        <StatCard label="Played" value={String(stats.gamesPlayed)} />
      </div>

      <div className="rounded-2xl border-2 border-yellow-300/40 bg-purple-900/60 p-4 text-center">
        <p className="font-sans text-xs tracking-wide text-yellow-100/60 uppercase">Average score</p>
        <p className="mt-1 font-display text-2xl text-yellow-300">
          {Math.round(stats.averageScore).toLocaleString("en-GB")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-sm tracking-wide text-yellow-100/60 uppercase">History</p>
        {history.length === 0 ? (
          <p className="rounded-2xl border-2 border-yellow-300/20 bg-purple-900/40 p-4 text-center font-sans text-yellow-100/60">
            No plays recorded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((item) => (
              <li
                key={item.episodeNumber}
                className="flex items-center justify-between rounded-xl border border-yellow-300/20 bg-purple-900/50 px-4 py-2"
              >
                <div>
                  <p className="font-sans text-yellow-50">Link #{item.episodeNumber}</p>
                  <p className="font-sans text-xs text-yellow-100/60">{item.playedDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-yellow-300">{item.totalScore.toLocaleString("en-GB")}</p>
                  <p className="font-sans text-xs text-yellow-100/60">
                    {item.guessedCorrectly ? "Guessed" : "Missed"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={signOutAction} className="flex justify-center">
        <button
          type="submit"
          className="rounded-full border-2 border-yellow-300/40 px-6 py-3 font-sans text-yellow-100/80"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-yellow-300/40 bg-purple-900/60 p-3 text-center">
      <p className="font-display text-xl text-yellow-300">{value}</p>
      <p className="font-sans text-xs text-yellow-100/60">{label}</p>
    </div>
  );
}
