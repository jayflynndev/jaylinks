# The answer engine

The core problem: players spell things differently (typos) **and** phrase
things differently (a fair guess can use different words entirely — e.g.
"Poems" for "Types of Poem"). String matching alone only solves the first
problem.

There is only ever **one** kind of thing to adjudicate: a guess at the
puzzle's hidden link. Clues themselves (the 5 words/phrases that auto-reveal
on a timer — see `CLAUDE.md`) are never individually answered, so there's no
per-clue answer checking anywhere in this app. Adjudication happens
server-side, in three tiers, entirely inside `/api/check-link`.

The link answer is **never** sent to the client before it's needed — see the
"Security" section at the bottom.

## Tier 1 — Fuzzy match (instant, free)

Implemented in `src/lib/answer-engine/`:
- `normalize.ts` — case-folds, strips diacritics and punctuation, collapses
  whitespace. `"Café-Sonnet!!"` → `"cafe sonnet"`.
- `levenshtein.ts` — standard edit-distance DP.
- `fuzzy-match.ts` — `fuzzyMatch(guess, canonicalAnswer, alternatives)`, the
  Tier 1 entry point.

A guess is accepted if, after normalising both sides, it:
1. **Exactly matches** the canonical link answer or any stored alternative, or
2. Is within **Levenshtein distance ≤ 2** of a candidate that's ≥ 5
   normalised characters long, or **≤ 1** for shorter candidates (short
   strings need a tighter typo budget or almost anything matches), or
3. **Matches the last word** of a multi-word candidate (surname-only for
   people, e.g. "Connery" matches "Sean Connery") — including typo tolerance
   on that surname using the same rule as (2).

Rule 3 is a deliberate heuristic: the schema has no "this answer is a
person's name" flag, so it applies to *any* multi-word candidate. This is
generous by design (Tier 1's job is to say yes fast and only fall through
when genuinely unsure) — the risk is a multi-word non-name answer where the
last word alone happens to be a reasonable-looking guess. If that ever
becomes a real problem for a specific puzzle, the fix is a targeted link
alternative on that puzzle, not a schema change.

If Tier 1 matches → correct, done, no network call. Thoroughly unit tested
in `src/lib/answer-engine/fuzzy-match.test.ts` — run with `npm test`.

## Tier 2 — AI judge (only when Tier 1 fails)

Implemented in `src/lib/answer-engine/ai-judge.ts` (`judgeAnswer`) with the
JSON-parsing logic split into `judge-verdict.ts` (`parseVerdict`) so it can
be unit tested without the `"server-only"` import guard — see
`judge-verdict.test.ts`.

When Tier 1 doesn't match, `judgeAnswer` calls the Anthropic API
(`claude-haiku-4-5`, key in `.env.local` as `ANTHROPIC_API_KEY`) with a short
description of the link (`contextText`), the canonical link answer, its
alternatives, and the player's guess. The judge prompt instructs the model
to:
- Accept semantically equivalent phrasings and **more-specific** correct
  answers where reasonable.
- **Reject vaguer umbrella answers** than the intended one — generosity
  flows toward precision, never toward vagueness.
- Respond with **strict JSON only**: `{"verdict": "accept" | "reject",
  "confidence": 0-1, "reason": "..."}`, parsed defensively (a malformed or
  unparseable response is treated as a Tier 2 failure, see below).

The call times out after 3 seconds (`JUDGE_TIMEOUT_MS`). On timeout or any
API error, `judgeAnswer` returns `null` and the engine falls back to Tier
1's verdict (reject, since Tier 1 already failed) — **the game never hangs
or breaks if the API is down.**

## Tier 3 — Learn from verdicts

Implemented in `src/lib/answer-engine/engine.ts` (`checkAnswer`), the entry
point `/api/check-link` calls.

Every Tier 2 verdict is cached in `"JL_judged_answers"` (see
`supabase/migrations/20260731000000_initial_schema.sql`), keyed by
`(puzzle_id, normalized_answer)`. Before calling the AI judge, `checkAnswer`
checks this cache — so each unique variant is sent to Anthropic **at most
once ever**, across every player. A cache hit also bumps `times_seen`
(best-effort — failures there don't affect the verdict returned to the
player).

- Every **accepted** variant, and every **rejected** variant with
  `confidence < 0.7` (`REVIEW_CONFIDENCE_THRESHOLD`), is written with
  `review_status = 'pending'` — these show up in the admin review queue at
  `/admin/review` (`src/lib/puzzles/review-queue.ts`,
  `src/app/admin/(protected)/review/`).
- **Approve** promotes the variant into that puzzle's `link_alternatives`
  (making it a Tier 1 match forever after) and flips the cached verdict to
  `accept` — covers both "yes, good accept" and "actually this low-
  confidence reject was wrong, it should've been accepted."
  `review_status` → `approved`.
- **Reject** flips the cached verdict to `reject` for all future players —
  used to overturn an AI `accept` the admin disagrees with. `review_status`
  → `rejected`, `source` → `admin_override`.
- **Dismiss** clears the item from the queue without changing the cached
  verdict — "the AI already got this one right, nothing to do."
  `review_status` → `dismissed`.
- The admin dashboard's **API-usage counter**
  (`countJudgeCallsToday` in `review-queue.ts`) is a simple query:
  `count(*) from "JL_judged_answers" where created_at >= <today's Europe/
  London midnight>` — since every row is (by construction) one real API
  call, this doubles as a cost tracker without a separate log table.

Concurrent requests for the same brand-new variant can race to insert the
same cache row; `checkAnswer` treats a unique-violation (Postgres error code
`23505`) on that insert as expected and doesn't surface it to the player.

## Security

The canonical `link_answer`/`link_alternatives` are columns on
`"JL_puzzles"` in Supabase, but the player-facing puzzle fetch
(`src/lib/puzzles/get-daily-puzzle.ts`) only ever selects and forwards each
clue's `clue_text`/`position` — never `link_answer` or `link_alternatives` —
until they're needed (a correct guess, or the end-of-round reveal).
Adjudication itself happens entirely server-side in `/api/check-link`, using
the service-role Supabase client (`src/lib/supabase/server.ts`), so there is
no client-side code path that ever has the link answer to inspect via dev
tools. The route looks the canonical answer/alternatives up server-side from
the posted `puzzleId` and only echoes the canonical text back once a guess
is confirmed correct.

The route also accepts `{ puzzleId, reveal: true }`, which skips
adjudication and returns the canonical link answer directly — this is what
the client calls when the round's meter/timeout runs out
(`isRoundTimedOut` in `scoring.ts`) without a correct guess, to reveal the
answer on the results screen. **Known v1 trade-off:** nothing server-side
stops a determined player from calling `reveal: true` immediately, before
actually playing — there's no player-account/session state in the database
to check "has this browser actually watched the clues reveal yet." This
matches the trust boundary of most casual daily-quiz games (a Wordle clone
doesn't cryptographically stop you from reading its solution via dev tools
either): the security bar here is "the answer isn't in the initial page
payload for casual inspection," not "immune to a player who deliberately
reverse-engineers the API."

Guess attempts are rate-limited per client IP in the route handler via
`src/lib/answer-engine/rate-limit.ts` — a basic in-memory fixed-window
counter (30 requests/minute), with the serverless caveat documented in that
file's comments.
