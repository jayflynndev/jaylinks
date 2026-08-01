import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PuzzleStatus } from "@/lib/supabase/types";

export interface NewPuzzleClue {
  position: number;
  clueText: string;
}

export interface NewPuzzleInput {
  episodeNumber: number;
  publishDate: string | null;
  status: PuzzleStatus;
  title: string;
  linkAnswer: string;
  linkAlternatives: string[];
  clues: NewPuzzleClue[];
}

export type InsertPuzzleResult = { id: string } | { error: string };

/**
 * Inserts a brand-new puzzle plus its 5 clues. Shared by the bulk
 * importer (src/app/admin/(protected)/puzzles/import/actions.ts) — the
 * single-puzzle editor's create path (puzzles/actions.ts) has its own
 * inline insert since it's interleaved with update logic for the same
 * form, but both hit the same table shapes.
 */
export async function insertPuzzle(
  categoryId: string,
  input: NewPuzzleInput
): Promise<InsertPuzzleResult> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("JL_puzzles")
    .insert({
      category_id: categoryId,
      episode_number: input.episodeNumber,
      publish_date: input.publishDate,
      status: input.status,
      title: input.title,
      link_answer: input.linkAnswer,
      link_alternatives: input.linkAlternatives,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: `Episode ${input.episodeNumber} (or its publish date) already exists.` };
    }
    return { error: error?.message ?? "Insert failed." };
  }

  const { error: cluesError } = await supabase.from("JL_clues").insert(
    input.clues.map((c) => ({
      puzzle_id: data.id,
      position: c.position,
      clue_text: c.clueText,
    }))
  );

  if (cluesError) {
    return { error: `Puzzle created but its clues failed to save: ${cluesError.message}` };
  }

  return { id: data.id };
}
