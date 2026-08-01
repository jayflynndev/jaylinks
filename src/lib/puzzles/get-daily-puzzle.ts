import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { londonDateString } from "@/lib/time/london";

/**
 * A clue as sent to the browser — just its text and reveal position. Clue
 * text itself was never secret (it's shown to every player as the round
 * plays out — see docs/ANSWER_ENGINE.md's security note), so all 5 are
 * included upfront; the client's own timer controls when each becomes
 * visible. Only the puzzle's link answer/alternatives are ever withheld.
 */
export interface PublicClue {
  id: string;
  position: number;
  clueText: string;
}

/**
 * The shape of a puzzle ever sent to the browser before it's complete — no
 * `linkAnswer`, no `linkAlternatives`. Those are only revealed via
 * /api/check-link (on a correct guess) or an explicit end-of-round reveal
 * once the round times out unguessed.
 */
export interface PublicPuzzle {
  id: string;
  episodeNumber: number;
  title: string;
  clues: PublicClue[];
}

/** Fetches and link-strips a puzzle's clues, given its row is already known to exist. */
async function buildPublicPuzzle(puzzle: {
  id: string;
  episode_number: number;
  title: string;
}): Promise<PublicPuzzle> {
  const supabase = createServiceRoleClient();
  const { data: clues } = await supabase
    .from("JL_clues")
    .select("id, position, clue_text")
    .eq("puzzle_id", puzzle.id)
    .order("position", { ascending: true });

  return {
    id: puzzle.id,
    episodeNumber: puzzle.episode_number,
    title: puzzle.title,
    clues: (clues ?? []).map((c) => ({
      id: c.id,
      position: c.position,
      clueText: c.clue_text,
    })),
  };
}

/**
 * Fetches "today's puzzle" — the Daily-category puzzle with the latest
 * publish_date that is on or before today's Europe/London calendar date —
 * and strips it down to what's safe to send to the client. Returns null if
 * no puzzle has unlocked yet (e.g. the Daily category is empty, or every
 * puzzle is still in the future).
 *
 * Deliberately not filtered to `status = 'published'` only: a puzzle
 * that's merely 'scheduled' but whose publish_date has already passed
 * still counts as unlocked (an admin oversight in leaving it as
 * 'scheduled' shouldn't hide the day's puzzle from players). Only
 * 'draft' puzzles are excluded, regardless of date.
 */
export async function getTodaysPuzzle(now: Date = new Date()): Promise<PublicPuzzle | null> {
  const supabase = createServiceRoleClient();
  const today = londonDateString(now);

  const { data: category } = await supabase
    .from("JL_categories")
    .select("id")
    .eq("slug", "daily")
    .maybeSingle();

  if (!category) return null;

  const { data: puzzle } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title")
    .eq("category_id", category.id)
    .in("status", ["scheduled", "published"])
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!puzzle) return null;

  return buildPublicPuzzle(puzzle);
}

/**
 * Fetches any puzzle by id, link-stripped, regardless of status or
 * publish_date — including drafts and puzzles scheduled for the future.
 *
 * **Admin preview only.** Unlike getTodaysPuzzle, this has no unlock
 * gating at all, so it must never be reachable from a public route — only
 * from pages behind the /admin auth guard (src/proxy.ts + the
 * (protected) layout).
 */
export async function getPuzzleByIdForPreview(id: string): Promise<PublicPuzzle | null> {
  const supabase = createServiceRoleClient();

  const { data: puzzle } = await supabase
    .from("JL_puzzles")
    .select("id, episode_number, title")
    .eq("id", id)
    .maybeSingle();

  if (!puzzle) return null;

  return buildPublicPuzzle(puzzle);
}
