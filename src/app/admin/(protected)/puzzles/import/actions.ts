"use server";

import { requireAdmin } from "@/lib/supabase/admin-check";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  findDuplicateEpisodeNumbers,
  parseBulkImportPayload,
  type BulkImportPuzzle,
} from "@/lib/puzzles/bulk-import";
import { findDuplicateAnswers, type DuplicateAnswerMatch } from "@/lib/puzzles/admin-queries";
import { insertPuzzle } from "@/lib/puzzles/admin-writes";

export interface BulkImportPreview {
  puzzleCount: number;
  episodeNumbers: number[];
  duplicateEpisodesInPayload: number[];
  existingEpisodeCollisions: number[];
  duplicateAnswers: DuplicateAnswerMatch[];
}

export interface BulkImportResultRow {
  episodeNumber: number;
  ok: boolean;
  message: string;
}

export interface BulkImportState {
  error?: string;
  preview?: BulkImportPreview;
  importResults?: BulkImportResultRow[];
  /** Echoed back so the textarea keeps its content across the preview -> confirm round trip. */
  json?: string;
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

function duplicateAnswerCandidates(puzzles: BulkImportPuzzle[]) {
  return puzzles.map((p) => ({ text: p.linkAnswer }));
}

/**
 * Handles both steps of the bulk-import flow, distinguished by the
 * `intent` field of whichever submit button was clicked ("preview" or
 * "confirm") — see docs/ADDING_PUZZLES.md for the JSON schema and the
 * two-step design ("shows a summary of warnings before you confirm").
 * Re-parses and re-validates on confirm rather than trusting the earlier
 * preview, so the import reflects the database's current state even if
 * something changed between the two steps.
 */
export async function bulkImport(_prevState: BulkImportState, formData: FormData): Promise<BulkImportState> {
  await requireAdmin();

  const intent = formData.get("intent");
  const json = typeof formData.get("json") === "string" ? (formData.get("json") as string) : "";

  const parsed = parseBulkImportPayload(json);
  if (!parsed.ok) {
    return { error: parsed.error, json };
  }

  const categoryId = await getDailyCategoryId();
  const supabase = createServiceRoleClient();

  const { data: existingPuzzles } = await supabase
    .from("JL_puzzles")
    .select("episode_number")
    .eq("category_id", categoryId);
  const existingEpisodeNumbers = new Set((existingPuzzles ?? []).map((p) => p.episode_number));

  const duplicateEpisodesInPayload = findDuplicateEpisodeNumbers(parsed.puzzles);
  const existingEpisodeCollisions = [
    ...new Set(parsed.puzzles.map((p) => p.episodeNumber).filter((n) => existingEpisodeNumbers.has(n))),
  ];

  if (intent !== "confirm") {
    const duplicateAnswers = await findDuplicateAnswers(duplicateAnswerCandidates(parsed.puzzles));

    return {
      json,
      preview: {
        puzzleCount: parsed.puzzles.length,
        episodeNumbers: parsed.puzzles.map((p) => p.episodeNumber),
        duplicateEpisodesInPayload,
        existingEpisodeCollisions,
        duplicateAnswers,
      },
    };
  }

  const results: BulkImportResultRow[] = [];
  for (const puzzle of parsed.puzzles) {
    const result = await insertPuzzle(categoryId, {
      episodeNumber: puzzle.episodeNumber,
      publishDate: puzzle.publishDate,
      status: puzzle.publishDate ? "scheduled" : "draft",
      title: puzzle.title,
      linkAnswer: puzzle.linkAnswer,
      linkAlternatives: puzzle.linkAlternatives,
      clues: puzzle.clues.map((clueText, index) => ({
        position: index + 1,
        clueText,
      })),
    });

    results.push(
      "error" in result
        ? { episodeNumber: puzzle.episodeNumber, ok: false, message: result.error }
        : { episodeNumber: puzzle.episodeNumber, ok: true, message: "Imported." }
    );
  }

  return { importResults: results };
}
