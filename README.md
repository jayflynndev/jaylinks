# Jay's Links

A daily chain-quiz web app (Wordle-style habit game), adapted from Jay's
YouTube Shorts / FB Reels quiz format. Every day there's one puzzle: five
questions whose answers all share a hidden "link" — guess the link early for
the biggest score.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres + auth) for puzzle data and the
  admin screen
- PWA (installable, offline app shell)
- Deployed on [Vercel](https://vercel.com)

See [`CLAUDE.md`](CLAUDE.md) for the full architecture/conventions reference.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase and
   Anthropic API keys. See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)
   for a beginner-friendly walkthrough of creating the Supabase project and
   running the SQL migrations.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm start` — run a production build
- `npm run lint` — lint
- `npm test` — unit tests (fuzzy matcher, scoring, etc.)

## Docs

- [`docs/ANSWER_ENGINE.md`](docs/ANSWER_ENGINE.md) — how player/link answers
  get adjudicated (fuzzy match → AI judge → learned cache + review queue)
- [`docs/ADDING_PUZZLES.md`](docs/ADDING_PUZZLES.md) — how Jay adds daily
  puzzles via the admin screen
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — step-by-step Supabase
  project setup
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploying to Vercel

## Project status

Early build — see `CLAUDE.md` "Status" section and git log for what's done.
