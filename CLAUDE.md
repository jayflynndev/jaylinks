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
then get a results/share screen. See `docs/ANSWER_ENGINE.md` for the
link-guess adjudication design and `docs/ADDING_PUZZLES.md` for how puzzles
get authored.

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
    api/                server-only route handlers (link-guess checking)
    admin/               admin screen (Supabase-authed, is_admin-gated)
    play/                player game loop
  lib/
    answer-engine/       Tier 1 fuzzy match, Tier 2 AI judge, Tier 3 cache/review
    scoring/             whole-round points-meter math (pure functions, unit tested)
    time/                Europe/London "what day is it" utilities (see below)
    storage/             player-state persistence interface (localStorage now,
                          swappable for Supabase-backed accounts later)
    puzzles/             server-side puzzle queries/writes (admin + player fetch)
    supabase/            Supabase client setup (server + browser variants) +
                          admin-check.ts (profiles.is_admin gate)
  components/           UI components
  hooks/                 shared client hooks (elapsed timer, clue reveal)
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
- **Player persistence** goes through the storage interface in
  `src/lib/storage/` (currently backed by localStorage) — game logic must
  never call `localStorage` directly, so swapping in Supabase-backed accounts
  later doesn't touch game logic.
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
then hands off to `PuzzleRound.tsx`, which owns the round itself: the
shared `useElapsedTimer` meter clock, the independent `useClueReveal` timer,
`ClueList`, and `LinkGuessPanel`). A wrong guess locks the guess button
until the next clue reveals; the meter pauses while the guess form is open
and resumes on a wrong guess. The real results screen
(`ResultsScreen.tsx`) shows the revealed clues, the link (guessed or
revealed), score, streak (skipped for practice plays), a share card via the
Web Share API with a clipboard fallback, and a live "next puzzle unlocks
in…" countdown. Share text generation is a pure, tested function
(`src/lib/sharing/share-card.ts`). Both `/` and `/play` are marked
`export const dynamic = "force-dynamic"` — without this Next would
statically prerender "today's puzzle" once at build time and never refresh
it.

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

98 unit tests pass (`npx vitest run`), `next build` and `eslint` both clean.
Full end-to-end verification (real Supabase + Anthropic keys, headless
visual check of the corrected clue-reveal loop) is still outstanding —
tracked as part of finishing this correction.

**Next up:** milestone 7 — PWA (installable, app-shell cached) and
deployment docs (`docs/DEPLOYMENT.md`, Vercel).

Repo: pushed to `https://github.com/jayflynndev/jaylinks` (remote `origin`,
branch `master`).
