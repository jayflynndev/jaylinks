-- Jay's Links — initial schema
-- Run this in the Supabase SQL editor, against Jay's existing project
-- (shared with QuizHub — see docs/SUPABASE_SETUP.md for the full
-- step-by-step walkthrough). Every table is prefixed "JL_" (exact case,
-- via quoted identifiers) so it's visually distinguishable from QuizHub's
-- tables in the Supabase table list.
--
-- Design notes (see also CLAUDE.md and docs/ANSWER_ENGINE.md):
--   * "Daily" is just the flagship category ("JL_categories".is_daily =
--     true) with date-scheduled puzzles. Future non-daily category packs
--     ("Master Movies" etc.) are other categories with ordered, undated
--     puzzles — "JL_puzzles".publish_date is nullable for exactly this
--     reason. Nothing here assumes daily-only; the player/admin UI for
--     other categories is simply not built in v1.
--   * The game format: a puzzle has 5 "clues" — words/phrases that
--     auto-reveal on a fixed timer, never individually answered — plus a
--     hidden "link" that ties them together (e.g. Sesame/Quality/Baker/
--     Coronation/Fleet → "Streets"). The link answer/alternatives live in
--     this schema but must never be sent to the client before they're
--     needed — enforced in the application layer (server-only Supabase
--     access + API routes that strip the link fields), not by the schema.

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Shared trigger: keep `updated_at` current on every row update.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- A category is a collection of puzzles. The Daily category is the v1
-- flagship; other rows become future non-daily "packs" (archive, themed
-- collections) without any schema change.
create table "JL_categories" (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_daily boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enabled immediately on creation, in the same script, so there's no
-- window where this table sits exposed to Supabase's default anon/
-- authenticated API grants before RLS is turned on (see
-- 20260731000001_rls_policies.sql for the full rationale — this project
-- is shared with QuizHub, so "authenticated" isn't just Jay).
alter table "JL_categories" enable row level security;

create trigger categories_set_updated_at
  before update on "JL_categories"
  for each row execute function set_updated_at();

-- A puzzle is 5 clues plus a hidden "link" that ties them together.
-- episode_number continues Jay's existing YouTube Shorts/Reels numbering
-- (currently 280+) and is unique per category so future packs can have
-- their own independent numbering.
create table "JL_puzzles" (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references "JL_categories"(id) on delete restrict,
  episode_number integer not null,
  -- Nullable: only meaningful for is_daily categories. NULL = undated
  -- archive/pack puzzle, played in any order rather than unlocked by date.
  publish_date date,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published')),
  title text not null,
  link_answer text not null,
  link_alternatives text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, episode_number)
);

-- Prevents double-booking a publish date within the same category (only
-- enforced where publish_date is actually set).
create unique index puzzles_category_publish_date_unique
  on "JL_puzzles"(category_id, publish_date)
  where publish_date is not null;

create index puzzles_status_idx on "JL_puzzles"(status);
create index puzzles_publish_date_idx on "JL_puzzles"(publish_date);

alter table "JL_puzzles" enable row level security;

create trigger puzzles_set_updated_at
  before update on "JL_puzzles"
  for each row execute function set_updated_at();

-- The 5 clues belonging to a puzzle, in reveal order (position 1-5). A
-- clue is just a word/phrase — e.g. "Sesame", "Baker" — that auto-reveals
-- on a timer; it is never individually answered, so there's no
-- answer/alternatives column here (contrast with the old "questions"
-- design this replaced). Only the puzzle's link is ever guessed.
create table "JL_clues" (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references "JL_puzzles"(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  clue_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (puzzle_id, position)
);

alter table "JL_clues" enable row level security;

create trigger clues_set_updated_at
  before update on "JL_clues"
  for each row execute function set_updated_at();

-- Tier 3 of the answer engine (docs/ANSWER_ENGINE.md): every AI-judged
-- link-guess verdict is cached here, keyed by (puzzle, normalised guess),
-- so the same variant is only ever sent to the Anthropic API once across
-- the whole player base. Unlike the old design, puzzle_id is always set —
-- clues are never individually judged, so there's no question_id branch.
create table "JL_judged_answers" (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references "JL_puzzles"(id) on delete cascade,
  normalized_answer text not null,
  raw_answer text not null,
  verdict text not null check (verdict in ('accept', 'reject')),
  confidence numeric(3, 2),
  reason text,
  -- 'ai' = written by the Tier 2 judge; 'admin_override' = Jay flipped the
  -- verdict from the review queue.
  source text not null default 'ai' check (source in ('ai', 'admin_override')),
  times_seen integer not null default 1,
  -- Populated by the API route at insert time (it already knows the verdict
  -- and confidence): 'pending' if this needs a look in the review queue
  -- (every accept, plus any low-confidence reject), 'not_applicable' if it
  -- doesn't. Admin actions move 'pending' rows to 'approved'/'rejected'/'dismissed'.
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'dismissed', 'not_applicable')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One cached verdict per (puzzle, normalised guess) — the actual dedup
-- key the answer engine looks up on every Tier 2 call before hitting the API.
create unique index judged_answers_puzzle_unique
  on "JL_judged_answers"(puzzle_id, normalized_answer);

-- Powers the review queue view and the "judged calls per day" admin counter.
create index judged_answers_review_status_idx on "JL_judged_answers"(review_status);
create index judged_answers_created_at_idx on "JL_judged_answers"(created_at);

alter table "JL_judged_answers" enable row level security;
