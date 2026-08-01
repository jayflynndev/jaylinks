import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/answer-engine/normalize";
import type { PuzzleStatus } from "@/lib/supabase/types";

export interface PuzzleListItem {
  id: string;
  episodeNumber: number;
  title: string;
  publishDate: string | null;
  status: PuzzleStatus;
}

/**
 * The Daily category's id, or null if the seed migration hasn't been run
 * yet (see supabase/migrations/20260731000002_seed_sample_puzzles.sql) —
 * callers treat that as "no puzzles exist yet" rather than erroring.
 */
async function getDailyCategoryId(): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("JL_categories").select("id").eq("slug", "daily").maybeSingle();
  return data?.id ?? null;
}

/** All Daily-category puzzles, ordered by publish date (undated ones last) — powers the admin dashboard list. */
export async function listDailyPuzzles(): Promise<PuzzleListItem[]> {
  const categoryId = await getDailyCategoryId();
  if (!categoryId) return [];

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title, publish_date, status")
    .eq("category_id", categoryId)
    .order("publish_date", { ascending: true, nullsFirst: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    episodeNumber: p.episode_number,
    title: p.title,
    publishDate: p.publish_date,
    status: p.status,
  }));
}

/** One past the highest existing Daily episode number — the puzzle editor's auto-incremented default. */
export async function getNextEpisodeNumber(): Promise<number> {
  const categoryId = await getDailyCategoryId();
  if (!categoryId) return 1;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_puzzles")
    .select("episode_number")
    .eq("category_id", categoryId)
    .order("episode_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.episode_number ?? 0) + 1;
}

export interface EditableClue {
  id: string;
  position: number;
  clueText: string;
}

export interface EditablePuzzle {
  id: string;
  episodeNumber: number;
  title: string;
  publishDate: string | null;
  status: PuzzleStatus;
  linkAnswer: string;
  linkAlternatives: string[];
  clues: EditableClue[];
}

/**
 * Fetches a puzzle for the admin editor — including its link answer,
 * which the player-facing src/lib/puzzles/get-daily-puzzle.ts deliberately
 * strips. Never expose this data to a non-admin route.
 */
export async function getPuzzleForEdit(id: string): Promise<EditablePuzzle | null> {
  const supabase = createServiceRoleClient();

  const { data: puzzle } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title, publish_date, status, link_answer, link_alternatives")
    .eq("id", id)
    .maybeSingle();
  if (!puzzle) return null;

  const { data: clues } = await supabase
    .from("JL_clues")
    .select("id, position, clue_text")
    .eq("puzzle_id", id)
    .order("position", { ascending: true });

  return {
    id: puzzle.id,
    episodeNumber: puzzle.episode_number,
    title: puzzle.title,
    publishDate: puzzle.publish_date,
    status: puzzle.status,
    linkAnswer: puzzle.link_answer,
    linkAlternatives: puzzle.link_alternatives,
    clues: (clues ?? []).map((c) => ({
      id: c.id,
      position: c.position,
      clueText: c.clue_text,
    })),
  };
}

export interface DuplicateCandidate {
  text: string;
}

export interface DuplicateAnswerMatch extends DuplicateCandidate {
  matchedEpisodeNumber: number;
  matchedPuzzleTitle: string;
}

/**
 * Checks candidate link answers against every link answer already used
 * across *all* puzzles (any category), using the same normalisation as
 * the Tier 1 fuzzy matcher (src/lib/answer-engine/normalize.ts) so e.g.
 * "Sean Connery" and "sean connery" would be recognised as the same
 * answer. **Link answers only** — clue words (e.g. "Fleet", "Baker") are
 * expected to repeat across puzzles constantly (they're common words, not
 * unique answers) and deliberately aren't checked here.
 *
 * This is a *warning*, not a block — the brief asks to flag possible
 * repeats, not prevent them. Rows belonging to `excludePuzzleId` are
 * skipped so editing a puzzle doesn't flag itself.
 */
export async function findDuplicateAnswers(
  candidates: DuplicateCandidate[],
  excludePuzzleId?: string
): Promise<DuplicateAnswerMatch[]> {
  const supabase = createServiceRoleClient();

  const { data: puzzleRows } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title, link_answer");

  const existingByNormalized = new Map<string, { episodeNumber: number; puzzleTitle: string }>();
  for (const puzzle of puzzleRows ?? []) {
    if (puzzle.id === excludePuzzleId) continue;
    existingByNormalized.set(normalizeAnswer(puzzle.link_answer), {
      episodeNumber: puzzle.episode_number,
      puzzleTitle: puzzle.title,
    });
  }

  const matches: DuplicateAnswerMatch[] = [];
  for (const candidate of candidates) {
    const existing = existingByNormalized.get(normalizeAnswer(candidate.text));
    if (existing) {
      matches.push({
        ...candidate,
        matchedEpisodeNumber: existing.episodeNumber,
        matchedPuzzleTitle: existing.puzzleTitle,
      });
    }
  }

  return matches;
}
