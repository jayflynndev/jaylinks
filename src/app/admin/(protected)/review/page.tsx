import { countJudgeCallsToday, listPendingReviewItems } from "@/lib/puzzles/review-queue";
import { approveAction, dismissAction, rejectAction } from "./actions";

export const dynamic = "force-dynamic";

const VERDICT_STYLES: Record<string, string> = {
  accept: "bg-emerald-500/20 text-emerald-300",
  reject: "bg-red-500/20 text-red-300",
};

/**
 * Milestone 6f: the human side of Tier 3 (docs/ANSWER_ENGINE.md). Every
 * pending row is one AI judge call the admin should sanity-check — an
 * "accept" worth promoting into `link_alternatives`, or a low-confidence
 * "reject" the AI wasn't sure about.
 */
export default async function ReviewQueuePage() {
  const [items, judgeCallsToday] = await Promise.all([listPendingReviewItems(), countJudgeCallsToday()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-4">
        <p className="font-sans text-yellow-100/80">
          AI judge calls today: <span className="font-display text-yellow-300">{judgeCallsToday}</span>
        </p>
        <p className="font-sans text-sm text-yellow-100/60">{items.length} pending</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-6 text-center">
          <p className="font-sans text-yellow-100/80">Nothing to review right now.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-yellow-300/20 bg-purple-900/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm text-yellow-100/60">
                  Link #{item.episodeNumber} — {item.puzzleTitle} (answer:{" "}
                  <span className="text-yellow-100">{item.linkAnswer}</span>)
                </p>
                <span
                  className={`rounded-full px-3 py-1 font-sans text-xs uppercase tracking-wide ${VERDICT_STYLES[item.verdict]}`}
                >
                  AI {item.verdict}ed
                </span>
              </div>

              <p className="font-sans text-lg text-yellow-50">
                &ldquo;{item.rawAnswer}&rdquo;
                {item.timesSeen > 1 && (
                  <span className="ml-2 font-sans text-sm text-yellow-100/60">
                    seen {item.timesSeen} times
                  </span>
                )}
              </p>

              {item.reason && <p className="font-sans text-sm text-yellow-100/60">&ldquo;{item.reason}&rdquo;</p>}
              {item.confidence !== null && (
                <p className="font-sans text-xs text-yellow-100/50">
                  Confidence: {Math.round(item.confidence * 100)}%
                </p>
              )}

              <div className="flex gap-3">
                <form action={approveAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-500/80 px-5 py-2 font-display text-sm tracking-wide text-purple-950"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-red-500/80 px-5 py-2 font-display text-sm tracking-wide text-purple-950"
                  >
                    Reject
                  </button>
                </form>
                <form action={dismissAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full border-2 border-yellow-300/40 px-5 py-2 font-display text-sm tracking-wide text-yellow-100/80"
                  >
                    Dismiss
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
