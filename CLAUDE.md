@AGENTS.md

# Jay's Links — CLAUDE.md

Daily chain-quiz web app (Wordle-style habit game), adapted from Jay's YouTube
Shorts / FB Reels quiz format. Full product brief lives in the original build
request; this file is the living reference for stack, conventions, and where
things live. Keep it updated whenever architecture or conventions change.

## What the app is

One puzzle per day, same for every player. A puzzle has 5 clue words/phrases
that auto-reveal one at a time, 5 seconds apart, all sharing a hidden "link"
(e.g. Sesame/Quality/Baker/Coronation/Fleet → "Streets"). There is no
per-clue answering — clues just appear on a timer. The only interactive,
scored action is guessing the link, which a player can attempt at any point
after the first clue appears, against a continuously draining points meter.
A wrong guess locks the guess button until the next clue reveals. Players
then get a results/share screen. Signing in is fully optional — anonymous
play (localStorage-backed) is the zero-friction default; signing in moves
a device's progress to the account instead, so streak/history carry across
devices. See `docs/ANSWER_ENGINE.md` for the link-guess adjudication design
and `docs/ADDING_PUZZLES.md` for how puzzles get authored.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.** This Next.js
  version has real breaking changes vs older training data — `params` and
  `searchParams` in pages/route handlers are `Promise`s that must be awaited,
  `middleware.ts` is renamed `proxy.ts`, config shape changed. See `AGENTS.md`
  and `node_modules/next/dist/docs/` before assuming older Next.js behavior.
- **Supabase** (free tier) — Postgres database + auth, **the same existing
  project that powers Jay's other site, QuizHub** (shared `auth.users`, so a
  login works on both sites). This app does not get its own Supabase
  project. Every table this app creates is prefixed `"JL_"` (exact case, via
  quoted SQL identifiers) so it's visually distinguishable from QuizHub's
  tables in the Table Editor. Admin auth checks `profiles.is_admin` (a
  column on QuizHub's existing `profiles` table), not just "is signed in" —
  see `src/lib/supabase/admin-check.ts`. Jay pastes keys into `.env.local`;
  we generate SQL migrations under `supabase/migrations/` for him to run in
  the SQL editor. Setup walkthrough: `docs/SUPABASE_SETUP.md`.
- **PWA** — installable, app-shell cached; today's puzzle is always
  server-fetched (never shipped in the client bundle) so the link answer
  can't be read from dev tools.
- **Deployment** target: Vercel free tier. See `docs/DEPLOYMENT.md`.

## Where things live

```
src/
  app/                  routes (App Router)
    actions/            client-callable Server Actions (player-store-actions.ts)
    api/                server-only route handlers (link-guess checking)
    admin/               admin screen (Supabase-authed, is_admin-gated)
    account/             player sign-in/sign-up + profile/history (optional)
    play/                player game loop
  lib/
    answer-engine/       Tier 1 fuzzy match, Tier 2 AI judge, Tier 3 cache/review
    scoring/             whole-round points-meter math (pure functions, unit tested)
    time/                Europe/London "what day is it" utilities (see below)
    storage/             PlayerStore interface — LocalStoragePlayerStore
                          (anonymous, default) and SupabasePlayerStore
                          (signed-in, calls the Server Actions above)
    puzzles/             server-side puzzle queries/writes (admin + player fetch)
    supabase/            Supabase client setup (server + browser variants) +
                          admin-check.ts (profiles.is_admin gate) +
                          player-auth.ts (optional player sign-in check)
  components/           UI components (game/, admin/, player/, brand/)
  hooks/                 shared client hooks (elapsed timer)
supabase/
  migrations/            SQL migration files (Jay runs these by hand, against
                          the existing shared Supabase project)
docs/
  ANSWER_ENGINE.md        three-tier link-guess adjudication design
  ADDING_PUZZLES.md       how Jay adds daily puzzles via the admin screen
  SUPABASE_SETUP.md        step-by-step guide to wiring up the shared project
  DEPLOYMENT.md            Vercel deployment steps
```

## Conventions

- **Every function gets a short comment** explaining what it does and, where
  non-obvious, *why*. Scoring, fuzzy matching, and timezone logic get detailed
  comments — these are the parts most likely to be subtly wrong.
- **Timezone**: all "what day/puzzle is it" logic goes through the dedicated
  utility in `src/lib/time/` — Europe/London is the single source of truth,
  never `new Date()` local-time comparisons. This is non-negotiable per the
  product brief.
- **The link answer never reaches the client early.** Puzzle data sent to
  the browser is just clue text/position — never `link_answer` or
  `link_alternatives`; adjudication happens server-side via
  `/api/check-link`.
- **Every table this app owns is prefixed `"JL_"`** (exact case) since the
  Supabase project is shared with QuizHub. Non-`JL_` tables referenced here
  (currently just `profiles`) belong to QuizHub — read-only from this app's
  perspective except where explicitly noted.
- **Player persistence** goes through the `PlayerStore` interface in
  `src/lib/storage/player-store.ts` — game logic must never call
  `localStorage` directly. `getPlayerStore(currentUserId)` picks
  `LocalStoragePlayerStore` (anonymous, default) or `SupabasePlayerStore`
  (signed in — calls Server Actions in `src/app/actions/player-store-actions.ts`,
  which re-derive the user from the session cookie, never trusting a
  client-supplied id). `currentUserId` is resolved server-side once per
  page (`src/lib/supabase/player-auth.ts`) and threaded down as a prop —
  it's a rendering hint only, never itself a trust boundary. Practice
  plays are never persisted server-side, only locally/ephemerally.
- **Data model is designed for future category packs** (non-daily puzzle
  collections) even though v1 only builds the Daily UI. Don't add
  daily-only assumptions to the schema or shared APIs; extension points are
  commented where they exist.
- Unit tests are required for the fuzzy matcher and scoring — these are the
  heart of the game.
- Commit at every meaningful milestone with clear messages.

## Status

See the end of each milestone's chat summary for current state.

**Mid-build correction:** milestones 1-6 were originally built around a
different game mechanic (5 player-answered trivia questions per puzzle) and
a brand-new Supabase project. Jay caught both issues after reviewing the
project: the real format has no per-clue answering at all (clues just
auto-reveal on a timer; only the link is guessed), and the Supabase project
must be the existing one shared with QuizHub, with every table prefixed
`JL_`. Nothing had been deployed yet, so this was a clean rewrite of the
schema/engine/UI layers rather than a data migration — every item below
reflects the **corrected** architecture, not the original brief.

DB schema (`supabase/migrations/`, not yet applied by Jay against the real
project), Supabase server/browser clients, and the Europe/London time
utility are in place. The full three-tier link-guess answer engine is built
and wired up behind `/api/check-link` (also accepts `{ reveal: true }` to
reveal the link without adjudicating a guess — used on round timeout and
the results screen). The scoring engine is a single whole-round points
meter (`src/lib/scoring/scoring.ts`, `meterValueAtElapsed`/
`isRoundTimedOut`/`revealedClueCount`) rather than per-question scoring.
The localStorage-backed player storage interface (`src/lib/storage/`) and
server-side "today's puzzle" fetching with the link stripped
(`src/lib/puzzles/get-daily-puzzle.ts`) are also built. The brand shell is
in place: Fredoka (body) + Luckiest Guy (display) fonts, the deep-purple
gradient background, the `TitlePanel` gameshow marquee component (bulb-ring
border, all pure CSS — see `.bulb-ring` in globals.css), scattered
`QuestionMarks` motifs, and a home screen with the "Play Link #N" CTA.

The full player game loop is built under `/play`
(`GameLoop.tsx` handles the "already played today → practice mode" gate,
a "3, 2, 1, GO" `Countdown` before the round's clocks start (so nothing
ticks before the player is ready), then hands off to `PuzzleRound.tsx`,
which owns the round itself — the shared `useElapsedTimer` meter clock
also drives clue-reveal count directly (`revealedClueCount(activeElapsedMs)`,
both derived from the same paused-aware value so they can never drift
apart — this replaced an earlier design with two independent clocks that
had a real exploit: opening the guess form froze the meter but not the
clue reveal, letting every clue show for free), `ClueList`, and
`LinkGuessPanel`. A wrong guess locks the guess button until the next
clue reveals; the meter (and clue reveal) pause while the guess form is
open and resume on a wrong guess. The real results screen
(`ResultsScreen.tsx`) shows the revealed clues, the link (guessed or
revealed), score, streak (skipped for practice plays, or replaced with a
"couldn't save" notice if a signed-in player's save failed), a share card
via the Web Share API with a clipboard fallback, a live "next puzzle
unlocks in…" countdown, and a sign-in/account entry point. Share text
generation is a pure, tested function (`src/lib/sharing/share-card.ts`).
A "First time? How to play" button + modal (`HowToPlayModal.tsx`) on the
home screen explains the mechanic in plain language for new visitors.
Both `/` and `/play` are marked `export const dynamic = "force-dynamic"`
— without this Next would statically prerender "today's puzzle" once at
build time and never refresh it.

**Anti-cheat: round starts are recorded, not just round completions.**
A beta tester found that leaving mid-round (back button, closing the tab)
and returning handed out a completely fresh round — nothing was ever
saved until a round naturally finished, so the "one play per day" gate
never triggered. That let a player watch all 5 clues, back out, and come
back with full knowledge of the answer and a full meter. Fixed via
`PlayerStore.getOrStartRound(episodeNumber, puzzleId)`
(`LocalStoragePlayerStore` uses a single localStorage slot;
`SupabasePlayerStore` uses a new `"JL_round_starts"` table, `on conflict
do nothing` so re-opening the app — any device — never resets the
clock, only reads the original start time back). GameLoop calls this
before showing the countdown: a genuinely new round gets the normal
3-2-1-GO; a round already in progress skips the countdown and resumes
`PuzzleRound`'s meter/clue-reveal clocks from real elapsed wall-clock
time via `useElapsedTimer`'s `initialElapsedMs` param — if enough real
time passed, the round is simply already over the instant it mounts,
handled by the exact same timeout logic that already existed, no special
casing needed. The marker is cleared once a round genuinely finishes.

The admin screen (`/admin`, gated on `profiles.is_admin` via
`src/lib/supabase/admin-check.ts` and `src/proxy.ts`, not just "is signed
in" — this Supabase project's `auth.users` is shared with QuizHub) is
built: puzzle create/edit (`PuzzleForm.tsx`, one text input per clue), bulk
import from JSON (`BulkImportForm.tsx`, `src/lib/puzzles/bulk-import.ts`),
a duplicate-answer checker scoped to link answers only (clue words are
expected to repeat across puzzles constantly and aren't flagged), a
preview route that plays a puzzle for real without touching player stats,
and the review queue at `/admin/review`
(`src/lib/puzzles/review-queue.ts`) — approve/reject/dismiss pending
`JL_judged_answers` rows, plus a daily AI-judge-call counter.

**Optional player accounts** are built: sign-in stays fully optional —
anonymous localStorage play is still the zero-friction default. Signing in
(`/account`, `PlayerAuthForm.tsx` — email/password, combined sign-in/
sign-up, same shared `auth.users` table as QuizHub) moves a device's
progress to `"JL_play_history"` instead (one row per real, non-practice
play; practice plays are never persisted server-side). `PlayerStats` is
always derived fresh from the full history table
(`compute-stats-from-history.ts`) rather than cached, which is also what
makes the one-time local→account history merge on first sign-in safe to
call repeatedly/from multiple devices (`AccountDashboard.tsx`'s merge
effect, `mergeLocalHistoryAction` — existing account rows always win, the
upload only fills gaps). `src/proxy.ts` now refreshes the Supabase session
on `/`, `/play`, and `/account` too (not just `/admin`) — required for
signed-in sessions to keep working over time, since Supabase rotates
refresh tokens on each use and only proxy can persist a refreshed cookie
back to the browser.

The site is installable (the PWA half of the original milestone 7):
`src/app/manifest.ts` plus generated icons at `/icon-192` and `/icon-512`
(plain image Route Handlers, `force-static` — not Next's special
`icon.tsx` convention, which is for the browser tab favicon specifically)
make "Add to Home Screen" available, and `src/app/apple-icon.tsx` covers
iOS Safari's separate `apple-touch-icon` preference. All four generated
icon sizes (`icon.tsx`, `icon-192`, `icon-512`, `apple-icon.tsx`) share one
design via `src/lib/brand-icon.tsx` so they read as the same mark at every
size. `public/sw.js` (registered by `RegisterServiceWorker.tsx` in the
root layout) caches only the app *shell* — Next's content-hashed
`/_next/static/` build assets and the generated icons — and deliberately
never intercepts navigations or `/api/`/`/play`/`/account`, since today's
puzzle is never shipped in the client bundle and must always be fetched
fresh; a stale-shell cache must never mean a stale puzzle or stale auth
state.

108 unit tests pass (`npx vitest run`), `next build` and `eslint` both
clean. Deployed and live at jayslinks.com (Vercel, auto-deploys from
`master`) — currently in closed beta with real testers.

**Next up:** deployment docs (`docs/DEPLOYMENT.md`) — the last piece of
the original milestone 7. Otherwise, fold in beta feedback as it comes in.

Repo: pushed to `https://github.com/jayflynndev/jaylinks` (remote `origin`,
branch `master`).
