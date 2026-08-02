-- Jay's Links — anti-cheat: server-recorded round start times.
-- Run this in the Supabase SQL editor, after the migrations already in
-- this folder. Self-contained (creates the table and enables RLS in the
-- same script — see 20260731000000_initial_schema.sql for why).
--
-- The problem this closes: a signed-in player could open today's puzzle,
-- watch all 5 clues reveal, back out before the round naturally times
-- out (nothing was ever saved), and re-enter — getting a brand-new round
-- with full knowledge of the answer and a full points meter. Nothing
-- server-side recorded that a round had even begun until it *finished*.
--
-- The fix: the moment a signed-in player's round genuinely begins, this
-- table records it — `on conflict do nothing`, so re-opening the app
-- (any device, any browser) never resets the clock, only ever reads the
-- original start time back. The client then resumes the round's meter/
-- clue-reveal state from real elapsed wall-clock time instead of
-- restarting from zero — see src/lib/storage/player-store.ts's
-- getOrStartRound. Rows are deleted once the round genuinely finishes
-- (src/components/game/PuzzleRound.tsx), so this table only ever holds
-- truly in-progress rounds.
--
-- Anonymous (not signed in) players get the same protection via a
-- localStorage-only equivalent (see LocalStoragePlayerStore) — this
-- table is only consulted for signed-in play.

create table "JL_round_starts" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_id uuid not null references "JL_puzzles"(id) on delete cascade,
  episode_number integer not null,
  started_at timestamptz not null default now(),
  unique (user_id, puzzle_id)
);

alter table "JL_round_starts" enable row level security;

-- No RLS policies added, deliberately — same rationale as every other
-- "JL_*" table: this Supabase project is shared with QuizHub, so
-- "authenticated" means any QuizHub user, not just this app's players.
-- Every read/write goes through the service-role client server-side
-- (src/lib/storage/player-history-queries.ts).
