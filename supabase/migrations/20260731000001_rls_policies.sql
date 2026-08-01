-- Row Level Security for Jay's Links.
--
-- RLS is actually turned on for every "JL_*" table back in
-- 20260731000000_initial_schema.sql, immediately after each `create
-- table` — that closes the exposure window that would otherwise exist
-- between "table created" and "RLS enabled" (Supabase's default anon/
-- authenticated API grants would otherwise reach a brand-new table the
-- instant it exists). The `enable row level security` calls below are
-- re-run here anyway — they're idempotent — so this file still reads as
-- the canonical "here's our RLS posture" doc and stays safe to run
-- standalone if these ever get restructured.
--
-- All "JL_*" reads and writes from the Next.js app go through server-side
-- code using the Supabase *service role* key, which bypasses RLS entirely
-- — that's what keeps the link answer out of the client (the server
-- strips it before responding; see docs/ANSWER_ENGINE.md's security
-- note). RLS here is pure defense-in-depth for the one case where the
-- browser *does* talk to Supabase directly: the admin screen's auth
-- session (via the anon key), if it ever queries tables straight from
-- supabase-js instead of through a server action/route.
--
-- IMPORTANT: this Supabase project is shared with Jay's other site,
-- QuizHub — "authenticated" here means *any* signed-in user across both
-- sites, not just Jay. So unlike a single-tenant admin tool, we do NOT
-- grant the authenticated role blanket access to "JL_*" tables. Admin
-- authorization is enforced in the application layer instead (checking
-- profiles.is_admin — see src/lib/supabase/admin-check.ts), which the
-- service-role client that does all the real work isn't subject to RLS
-- anyway. So: enable RLS on every "JL_*" table, and deliberately add no
-- policies at all — default-deny for both `anon` and `authenticated`.

alter table "JL_categories" enable row level security;
alter table "JL_puzzles" enable row level security;
alter table "JL_clues" enable row level security;
alter table "JL_judged_answers" enable row level security;
