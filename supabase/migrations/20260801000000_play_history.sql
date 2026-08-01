-- Jay's Links — optional player accounts: server-saved play history.
-- Run this in the Supabase SQL editor, after the three migrations already
-- in this folder. Self-contained (creates the table and enables RLS in
-- the same script — see 20260731000000_initial_schema.sql for why that
-- matters: no window where the table exists but isn't yet RLS-protected).
--
-- Design notes (see also CLAUDE.md):
--   * Sign-in stays fully optional — this table only ever gets a row once
--     a player chooses to sign in. Anonymous play keeps working exactly
--     as before, via localStorage (src/lib/storage/player-store.ts).
--   * Only *real* (non-practice) plays are ever written here — practice
--     replays stay purely client-side/ephemeral even for signed-in
--     players, matching the "practice doesn't count" rule the localStorage
--     implementation already enforces.
--   * No separate stats/streak table: PlayerStats is always derived fresh
--     from this table's rows (src/lib/storage/compute-stats-from-history.ts)
--     rather than cached, so there's no class of cache-drift bug and the
--     one-time local-history merge (on first sign-in) is always correct
--     just by recomputing from the merged rows, never patching a stored
--     number.

create table "JL_play_history" (
  id uuid primary key default gen_random_uuid(),
  -- References the shared project's auth.users (not a table this app
  -- owns) — same account works on QuizHub, per the shared-project design.
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_id uuid not null references "JL_puzzles"(id) on delete cascade,
  -- Denormalized from JL_puzzles at play time so the history list needs no
  -- join, and so a record reflects what was actually played even if a
  -- puzzle is ever renumbered afterward.
  episode_number integer not null,
  played_date date not null,
  clue_texts text[] not null,
  revealed_clue_count smallint not null check (revealed_clue_count between 0 and 5),
  guessed_correctly boolean not null,
  total_score integer not null check (total_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One real play per puzzle per account — also the conflict target both
  -- the live-save path (on conflict do update) and the one-time local-
  -- history merge (on conflict do nothing, existing account rows win)
  -- upsert against.
  unique (user_id, puzzle_id)
);

alter table "JL_play_history" enable row level security;

-- Powers the profile page's history list and stats recompute, both of
-- which query "every row for this user, ordered by date".
create index play_history_user_played_date_idx
  on "JL_play_history"(user_id, played_date);

create trigger play_history_set_updated_at
  before update on "JL_play_history"
  for each row execute function set_updated_at();

-- No RLS policies added, deliberately — same rationale as every other
-- "JL_*" table (see 20260731000001_rls_policies.sql): this Supabase
-- project is shared with QuizHub, so "authenticated" means any QuizHub
-- user, not just this app's players. Every read/write goes through the
-- service-role client server-side (src/lib/storage/player-history-queries.ts),
-- which re-derives the authenticated user from the session cookie itself
-- rather than trusting anything client-supplied — RLS here is pure
-- defense-in-depth, default-deny for both `anon` and `authenticated`.
