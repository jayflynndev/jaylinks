import Link from "next/link";
import { listDailyPuzzles } from "@/lib/puzzles/admin-queries";
import { findScheduleGaps } from "@/lib/puzzles/schedule-gaps";
import type { PuzzleStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<PuzzleStatus, string> = {
  draft: "bg-purple-800/60 text-yellow-100/70",
  scheduled: "bg-yellow-300/20 text-yellow-200",
  published: "bg-emerald-500/20 text-emerald-300",
};

/** Admin dashboard: the Daily puzzle list plus schedule-gap warnings. */
export default async function AdminDashboardPage() {
  const puzzles = await listDailyPuzzles();
  const datedPublishDates = puzzles
    .map((p) => p.publishDate)
    .filter((date): date is string => date !== null);
  const gaps = findScheduleGaps(datedPublishDates);

  return (
    <div className="flex flex-col gap-6">
      {gaps.length > 0 && (
        <div className="rounded-2xl border-2 border-red-400/50 bg-red-950/30 p-4">
          <p className="font-display text-lg text-red-300">Schedule gaps</p>
          <ul className="mt-2 flex flex-col gap-1 font-sans text-sm text-red-200">
            {gaps.map((gap, index) => (
              <li key={index}>
                {gap.missingDays} day{gap.missingDays === 1 ? "" : "s"} unscheduled between{" "}
                {gap.afterDate} and {gap.beforeDate}
              </li>
            ))}
          </ul>
        </div>
      )}

      {puzzles.length === 0 ? (
        <div className="rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-6 text-center">
          <p className="font-sans text-yellow-100/80">
            No puzzles yet. Run the seed migration (see docs/SUPABASE_SETUP.md) or create one below.
          </p>
          <Link
            href="/admin/puzzles/new"
            className="mt-4 inline-block rounded-full bg-yellow-300 px-6 py-3 font-display tracking-wide text-purple-950"
          >
            New puzzle
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {puzzles.map((puzzle) => (
            <li key={puzzle.id}>
              <Link
                href={`/admin/puzzles/${puzzle.id}/edit`}
                className="flex items-center justify-between gap-4 rounded-xl border border-yellow-300/20 bg-purple-900/50 px-4 py-3 transition hover:border-yellow-300/50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg text-yellow-300">#{puzzle.episodeNumber}</span>
                  <div>
                    <p className="font-sans text-yellow-50">{puzzle.title}</p>
                    <p className="font-sans text-xs text-yellow-100/60">
                      {puzzle.publishDate ?? "Undated"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-sans text-xs uppercase tracking-wide ${STATUS_STYLES[puzzle.status]}`}
                >
                  {puzzle.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
