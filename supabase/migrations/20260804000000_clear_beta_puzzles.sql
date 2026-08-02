-- Jay's Links — clears the beta-era Daily puzzles ahead of the real
-- launch content (280 puzzles, 2 Aug 2026 – 8 May 2027, matching Jay's
-- real YouTube numbering restarting at #1 for the new audience).
--
-- Deliberately not a schema change, so it doesn't follow the "run once,
-- keep forever" pattern the other migrations do — run this once, then
-- import the new puzzles via the admin Bulk Import screen (which does
-- its own preview/duplicate-check before writing anything).
--
-- This intentionally also removes beta testers' play history/streaks —
-- JL_play_history, JL_round_starts, and JL_judged_answers all reference
-- JL_puzzles with "on delete cascade", so deleting the puzzles removes
-- those too. Testers were told this could happen ahead of proper launch,
-- so this is expected, not accidental data loss.

delete from "JL_puzzles"
where category_id = (select id from "JL_categories" where slug = 'daily');
