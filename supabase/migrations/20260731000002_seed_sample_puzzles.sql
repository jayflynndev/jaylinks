-- Seed data: the Daily category plus 3 sample puzzles so Jay can play the
-- app immediately after running the migrations. Episode 281 is published
-- for "today" (whatever day this migration is actually run — see the
-- current_date expressions below), with 282/283 scheduled for the next two
-- days.

insert into categories (slug, name, description, is_daily, sort_order)
values ('daily', 'Daily', 'The daily chain-quiz — one puzzle a day.', true, 0);

-- Episode 281: Types of Poem (the reference example from the build brief).
with new_puzzle as (
  insert into puzzles (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 281, current_date, 'published', 'Types of Poem', 'Types of Poem',
         array['Poems', 'Poem types', 'Types of poetry', 'Poetry forms']
  from categories where slug = 'daily'
  returning id
)
insert into questions (puzzle_id, position, question_text, answer, alternatives)
select id, position, question_text, answer, alternatives
from new_puzzle, (values
  (1, 'A short lyric poem of mourning or reflection for the dead', 'Elegy', array[]::text[]),
  (2, 'A traditional Japanese three-line poem, often about nature', 'Haiku', array[]::text[]),
  (3, 'A 14-line poem, often about love, famously written by Shakespeare', 'Sonnet', array[]::text[]),
  (4, 'A humorous five-line poem with an AABBA rhyme scheme', 'Limerick', array[]::text[]),
  (5, 'A short lyric poem, often in praise or celebration of its subject', 'Ode', array[]::text[])
) as q(position, question_text, answer, alternatives);

-- Episode 282: The Great Lakes.
with new_puzzle as (
  insert into puzzles (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 282, current_date + 1, 'scheduled', 'The Great Lakes', 'The Great Lakes',
         array['Great Lakes', 'The Great Lakes of North America']
  from categories where slug = 'daily'
  returning id
)
insert into questions (puzzle_id, position, question_text, answer, alternatives)
select id, position, question_text, answer, alternatives
from new_puzzle, (values
  (1, 'Which Great Lake is the largest by surface area?', 'Superior', array[]::text[]),
  (2, 'Which Great Lake is the only one located entirely within the United States?', 'Michigan', array[]::text[]),
  (3, 'Which Great Lake is named after a Native American people of the region?', 'Huron', array[]::text[]),
  (4, 'Which Great Lake is the shallowest of the five?', 'Erie', array[]::text[]),
  (5, 'Which Great Lake is the smallest by surface area?', 'Ontario', array[]::text[])
) as q(position, question_text, answer, alternatives);

-- Episode 283: James Bond Actors.
with new_puzzle as (
  insert into puzzles (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 283, current_date + 2, 'scheduled', 'James Bond Actors', 'James Bond actors',
         array['Actors who played James Bond', '007 actors', 'Bond actors']
  from categories where slug = 'daily'
  returning id
)
insert into questions (puzzle_id, position, question_text, answer, alternatives)
select id, position, question_text, answer, alternatives
from new_puzzle, (values
  (1, 'Which actor played Bond in ''Dr. No'' and ''Goldfinger''?', 'Sean Connery', array['Connery']),
  (2, 'Which actor played Bond in ''Live and Let Die'' and ''Moonraker''?', 'Roger Moore', array['Moore']),
  (3, 'Which actor played Bond in ''The Living Daylights''?', 'Timothy Dalton', array['Dalton']),
  (4, 'Which actor played Bond in ''GoldenEye''?', 'Pierce Brosnan', array['Brosnan']),
  (5, 'Which actor played Bond in ''Casino Royale'' (2006) and ''Skyfall''?', 'Daniel Craig', array['Craig'])
) as q(position, question_text, answer, alternatives);
