import Link from "next/link";
import {
  getAnswerCheckingStats,
  getContentHealthStats,
  getPlayerEngagementStats,
} from "@/lib/admin/dashboard-stats";

/**
 * Admin landing page: an at-a-glance overview, not a management screen —
 * content health, player engagement, and answer-checking, so there's no
 * need to click into Puzzles or Review Queue speculatively just to see if
 * anything needs attention.
 */
export default async function AdminDashboardPage() {
  const [content, engagement, answers] = await Promise.all([
    getContentHealthStats(),
    getPlayerEngagementStats(),
    getAnswerCheckingStats(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-wide text-yellow-300">Content health</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Draft" value={content.draftCount} />
          <StatCard label="Scheduled" value={content.scheduledCount} />
          <StatCard label="Published" value={content.publishedCount} />
          <StatCard label="Total puzzles" value={content.totalCount} />
        </div>
        <p className="font-sans text-sm text-yellow-100/60">
          {content.lastScheduledDate
            ? `Scheduled through ${content.lastScheduledDate}.`
            : "Nothing scheduled yet."}{" "}
          <Link href="/admin/puzzles" className="underline">
            View puzzle library
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-wide text-yellow-300">Player engagement</h2>
        <p className="font-sans text-sm text-yellow-100/60">
          Signed-in players only — anonymous play (the default) never touches the server, so this is
          a slice of engaged players, not total traffic. See Vercel Analytics for the fuller picture.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Plays today" value={engagement.playsToday} />
          <StatCard label="Plays this week" value={engagement.playsThisWeek} />
          <StatCard label="Total plays" value={engagement.totalPlays} />
          <StatCard label="Signed-in players" value={engagement.uniquePlayers} />
          <StatCard label="Average score" value={Math.round(engagement.averageScore).toLocaleString("en-GB")} />
          <StatCard label="Guessed correctly" value={formatPercent(engagement.correctGuessRate)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-wide text-yellow-300">Answer checking</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/admin/review" className="block">
            <StatCard
              label="Pending review"
              value={answers.pendingReviewCount}
              highlight={answers.pendingReviewCount > 0}
            />
          </Link>
          <StatCard label="AI calls today" value={answers.judgeCallsToday} />
          <StatCard label="Total judged" value={answers.totalJudged} />
          <StatCard
            label="Approval rate"
            value={answers.approvalRate === null ? "—" : formatPercent(answers.approvalRate)}
          />
        </div>
      </section>
    </div>
  );
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 text-center transition ${
        highlight
          ? "border-yellow-300 bg-yellow-300/10 hover:border-yellow-200"
          : "border-yellow-300/20 bg-purple-900/50"
      }`}
    >
      <p className="font-display text-2xl text-yellow-300">{value}</p>
      <p className="font-sans text-xs text-yellow-100/60">{label}</p>
    </div>
  );
}
