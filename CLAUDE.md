@AGENTS.md

# Jay's Links — CLAUDE.md

Daily chain-quiz web app (Wordle-style habit game), adapted from Jay's YouTube
Shorts / FB Reels quiz format. Full product brief lives in the original build
request; this file is the living reference for stack, conventions, and where
things live. Keep it updated whenever architecture or conventions change.

## What the app is

One puzzle per day, same for every player. A puzzle has 5 questions whose
answers share a hidden "link" (e.g. Ode/Elegy/Haiku/Sonnet/Limerick → "Types of
Poem"). Players answer questions against a draining points meter, can guess
the link early for a bonus, then get a results/share screen. See
`docs/ANSWER_ENGINE.md` for the answer-adjudication design and
`docs/ADDING_PUZZLES.md` for how puzzles get authored.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.** This Next.js
  version has real breaking changes vs older training data — `params` and
  `searchParams` in pages/route handlers are `Promise`s that must be awaited,
  `middleware.ts` is renamed `proxy.ts`, config shape changed. See `AGENTS.md`
  and `node_modules/next/dist/docs/` before assuming older Next.js behavior.
- **Supabase** (free tier) — Postgres database + admin auth. Jay owns the
  Supabase project and pastes keys into `.env.local`; we generate SQL
  migrations under `supabase/migrations/` for him to run in the SQL editor.
  Setup walkthrough: `docs/SUPABASE_SETUP.md`.
- **PWA** — installable, app-shell cached; today's puzzle is always
  server-fetched (never shipped in the client bundle) so answers can't be
  read from dev tools.
- **Deployment** target: Vercel free tier. See `docs/DEPLOYMENT.md`.

## Where things live

```
src/
  app/                  routes (App Router)
    api/                server-only route handlers (answer checking, admin)
    admin/               admin screen (Supabase-authed)
    play/                player game loop
  lib/
    answer-engine/       Tier 1 fuzzy match, Tier 2 AI judge, Tier 3 cache/review
    scoring/             meter/points/link-bonus math (pure functions, unit tested)
    time/                Europe/London "what day is it" utilities (see below)
    storage/             player-state persistence interface (localStorage now,
                          swappable for Supabase-backed accounts later)
    supabase/            Supabase client setup (server + browser variants)
  components/           UI components
supabase/
  migrations/            SQL migration files (Jay runs these by hand)
docs/
  ANSWER_ENGINE.md        three-tier answer adjudication design
  ADDING_PUZZLES.md       how Jay adds daily puzzles via the admin screen
  SUPABASE_SETUP.md        step-by-step Supabase project setup for a beginner
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
- **Answers never reach the client early.** Puzzle data sent to the browser
  omits canonical answers/alternatives; adjudication happens server-side via
  `/api/check-answer` and `/api/check-link`.
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

See the end of each milestone's chat summary for current state. As of the
last update: project scaffolded, DB schema written (`supabase/migrations/`,
not yet applied by Jay), Supabase server/browser clients and the
Europe/London time utility in place. Answer engine Tier 1 (fuzzy match) is
implemented and unit tested (`npm test`); Tiers 2 (AI judge) and 3
(caching/review queue) are designed in `docs/ANSWER_ENGINE.md` but not yet
built. Game UI not yet started.
