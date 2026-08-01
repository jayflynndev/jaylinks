import Link from "next/link";
import { QuestionMarks } from "@/components/brand/QuestionMarks";
import { GameLoop } from "@/components/game/GameLoop";
import { getTodaysPuzzle } from "@/lib/puzzles/get-daily-puzzle";
import { getCurrentPlayerId } from "@/lib/supabase/player-auth";

// Same reasoning as src/app/page.tsx: today's puzzle changes daily, so this
// route must be server-rendered per-request, never statically prerendered.
export const dynamic = "force-dynamic";

/**
 * The play screen: fetches today's puzzle server-side (answers already
 * stripped by getTodaysPuzzle) and hands it to the client-side GameLoop,
 * which owns all interactive state.
 */
export default async function PlayPage() {
  let puzzle;
  try {
    puzzle = await getTodaysPuzzle();
  } catch {
    puzzle = null;
  }
  const currentUserId = await getCurrentPlayerId();

  if (!puzzle) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
        <QuestionMarks />
        <p className="max-w-xs text-center font-sans text-lg text-yellow-100/80">
          No puzzle is live yet — check back soon!
        </p>
        <Link
          href="/"
          className="mt-5 rounded-full border-2 border-yellow-300/50 px-6 py-3 font-sans text-yellow-100"
        >
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-4 py-8 sm:py-12">
      <QuestionMarks />
      <h1 className="mb-6 font-display text-2xl tracking-wide text-yellow-300 sm:text-3xl">
        Link #{puzzle.episodeNumber}
      </h1>
      <GameLoop puzzle={puzzle} currentUserId={currentUserId} />
    </div>
  );
}
