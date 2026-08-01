import { PuzzleForm } from "@/components/admin/PuzzleForm";
import { getNextEpisodeNumber } from "@/lib/puzzles/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewPuzzlePage() {
  const nextEpisodeNumber = await getNextEpisodeNumber();

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl text-yellow-300">New puzzle</h2>
      <PuzzleForm defaultEpisodeNumber={nextEpisodeNumber} />
    </div>
  );
}
