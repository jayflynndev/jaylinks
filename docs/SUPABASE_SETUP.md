# Supabase setup (step-by-step)

Jay's Links **reuses the existing Supabase project** that already powers
QuizHub — same project, same `auth.users` table, so a login created on
either site works on both. This app does not get its own Supabase project.
Every table this app creates is prefixed `"JL_"` (exact case) so it's
visually distinguishable from QuizHub's tables in the same project's Table
Editor.

## 1. Run the database migrations

The SQL files that create Jay's Links' tables live in this repo under
`supabase/migrations/`, in the order they should be run (the filenames start
with a timestamp, so just run them top to bottom).

1. In the Supabase dashboard for the existing QuizHub project, click **SQL
   Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/20260731000000_initial_schema.sql` in this
   repo, copy its entire contents, and paste them into the SQL editor.
4. Click **Run** (or press Ctrl/Cmd+Enter). You should see "Success. No rows
   returned" — that means `"JL_categories"`, `"JL_puzzles"`, `"JL_clues"`,
   and `"JL_judged_answers"` were created. Nothing here touches QuizHub's
   own tables.
5. Repeat steps 2-4 for `20260731000001_rls_policies.sql` — this enables
   Row Level Security on the 4 `JL_` tables with **no policies** (default-
   deny for both `anon` and `authenticated`). This app's server code always
   uses the service-role key to talk to these tables (which bypasses RLS),
   so this is defense-in-depth only — but it matters here specifically
   because `authenticated` means "any QuizHub user," not "Jay," now that the
   project is shared.
6. Repeat steps 2-4 for `20260731000002_seed_sample_puzzles.sql` — this adds
   3 sample puzzles so you can play the app right away.

If any step errors, stop and check the error message before continuing —
don't re-run a script that partially succeeded without checking what's
already there (look under **Table Editor** in the sidebar, filter for the
`JL_` prefix to see just this app's tables).

When new migration files are added later in development, come back to this
section and run just the new ones the same way, in filename order.

## 2. Get your API keys

If you already have QuizHub's `.env.local` keys to hand, they're the same
project — you can skip straight to pasting them into this repo's
`.env.local` (copy `.env.local.example` first if you haven't). Otherwise:

1. In the sidebar, click the gear icon **Project Settings**, then **API**.
2. You'll need three values for `.env.local` in this project's root:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key (under "Project API keys") →
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (also under "Project API keys" — click "Reveal" to
     see it) → `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ The **service_role** key bypasses all database security rules — treat
   it like a master password. It only ever goes in `.env.local` (which is
   gitignored) or your hosting provider's environment variable settings,
   **never** in any file that starts with `NEXT_PUBLIC_`, and never
   committed to git.

## 3. Make your account an admin

The `/admin` screen checks two things: that you're signed in via Supabase
Auth, **and** that your row in the existing `profiles` table (the one
QuizHub already uses, linked to `auth.users`) has `is_admin = true`. Being
signed in alone is not enough — since this project's user base is shared
with QuizHub, "any logged-in user" would mean "any QuizHub visitor."

1. If you don't already have a QuizHub account, sign up for one first (via
   QuizHub, or **Authentication → Users → Add user** in the Supabase
   dashboard).
2. In the sidebar, click **Table Editor**, open `profiles`, find your row
   (matched by your user id / email), and set `is_admin` to `true`.
3. That's the account you log in with at `/admin/login`.

If you sign in at `/admin/login` with an account that isn't an admin, you'll
see a "not an admin account" message instead of the dashboard — that's
expected, not a bug; it means step 2 above still needs doing for that
account.

## 4. Verify the connection

Once `.env.local` is filled in, run:

```bash
npm run dev
```

and open [http://localhost:3000](http://localhost:3000) — you should see
today's seeded puzzle. If you see a Supabase connection error instead,
double-check the three keys in `.env.local` match what's in Project
Settings → API, and that you didn't leave any stray quotes or spaces around
the values.

## Reference: what each key is used for

| Env var | Used where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Your project's API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | Powers the `/admin/login` sign-in flow only |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | All `JL_*` table reads & writes, bypassing RLS; also checks `profiles.is_admin` |
| `ANTHROPIC_API_KEY` | server only | Tier 2 AI link-guess judge — see `docs/ANSWER_ENGINE.md` |
