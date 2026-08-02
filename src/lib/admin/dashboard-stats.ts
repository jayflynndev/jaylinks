import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDailyCategoryId } from "@/lib/puzzles/admin-queries";
import { countJudgeCallsToday } from "@/lib/puzzles/review-queue";
import { daysBetweenDateStrings } from "@/lib/time/date-math";
import { londonDateString } from "@/lib/time/london";

/**
 * Everything the admin Dashboard (src/app/admin/(protected)/page.tsx) needs
 * at a glance — content health, player engagement, and answer-checking —
 * so Jay isn't clicking into Review Queue or the puzzle list speculatively
 * just to see if anything needs attention.
 */

export interface ContentHealthStats {
  draftCount: number;
  scheduledCount: number;
  publishedCount: number;
  totalCount: number;
  /** The furthest-out publish_date currently scheduled/published, or null if none — "you have content through here." */
  lastScheduledDate: string | null;
}

export async function getContentHealthStats(): Promise<ContentHealthStats> {
  const categoryId = await getDailyCategoryId();
  if (!categoryId) {
    return { draftCount: 0, scheduledCount: 0, publishedCount: 0, totalCount: 0, lastScheduledDate: null };
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_puzzles")
    .select("status, publish_date")
    .eq("category_id", categoryId);

  const rows = data ?? [];
  const dates = rows.map((r) => r.publish_date).filter((d): d is string => d !== null);

  return {
    draftCount: rows.filter((r) => r.status === "draft").length,
    scheduledCount: rows.filter((r) => r.status === "scheduled").length,
    publishedCount: rows.filter((r) => r.status === "published").length,
    totalCount: rows.length,
    lastScheduledDate: dates.length > 0 ? dates.sort().at(-1)! : null,
  };
}

export interface PlayerEngagementStats {
  playsToday: number;
  playsThisWeek: number;
  totalPlays: number;
  /** Distinct signed-in players who've played at least once. */
  uniquePlayers: number;
  averageScore: number;
  /** 0-1. */
  correctGuessRate: number;
}

/**
 * Derived entirely from `JL_play_history`, which only ever gets a row once
 * a *signed-in* player finishes a real round — anonymous play (the default,
 * zero-friction way to play) never touches the server at all, so these
 * numbers are a slice of engaged/signed-in players, not total traffic.
 * Vercel Analytics is the fuller picture of overall visits; this is the
 * fuller picture of what signed-in players actually do.
 */
export async function getPlayerEngagementStats(): Promise<PlayerEngagementStats> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("JL_play_history")
    .select("user_id, played_date, total_score, guessed_correctly");

  const rows = data ?? [];
  const today = londonDateString();
  const totalPlays = rows.length;

  return {
    playsToday: rows.filter((r) => r.played_date === today).length,
    // Trailing 7-day window (today + 6 prior days), matching daysBetweenDateStrings's "to minus from" convention.
    playsThisWeek: rows.filter((r) => daysBetweenDateStrings(r.played_date, today) < 7).length,
    totalPlays,
    uniquePlayers: new Set(rows.map((r) => r.user_id)).size,
    averageScore: totalPlays > 0 ? rows.reduce((sum, r) => sum + r.total_score, 0) / totalPlays : 0,
    correctGuessRate: totalPlays > 0 ? rows.filter((r) => r.guessed_correctly).length / totalPlays : 0,
  };
}

export interface AnswerCheckingStats {
  pendingReviewCount: number;
  judgeCallsToday: number;
  totalJudged: number;
  /** approved / (approved + rejected) among items Jay has actually reviewed, or null if nothing's been reviewed yet. A rough signal of how often Tier 2 gets it right. */
  approvalRate: number | null;
}

export async function getAnswerCheckingStats(): Promise<AnswerCheckingStats> {
  const supabase = createServiceRoleClient();

  const [pendingResult, judgeCallsToday, totalResult, reviewedResult] = await Promise.all([
    supabase.from("JL_judged_answers").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    countJudgeCallsToday(),
    supabase.from("JL_judged_answers").select("id", { count: "exact", head: true }),
    supabase.from("JL_judged_answers").select("review_status").in("review_status", ["approved", "rejected"]),
  ]);

  const reviewedRows = reviewedResult.data ?? [];
  const approvedCount = reviewedRows.filter((r) => r.review_status === "approved").length;

  return {
    pendingReviewCount: pendingResult.count ?? 0,
    judgeCallsToday,
    totalJudged: totalResult.count ?? 0,
    approvalRate: reviewedRows.length > 0 ? approvedCount / reviewedRows.length : null,
  };
}
