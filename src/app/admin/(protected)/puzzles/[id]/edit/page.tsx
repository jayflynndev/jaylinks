import { notFound } from "next/navigation";
import { PuzzleForm } from "@/components/admin/PuzzleForm";
import { getPuzzleForEdit } from "@/lib/puzzles/admin-queries";

export const dynamic = "force-dynamic";

export default async function EditPuzzlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const puzzle = await getPuzzleForEdit(id);
  if (!puzzle) notFound();

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl text-yellow-300">Edit Link #{puzzle.episodeNumber}</h2>
      <PuzzleForm initialPuzzle={puzzle} />
    </div>
  );
}
