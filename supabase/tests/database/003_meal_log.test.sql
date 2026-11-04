-- Issue #15: meal_entries, foods, log_meal, suggest_foods.
-- AC: MEAL-05, 06, 08, 14, 15, 17 (+ MEAL-03/04 at the data layer). Users are created here and rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

select is(public.normalize_food_name('  Bún  NẠM '), 'bun nam', 'normalize: diacritics, case, whitespace');
select is(public.normalize_food_name('Đậu phụ'), 'dau phu', 'normalize: đ → d');

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-c000-00000000000a', 'authenticated', 'authenticated', 'meal-a@test.local'),
  ('00000000-0000-4000-c000-00000000000b', 'authenticated', 'authenticated', 'meal-b@test.local');

-- ------------------------------------------------------------ act as A
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-c000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ select public.log_meal('10000000-0000-4000-c000-000000000001', current_date - 1, 'Bún nạm', 450, 25, 1800, 6) $$,
  'A logs Bún nạm for yesterday'
);
select is((select use_count from public.foods), 1, 'a saved food is created with use_count 1');

select lives_ok(
  $$ select public.log_meal('10000000-0000-4000-c000-000000000001', current_date - 1, 'Bún nạm', 450, 25, 1800, 6) $$,
  'MEAL-17: re-sending the same request succeeds'
);
select is((select count(*)::int from public.meal_entries), 1, 'MEAL-17: still exactly one entry');
select is((select use_count from public.foods), 1, 'MEAL-17: a retry is not counted as another use');

select lives_ok(
  $$ select public.log_meal('10000000-0000-4000-c000-000000000002', current_date, 'bún  NẠM ', 500, 25, 1800, 6) $$,
  'A logs the same food today with new values and messy spacing'
);
select results_eq(
  $$ select name, use_count, calories_kcal::int from public.foods $$,
  $$ values ('bún NẠM'::text, 2, 500) $$,
  'MEAL-06/05: one saved food, display name and values updated, use_count 2'
);
select is(
  (select calories_kcal::int from public.meal_entries where id = '10000000-0000-4000-c000-000000000001'),
  450,
  'MEAL-05: yesterday''s entry keeps its own copy (450)'
);

select throws_ok(
  $$ select public.log_meal(gen_random_uuid(), current_date + 2, 'Phở', 400, 20, 1500, 3) $$,
  '23514', null, 'MEAL-08: a date two days ahead is rejected by the server'
);
select throws_ok(
  $$ select public.log_meal(gen_random_uuid(), current_date, 'Phở', 5001, 20, 1500, 3) $$,
  '23514', null, 'calories above 5000 are rejected'
);
select throws_ok(
  $$ select public.log_meal(gen_random_uuid(), current_date, '   ', 400, 20, 1500, 3) $$,
  '23514', null, 'an empty name is rejected'
);

select results_eq($$ select name from public.suggest_foods('bun') $$, $$ values ('bún NẠM'::text) $$,
  'MEAL-03: "bun" suggests Bún nạm');
select results_eq($$ select name from public.suggest_foods('nạm') $$, $$ values ('bún NẠM'::text) $$,
  'MEAL-04: a "contains" match is suggested too');
select is((select count(*)::int from public.suggest_foods('')), 0, 'empty query suggests nothing');
select is((select count(*)::int from public.suggest_foods('%')), 0, 'LIKE wildcards are escaped');

-- MEAL-14: 7 matches → 5, prefix group first, each group by last_used_at desc
do $$
begin
  perform public.log_meal(gen_random_uuid(), current_date, n, 300, 10, 500, 2)
    from unnest(array['Cơm tấm', 'Cơm gà', 'Cơm chiên', 'Cơm rang', 'Bánh cơm', 'Xôi cơm', 'Canh cơm']) as n;
end $$;

reset role;
update public.foods f set last_used_at = now() - v.age
  from (values ('Cơm tấm', interval '1 hour'), ('Cơm gà', interval '2 hours'), ('Cơm chiên', interval '3 hours'),
               ('Cơm rang', interval '4 hours'), ('Bánh cơm', interval '5 minutes'),
               ('Xôi cơm', interval '6 hours'), ('Canh cơm', interval '7 hours')) as v(name, age)
 where f.name = v.name;
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-c000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.suggest_foods('com')), 5, 'MEAL-14: at most 5 suggestions');
select results_eq(
  $$ select name from public.suggest_foods('com') $$,
  $$ values ('Cơm tấm'::text), ('Cơm gà'), ('Cơm chiên'), ('Cơm rang'), ('Bánh cơm') $$,
  'MEAL-14: "starts with" before "contains", most recent first within each group'
);

-- ------------------------------------------------------------ act as B
set local request.jwt.claims to '{"sub":"00000000-0000-4000-c000-00000000000b","role":"authenticated"}';

select is((select count(*)::int from public.meal_entries), 0, 'MEAL-15: B cannot read A''s entries');
select is((select count(*)::int from public.foods), 0, 'MEAL-15: B cannot read A''s saved foods');
select is((select count(*)::int from public.suggest_foods('bun')), 0, 'MEAL-15: B gets no suggestions from A');
select throws_ok(
  $$ select public.log_meal('10000000-0000-4000-c000-000000000001', current_date, 'Hack', 1, 1, 1, 1) $$,
  '23505', null, 'B cannot overwrite A''s entry by reusing its id'
);
delete from public.meal_entries where user_id = '00000000-0000-4000-c000-00000000000a';

reset role;
select is(
  (select count(*)::int from public.meal_entries where user_id = '00000000-0000-4000-c000-00000000000a'),
  9,
  'MEAL-15: B''s delete did not remove A''s entries'
);

-- ------------------------------------------------------------ anon
set local role anon;
select throws_ok($$ select * from public.meal_entries $$, '42501', null, 'anon cannot read entries');
select throws_ok(
  $$ select public.log_meal(gen_random_uuid(), current_date, 'Phở', 400, 20, 1500, 3) $$,
  '42501', null, 'anon cannot call log_meal'
);

select * from finish();
rollback;
