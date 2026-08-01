"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/admin-check";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { findDuplicateAnswers, type DuplicateAnswerMatch } from "@/lib/puzzles/admin-queries";
import type { PuzzleStatus } from "@/lib/supabase/types";

export interface PuzzleFormState {
  error?: string;
  duplicateWarnings?: DuplicateAnswerMatch[];
  savedPuzzleId?: string;
  savedEpisodeNumber?: number;
}

const VALID_STATUSES: PuzzleStatus[] = ["draft", "scheduled", "published"];

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function getDailyCategoryId(): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("JL_categories").select("id").eq("slug", "daily").maybeSingle();
  if (!data) {
    throw new Error(
      "Daily category not found — run the seed migration first (see docs/SUPABASE_SETUP.md)."
    );
  }
  return data.id;
}

function describeDbError(error: PostgrestError | null): string {
  if (error?.code === "23505") {
    return "That episode number or publish date is already used by another puzzle.";
  }
  return error?.message ?? "Something went wrong saving the puzzle.";
}

/**
 * Creates or updates a puzzle (create when the hidden `puzzleId` field is
 * empty). Validates required fields, upserts the 5 clues by
 * (puzzle_id, position), and — on success — runs the duplicate-answer
 * checker (link answers only — clue words are expected to repeat across
 * puzzles constantly, e.g. common words like "Fleet") and returns any
 * matches as a non-blocking warning.
 */
export async function savePuzzle(
  _prevState: PuzzleFormState,
  formData: FormData
): Promise<PuzzleFormState> {
  await requireAdmin();

  const puzzleId = formValue(formData, "puzzleId") || null;
  const episodeNumber = Number(formValue(formData, "episodeNumber"));
  const publishDate = formValue(formData, "publishDate");
  const status = formValue(formData, "status");
  const title = formValue(formData, "title");
  const linkAnswer = formValue(formData, "linkAnswer");
  const linkAlternatives = formValue(formData, "linkAlternatives")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (!title) return { error: "Title is required." };
  if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
    return { error: "Episode number must be a positive whole number." };
  }
  if (!linkAnswer) return { error: "Link answer is required." };
  if (!VALID_STATUSES.includes(status as PuzzleStatus)) {
    return { error: "Invalid status." };
  }
  if (status !== "draft" && !publishDate) {
    return { error: "A publish date is required for scheduled/published puzzles." };
  }

  const clues: { position: number; clueText: string }[] = [];
  for (let position = 1; position <= 5; position++) {
    const clueText = formValue(formData, `clue${position}`);
    if (!clueText) {
      return { error: `Clue ${position} is required.` };
    }
    clues.push({ position, clueText });
  }

  const supabase = createServiceRoleClient();
  const categoryId = await getDailyCategoryId();

  const puzzleRow = {
    category_id: categoryId,
    episode_number: episodeNumber,
    publish_date: publishDate || null,
    status: status as PuzzleStatus,
    title,
    link_answer: linkAnswer,
    link_alternatives: linkAlternatives,
  };

  let savedId = puzzleId;

  if (puzzleId) {
    const { error } = await supabase.from("JL_puzzles").update(puzzleRow).eq("id", puzzleId);
    if (error) return { error: describeDbError(error) };
  } else {
    const { data, error } = await supabase.from("JL_puzzles").insert(puzzleRow).select("id").single();
    if (error || !data) return { error: describeDbError(error) };
    savedId = data.id;
  }

  if (!savedId) {
    // Unreachable in practice (the branches above always set savedId or
    // return early), but narrows the type for the inserts below.
    return { error: "Something went wrong saving the puzzle." };
  }

  for (const clue of clues) {
    const { error } = await supabase.from("JL_clues").upsert(
      {
        puzzle_id: savedId,
        position: clue.position,
        clue_text: clue.clueText,
      },
      { onConflict: "puzzle_id,position" }
    );
    if (error) {
      return { error: `Saved the puzzle, but clue ${clue.position} failed to save: ${error.message}` };
    }
  }

  const duplicateWarnings = await findDuplicateAnswers([{ text: linkAnswer }], savedId);

  return { savedPuzzleId: savedId, savedEpisodeNumber: episodeNumber, duplicateWarnings };
}
