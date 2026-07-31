import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { londonDateString } from "@/lib/time/london";

/**
 * The shape of a question ever sent to the browser — no `answer`, no
 * `alternatives`. See docs/ANSWER_ENGINE.md's security note: adjudication
 * happens entirely server-side via /api/check-answer, so this is the only
 * question data that should ever leave the server.
 */
export interface PublicQuestion {
  id: string;
  position: number;
  questionText: string;
}

/**
 * The shape of a puzzle ever sent to the browser before it's complete — no
 * `linkAnswer`, no `linkAlternatives`. Those are only revealed via
 * /api/check-link (on a correct guess) or an explicit end-of-puzzle reveal
 * once all 5 questions are done.
 */
export interface PublicPuzzle {
  id: string;
  episodeNumber: number;
  title: string;
  questions: PublicQuestion[];
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
    .from("categories")
    .select("id")
    .eq("slug", "daily")
    .maybeSingle();

  if (!category) return null;

  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("id, episode_number, title")
    .eq("category_id", category.id)
    .in("status", ["scheduled", "published"])
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!puzzle) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, position, question_text")
    .eq("puzzle_id", puzzle.id)
    .order("position", { ascending: true });

  return {
    id: puzzle.id,
    episodeNumber: puzzle.episode_number,
    title: puzzle.title,
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      position: q.position,
      questionText: q.question_text,
    })),
  };
}
