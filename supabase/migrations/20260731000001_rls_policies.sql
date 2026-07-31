-- Row Level Security for Jay's Links.
--
-- All puzzle/question/judged_answers reads and writes from the Next.js app
-- go through server-side code using the Supabase *service role* key, which
-- bypasses RLS entirely — that's what keeps answers out of the client
-- (the server strips answer fields before responding; see
-- docs/ANSWER_ENGINE.md's security note). RLS here is defense-in-depth for
-- the one case where the browser *does* talk to Supabase directly: the
-- admin screen's auth session (via the anon key) if it ever queries tables
-- straight from supabase-js instead of through an API route.
--
-- There is no public sign-up — Jay's is the only Supabase Auth account — so
-- "authenticated" effectively means "Jay, logged into /admin".

alter table categories enable row level security;
alter table puzzles enable row level security;
alter table questions enable row level security;
alter table judged_answers enable row level security;

create policy "authenticated full access to categories"
  on categories for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access to puzzles"
  on puzzles for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access to questions"
  on questions for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated full access to judged_answers"
  on judged_answers for all
  to authenticated
  using (true)
  with check (true);

-- Deliberately no policies for the `anon` role: the anon key is only used
-- client-side for the admin login flow itself, never for data access.
-- Player-facing reads happen via the service role key on the server.
