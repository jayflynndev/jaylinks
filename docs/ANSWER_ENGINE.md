# The answer engine

The core problem: players spell things differently (typos) **and** phrase
things differently (a fair answer can use different words entirely — e.g.
"Cheeses" for "Dairy"). String matching alone only solves the first problem.
Adjudication happens server-side, in three tiers, in `/api/check-answer` and
`/api/check-link` (which both call the same shared engine — a link guess is
adjudicated identically to a regular answer, just against
`puzzle.link_answer`/`link_alternatives` instead of a question's
`answer`/`alternatives`).

Answers are **never** sent to the client before they're needed — see the
"Security" section at the bottom.

## Tier 1 — Fuzzy match (instant, free)

Implemented in `src/lib/answer-engine/`:
- `normalize.ts` — case-folds, strips diacritics and punctuation, collapses
  whitespace. `"Café-Sonnet!!"` → `"cafe sonnet"`.
- `levenshtein.ts` — standard edit-distance DP.
- `fuzzy-match.ts` — `fuzzyMatch(guess, canonicalAnswer, alternatives)`, the
  Tier 1 entry point.

A guess is accepted if, after normalising both sides, it:
1. **Exactly matches** the canonical answer or any stored alternative, or
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
becomes a real problem for a specific puzzle, the fix is a targeted
alternative on that question, not a schema change.

If Tier 1 matches → correct, done, no network call. Thoroughly unit tested
in `src/lib/answer-engine/fuzzy-match.test.ts` — run with `npm test`.

## Tier 2 — AI judge (only when Tier 1 fails)

Implemented in `src/lib/answer-engine/ai-judge.ts` (`judgeAnswer`) with the
JSON-parsing logic split into `judge-verdict.ts` (`parseVerdict`) so it can
be unit tested without the `"server-only"` import guard — see
`judge-verdict.test.ts`.

When Tier 1 doesn't match, `judgeAnswer` calls the Anthropic API
(`claude-haiku-4-5`, key in `.env.local` as `ANTHROPIC_API_KEY`) with the
question text, canonical answer, alternatives, and the player's answer. The
judge prompt instructs the model to:
- Accept semantically equivalent answers and **more-specific** correct
  answers (e.g. "Cheeses" for "Dairy").
- **Reject vaguer umbrella answers** than the intended one (e.g. "Food" for
  "Dairy") — generosity flows toward precision, never toward vagueness.
- Respond with **strict JSON only**: `{"verdict": "accept" | "reject",
  "confidence": 0-1, "reason": "..."}`, parsed defensively (a malformed or
  unparseable response is treated as a Tier 2 failure, see below).

The call times out after 3 seconds (`JUDGE_TIMEOUT_MS`). On timeout or any
API error, `judgeAnswer` returns `null` and the engine falls back to Tier
1's verdict (reject, since Tier 1 already failed) — **the game never hangs
or breaks if the API is down.**

## Tier 3 — Learn from verdicts

Implemented in `src/lib/answer-engine/engine.ts` (`checkAnswer`), the entry
point both `/api/check-answer` and `/api/check-link` call.

Every Tier 2 verdict is cached in the `judged_answers` table (see
`supabase/migrations/20260731000000_initial_schema.sql`), keyed by
`(question_id or puzzle_id, normalized_answer)`. Before calling the AI
judge, `checkAnswer` checks this cache — so each unique variant is sent to
Anthropic **at most once ever**, across every player. A cache hit also
bumps `times_seen` (best-effort — failures there don't affect the verdict
returned to the player).

- Every **accepted** variant, and every **rejected** variant with
  `confidence < 0.7` (`REVIEW_CONFIDENCE_THRESHOLD`), is written with
  `review_status = 'pending'` — these are meant to show up in Jay's admin
  review queue: "Q: …, intended: Dairy, accepted: Cheeses — approve as
  official alternative?" **The `/admin/review` screen that reads this queue
  is not yet built** (milestone 6) — the data is being collected correctly
  from the first live judge call, just not surfaced yet.
- Approving a pending "accept" is meant to add the variant to the
  question's/puzzle's `alternatives`/`link_alternatives` array, making it a
  Tier 1 match forever (`review_status` → `approved`) — also part of the
  not-yet-built admin screen.
- Rejecting is meant to overturn the cached verdict for future players
  (`review_status` → `rejected`, `verdict` flipped, `source` set to
  `'admin_override'`) — same.
- The eventual admin dashboard's **API-usage counter** is a simple query
  once built: `count(*) from judged_answers where created_at::date =
  <today, Europe/London>` — since every row is (by construction) one real
  API call, this doubles as a cost tracker without a separate log table.

Concurrent requests for the same brand-new variant can race to insert the
same cache row; `checkAnswer` treats a unique-violation (Postgres error code
`23505`) on that insert as expected and doesn't surface it to the player.

## Security

Canonical answers and alternatives are columns on `questions`/`puzzles` in
Supabase, but the player-facing puzzle fetch (whatever route/server
component serves "today's puzzle" to the browser) must only ever select and
forward `question_text`/`position` — never `answer` or `alternatives` —
and likewise strip `link_answer`/`link_alternatives` until they're needed
(end-of-puzzle reveal). Adjudication itself happens entirely server-side in
`/api/check-answer` and `/api/check-link`, using the service-role Supabase
client (`src/lib/supabase/server.ts`), so there is no client-side code path
that ever has the answers to inspect via dev tools. Both routes look the
canonical answer/alternatives up server-side from the posted
`questionId`/`puzzleId` and only echo the canonical text back once a guess
is confirmed correct.

Guess attempts are rate-limited per client IP in both route handlers via
`src/lib/answer-engine/rate-limit.ts` — a basic in-memory fixed-window
counter (30 requests/minute), with the serverless caveat documented in that
file's comments.
