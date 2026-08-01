import { notFound } from "next/navigation";
import { GameLoop } from "@/components/game/GameLoop";
import { getPuzzleByIdForPreview } from "@/lib/puzzles/get-daily-puzzle";

export const dynamic = "force-dynamic";

/**
 * Plays a puzzle exactly as a player would (real /api/check-link
 * adjudication — same PuzzleRound/LinkGuessPanel/ResultsScreen as the
 * real /play route) without needing it published or unlocked, and
 * without it ever touching real player stats — see GameLoop's
 * `mode="preview"`.
 */
export default async function PuzzlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const puzzle = await getPuzzleByIdForPreview(id);
  if (!puzzle) notFound();

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="rounded-full border-2 border-yellow-300/50 bg-purple-900/60 px-4 py-1 font-sans text-sm text-yellow-200">
        Preview mode — nothing here is saved
      </p>
      <GameLoop puzzle={puzzle} mode="preview" />
    </div>
  );
}
