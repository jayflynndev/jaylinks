# Adding puzzles (admin guide)

> This doc describes the admin screen at `/admin`, which is authenticated
> with your Supabase login (see `docs/SUPABASE_SETUP.md`). It is updated as
> the admin screen is built — check the "Status" note at the bottom for what
> currently exists.

## One puzzle at a time

1. Log in at `/admin`.
2. Click **New puzzle**.
3. Episode number auto-fills (next unused number in the Daily category) —
   override it if needed.
4. Pick a publish date. The dashboard warns you if there's a gap between this
   puzzle and the next scheduled one, or if the date is already taken.
5. Fill in the 5 questions in order. For each: question text, the canonical
   answer, and any alternative phrasings you want auto-accepted (e.g. for
   "Dairy" you might add "Dairy products"). You don't need to list every
   possible phrasing — the AI judge and the review queue (see
   `docs/ANSWER_ENGINE.md`) catch most of the rest, and you approve new
   alternatives from `/admin/review` as they come in.
6. Fill in the link answer and any link alternatives (link phrasing varies a
   lot — e.g. "Types of Poem" / "poems" / "poetry forms" — so add a few up
   front).
7. The **duplicate-answer checker** flags if an answer or link text has been
   used in a previous puzzle, so you can catch accidental repeats.
8. Use **Preview** to play the puzzle exactly as a player would, before it's
   scheduled/published.
9. Save as **Draft** to keep working later, **Scheduled** to lock in the
   publish date, or **Published** to make it live immediately (only used for
   the current day's puzzle or backfilling).

## Bulk import (for the back catalogue)

For loading many puzzles at once (e.g. the 280-episode archive), use
**Bulk import** on the admin dashboard and paste/upload JSON in this shape:

```json
[
  {
    "episode_number": 281,
    "publish_date": "2026-08-01",
    "category_slug": "daily",
    "title": "Types of Poem",
    "questions": [
      { "question_text": "A short lyric poem of mourning or reflection", "answer": "Elegy", "alternatives": [] },
      { "question_text": "A traditional Japanese three-line poem", "answer": "Haiku", "alternatives": [] },
      { "question_text": "A 14-line poem, often about love", "answer": "Sonnet", "alternatives": [] },
      { "question_text": "A humorous five-line poem with an AABBA rhyme scheme", "answer": "Limerick", "alternatives": [] },
      { "question_text": "A short lyric poem, often in praise of something", "answer": "Ode", "alternatives": [] }
    ],
    "link_answer": "Types of Poem",
    "link_alternatives": ["Poems", "Poem types", "Types of poetry", "Poetry forms"]
  }
]
```

Notes:
- `publish_date` is optional — omit it for undated/archive puzzles (used by
  future non-daily category packs). `category_slug` defaults to `"daily"`.
- `episode_number` should be unique; the importer will warn (not silently
  skip) on collisions.
- Question order in the array is the order they're asked (`position` 1–5).
- The importer runs the same duplicate-answer checker as the single-puzzle
  editor and shows a summary of warnings before you confirm the import.
- All dates are interpreted as Europe/London calendar dates — see
  `src/lib/time/` for why this matters (puzzles unlock at UK midnight).

## Status

The admin screen (`/admin`, including bulk import, preview, and the
duplicate-answer checker) has not been built yet — this doc describes the
target design from the build brief and will be corrected/expanded once that
milestone lands. Until then, puzzles are seeded directly via SQL — see
`supabase/migrations/`.
