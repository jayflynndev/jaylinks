# Adding puzzles (admin guide)

The admin screen at `/admin` is authenticated with your Supabase login — see
`docs/SUPABASE_SETUP.md` for how that's set up, including the `is_admin`
requirement.

## What a puzzle is

Each puzzle is 5 clue words/phrases that reveal one at a time, 5 seconds
apart, plus the hidden link connecting them. For example:

```
Clue 1: Sesame
Clue 2: Quality
Clue 3: Baker
Clue 4: Coronation
Clue 5: Fleet
Link:   Streets
```

Clues are never individually answered — the only thing a player guesses is
the link, at any point after the first clue appears.

## One puzzle at a time

1. Log in at `/admin`.
2. Click **New puzzle**.
3. Episode number auto-fills (next unused number in the Daily category) —
   override it if needed.
4. Pick a publish date. The dashboard warns you if there's a gap between this
   puzzle and the next scheduled one, or if the date is already taken.
5. Fill in the 5 clues in reveal order — just the word/phrase itself, no
   answer or alternatives per clue (there's nothing to answer).
6. Fill in the link answer and any link alternatives (link phrasing varies a
   lot — e.g. "Streets" / "Types of Street" / "British street names" — so add
   a few up front). You don't need to list every possible phrasing — the AI
   judge and the review queue (`docs/ANSWER_ENGINE.md`, `/admin/review`)
   catch most of the rest; approve new alternatives there as they come in.
7. The **duplicate-answer checker** flags if a link answer has been used in a
   previous puzzle, so you can catch accidental repeats. It only checks link
   answers — clue words (e.g. "Fleet") are expected to repeat across puzzles
   constantly and aren't flagged.
8. Use **Preview** to play the puzzle exactly as a player would (real
   `/api/check-link` adjudication), before it's scheduled/published, without
   it touching real player stats.
9. Save as **Draft** to keep working later, **Scheduled** to lock in the
   publish date, or **Published** to make it live immediately (only used for
   the current day's puzzle or backfilling).

## Bulk import (for the back catalogue)

For loading many puzzles at once (e.g. a back catalogue of episodes), use
**Bulk import** on the admin dashboard and paste JSON in this shape:

```json
[
  {
    "episode_number": 281,
    "publish_date": "2026-08-01",
    "category_slug": "daily",
    "title": "Streets",
    "clues": ["Sesame", "Quality", "Baker", "Coronation", "Fleet"],
    "link_answer": "Streets",
    "link_alternatives": ["Types of Street"]
  }
]
```

Notes:
- `publish_date` is optional — omit it for undated/archive puzzles (used by
  future non-daily category packs). `category_slug` defaults to `"daily"`.
- `episode_number` should be unique; the importer will warn (not silently
  skip) on collisions.
- `clues` must be an array of exactly 5 non-empty strings, in reveal order.
- The importer runs the same duplicate-answer checker as the single-puzzle
  editor (link answers only) and shows a summary of warnings before you
  confirm the import.
- All dates are interpreted as Europe/London calendar dates — see
  `src/lib/time/` for why this matters (puzzles unlock at UK midnight).

## The review queue

At `/admin/review`: every AI-judged guess still awaiting a human decision —
an accepted variant worth promoting into `link_alternatives`, or a
low-confidence rejection worth double-checking. **Approve** adds the variant
as an official alternative and confirms the accept; **Reject** overturns an
AI accept you disagree with; **Dismiss** clears the item without changing
anything. The page also shows how many AI judge calls have run today
(Europe/London day) — a rough cost tracker, since each row is one real API
call. See `docs/ANSWER_ENGINE.md` for the full three-tier design.
