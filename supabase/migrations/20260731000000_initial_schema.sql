-- Jay's Links — initial schema
-- Run this in the Supabase SQL editor. See docs/SUPABASE_SETUP.md for the
-- full step-by-step walkthrough.
--
-- Design notes (see also CLAUDE.md and docs/ANSWER_ENGINE.md):
--   * "Daily" is just the flagship category (categories.is_daily = true)
--     with date-scheduled puzzles. Future non-daily category packs
--     ("Master Movies" etc.) are other categories with ordered, undated
--     puzzles — puzzles.publish_date is nullable for exactly this reason.
--     Nothing here assumes daily-only; the player/admin UI for other
--     categories is simply not built in v1.
--   * Canonical answers/alternatives live in this schema but must never be
--     sent to the client before they're needed — that's enforced in the
--     application layer (server-only Supabase access + API routes that
--     strip answer fields), not by the schema itself.

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
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_daily boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- A puzzle is 5 questions plus a hidden "link" that ties their answers
-- together. episode_number continues Jay's existing YouTube Shorts/Reels
-- numbering (currently 280+) and is unique per category so future packs can
-- have their own independent numbering.
create table puzzles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
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
  on puzzles(category_id, publish_date)
  where publish_date is not null;

create index puzzles_status_idx on puzzles(status);
create index puzzles_publish_date_idx on puzzles(publish_date);

create trigger puzzles_set_updated_at
  before update on puzzles
  for each row execute function set_updated_at();

-- The 5 questions belonging to a puzzle, in play order (position 1-5).
create table questions (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references puzzles(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  question_text text not null,
  answer text not null,
  alternatives text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (puzzle_id, position)
);

create trigger questions_set_updated_at
  before update on questions
  for each row execute function set_updated_at();

-- Tier 3 of the answer engine (docs/ANSWER_ENGINE.md): every AI-judged
-- verdict is cached here, keyed by the normalised player answer, so the
-- same variant is only ever sent to the Anthropic API once across the whole
-- player base. Exactly one of question_id / puzzle_id is set — puzzle_id is
-- used for link guesses (which aren't tied to a single question), question_id
-- for regular answers.
create table judged_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  puzzle_id uuid references puzzles(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  constraint judged_answers_subject_check check (
    (question_id is not null and puzzle_id is null) or
    (question_id is null and puzzle_id is not null)
  )
);

-- One cached verdict per (subject, normalised answer) — the actual dedup
-- key the answer engine looks up on every Tier 2 call before hitting the API.
create unique index judged_answers_question_unique
  on judged_answers(question_id, normalized_answer)
  where question_id is not null;

create unique index judged_answers_link_unique
  on judged_answers(puzzle_id, normalized_answer)
  where puzzle_id is not null;

-- Powers the review queue view and the "judged calls per day" admin counter.
create index judged_answers_review_status_idx on judged_answers(review_status);
create index judged_answers_created_at_idx on judged_answers(created_at);
