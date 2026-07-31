# Supabase setup (step-by-step)

This walks through creating the free Supabase project that powers Jay's
Links' database and admin login, from scratch. No prior Supabase experience
assumed.

## 1. Create your Supabase account and project

1. Go to [supabase.com](https://supabase.com) and click **Start your
   project**. Sign up (GitHub sign-in is easiest) — this is free, no card
   required for the free tier.
2. Once logged in, click **New project**.
3. Fill in the form:
   - **Name**: `jays-links` (or anything you like — it's just a label).
   - **Database password**: click **Generate a password**, then copy it
     somewhere safe (a password manager, or a note — you likely won't need
     it directly, but keep it in case).
   - **Region**: pick the one closest to you (e.g. "West EU (London)" if
     you're in the UK) — this keeps the app snappy.
   - **Pricing plan**: leave on **Free**.
4. Click **Create new project**. It takes 1-2 minutes to provision — you'll
   land on the project dashboard once it's ready.

## 2. Run the database migrations

The SQL files that create all the tables live in this repo under
`supabase/migrations/`, in the order they should be run (the filenames start
with a timestamp, so just run them top to bottom).

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/20260731000000_initial_schema.sql` in this
   repo, copy its entire contents, and paste them into the SQL editor.
4. Click **Run** (or press Ctrl/Cmd+Enter). You should see "Success. No rows
   returned" — that means all the tables were created.
5. Repeat steps 2-4 for `20260731000001_rls_policies.sql`.
6. Repeat steps 2-4 for `20260731000002_seed_sample_puzzles.sql` — this adds
   3 sample puzzles (including the "Types of Poem" one from the brief) so
   you can play the app right away.

If any step errors, stop and check the error message before continuing —
don't re-run a script that partially succeeded without checking what's
already there (you can look under **Table Editor** in the sidebar to see
what tables/rows exist).

When new migration files are added later in development, come back to this
section and run just the new ones the same way, in filename order.

## 3. Get your API keys

1. In the sidebar, click the gear icon **Project Settings**, then **API**.
2. You'll need three values for `.env.local` in the project root (copy
   `.env.local.example` to `.env.local` first if you haven't):
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

## 4. Create your admin login

The `/admin` screen uses Supabase Auth so only you can create/edit puzzles.

1. In the sidebar, click **Authentication**, then **Users**.
2. Click **Add user** → **Create new user**.
3. Enter your email address and a password you'll remember (or choose
   "Auto Confirm User" so you don't need to click an email link).
4. Click **Create user**.

That's the account you'll log in with at `/admin` once that screen is built.
(If you'd rather use magic-link email sign-in instead of a password, that's
also fine — Supabase Auth supports both. This doc will be updated with
exact sign-in instructions once the admin screen ships.)

## 5. Verify the connection

Once `.env.local` is filled in, run:

```bash
npm run dev
```

and open [http://localhost:3000](http://localhost:3000). Once the player UI
is built (see `CLAUDE.md` status notes), you should see today's seeded
puzzle. If you see a Supabase connection error instead, double-check the
three keys in `.env.local` match what's in Project Settings → API, and that
you didn't leave any stray quotes or spaces around the values.

## Reference: what each key is used for

| Env var | Used where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Your project's API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | Powers the `/admin` login flow only |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | All puzzle/answer reads & writes, bypassing RLS |
| `ANTHROPIC_API_KEY` | server only | Tier 2 AI answer judge — see `docs/ANSWER_ENGINE.md` |
