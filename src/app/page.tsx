import Link from "next/link";
import { QuestionMarks } from "@/components/brand/QuestionMarks";
import { TitlePanel } from "@/components/brand/TitlePanel";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { getTodaysPuzzle } from "@/lib/puzzles/get-daily-puzzle";
import { getCurrentPlayerId } from "@/lib/supabase/player-auth";

// "Today's puzzle" changes daily and depends on live DB state — without
// this, Next.js statically prerenders the page once at build time and
// would keep serving that stale snapshot in production forever.
export const dynamic = "force-dynamic";

/**
 * Home screen: the brand title panel and the "Play Link #N" CTA. Fetches
 * today's puzzle server-side just to know its episode number for the
 * button label — no answers ever touch this page. If Supabase isn't
 * configured yet (e.g. local dev before .env.local is filled in) or no
 * puzzle has unlocked, falls back to a friendly "check back soon" state
 * rather than crashing the page.
 */
export default async function Home() {
  let episodeNumber: number | null = null;
  try {
    const puzzle = await getTodaysPuzzle();
    episodeNumber = puzzle?.episodeNumber ?? null;
  } catch {
    episodeNumber = null;
  }
  const currentUserId = await getCurrentPlayerId();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* SEO: describes the product to search engines — the home page is
          the canonical representative page, so this isn't repeated on
          every route. Never includes anything puzzle-specific (the link
          answer is never in any page's content — see docs/ANSWER_ENGINE.md). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Jay's Links",
            url: "https://jayslinks.com",
            description: "A daily chain-quiz game — guess the link before it's revealed.",
            applicationCategory: "GameApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
          }),
        }}
      />
      <QuestionMarks />

      <TitlePanel subtitle={episodeNumber ? `Link #${episodeNumber}` : undefined} />

      <div className="relative mt-10 flex flex-col items-center gap-4">
        <HowToPlayModal />
        {episodeNumber ? (
          <Link
            href="/play"
            className="rounded-full bg-yellow-300 px-10 py-4 text-center font-display text-2xl tracking-wide text-purple-950 shadow-[0_6px_0_rgba(146,64,14,0.5)] transition active:translate-y-1 active:shadow-[0_2px_0_rgba(146,64,14,0.5)] sm:text-3xl"
          >
            Play Link #{episodeNumber}
          </Link>
        ) : (
          <p className="max-w-xs text-center font-sans text-lg text-yellow-100/80">
            No puzzle is live yet — check back soon!
          </p>
        )}
        <Link href="/account" className="font-sans text-sm text-yellow-100/70 underline">
          {currentUserId ? "My account" : "Sign in to save progress"}
        </Link>
      </div>
    </div>
  );
}
