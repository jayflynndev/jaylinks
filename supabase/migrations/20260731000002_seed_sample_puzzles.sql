-- Seed data: the Daily category plus 3 sample puzzles so Jay can play the
-- app immediately after running the migrations. Episode 281 is published
-- for "today" (whatever day this migration is actually run — see the
-- current_date expressions below), with 282/283 scheduled for the next two
-- days.
--
-- Each puzzle is 5 clue words/phrases (revealed on a timer, never
-- individually answered) that all combine with the hidden link.

insert into "JL_categories" (slug, name, description, is_daily, sort_order)
values ('daily', 'Daily', 'The daily chain-quiz — one puzzle a day.', true, 0);

-- Episode 281: Streets (Jay's own reference example).
with new_puzzle as (
  insert into "JL_puzzles" (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 281, current_date, 'published', 'Streets', 'Streets',
         array['Street', 'Types of street']
  from "JL_categories" where slug = 'daily'
  returning id
)
insert into "JL_clues" (puzzle_id, position, clue_text)
select id, position, clue_text
from new_puzzle, (values
  (1, 'Sesame'),
  (2, 'Quality'),
  (3, 'Baker'),
  (4, 'Coronation'),
  (5, 'Fleet')
) as c(position, clue_text);

-- Episode 282: Parks.
with new_puzzle as (
  insert into "JL_puzzles" (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 282, current_date + 1, 'scheduled', 'Parks', 'Parks',
         array['Park', 'Types of park']
  from "JL_categories" where slug = 'daily'
  returning id
)
insert into "JL_clues" (puzzle_id, position, clue_text)
select id, position, clue_text
from new_puzzle, (values
  (1, 'Hyde'),
  (2, 'Jurassic'),
  (3, 'Central'),
  (4, 'Linkin'),
  (5, 'Regent''s')
) as c(position, clue_text);

-- Episode 283: Squares.
with new_puzzle as (
  insert into "JL_puzzles" (category_id, episode_number, publish_date, status, title, link_answer, link_alternatives)
  select id, 283, current_date + 2, 'scheduled', 'Squares', 'Squares',
         array['Square', 'Types of square']
  from "JL_categories" where slug = 'daily'
  returning id
)
insert into "JL_clues" (puzzle_id, position, clue_text)
select id, position, clue_text
from new_puzzle, (values
  (1, 'Times'),
  (2, 'Trafalgar'),
  (3, 'Red'),
  (4, 'Leicester'),
  (5, 'Tiananmen')
) as c(position, clue_text);
