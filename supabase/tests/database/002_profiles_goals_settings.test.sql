-- Issue #9: ownership RLS, privileges and constraints for profiles, goals, user_settings.
-- AC: ACC-13, GOAL-13, REM-09, REM-10. Users are created here and rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-b000-00000000000a', 'authenticated', 'authenticated', 'rls-a@test.local'),
  ('00000000-0000-4000-b000-00000000000b', 'authenticated', 'authenticated', 'rls-b@test.local');

-- ------------------------------------------------------------ act as A
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-b000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (weight_kg, height_cm, sex, birth_year, activity_level, goal_type)
     values (70.0, 175, 'male', extract(year from now())::int - 30, 'moderate', 'lose') $$,
  'A inserts own profile (user_id defaults to auth.uid())'
);
select lives_ok($$ insert into public.goals (calorie_target) values (1800) $$, 'A inserts own goals');
select lives_ok($$ insert into public.user_settings default values $$, 'A inserts own settings');
select results_eq(
  $$ select log_reminder_enabled, log_reminder_time from public.user_settings $$,
  $$ values (false, '20:00'::time) $$,
  'settings default to reminder off at 20:00'
);

-- ------------------------------------------------------------ act as B
set local request.jwt.claims to '{"sub":"00000000-0000-4000-b000-00000000000b","role":"authenticated"}';

select is((select count(*)::int from public.profiles), 0, 'ACC-13: B cannot read A''s profile');
select is((select count(*)::int from public.goals), 0, 'GOAL-13: B cannot read A''s goals');
select is((select count(*)::int from public.user_settings), 0, 'REM-10: B cannot read A''s settings');

-- Silent no-ops under RLS; verified below as superuser.
update public.profiles set weight_kg = 99.0 where user_id = '00000000-0000-4000-b000-00000000000a';
update public.goals set calorie_target = 900 where user_id = '00000000-0000-4000-b000-00000000000a';
update public.user_settings set log_reminder_enabled = true
  where user_id = '00000000-0000-4000-b000-00000000000a';

select throws_ok(
  $$ insert into public.profiles (user_id, weight_kg, height_cm, sex, birth_year, activity_level, goal_type)
     values ('00000000-0000-4000-b000-00000000000a', 60, 160, 'female', 1995, 'light', 'gain') $$,
  '42501', null, 'ACC-13: B cannot write a profile for A'
);
select throws_ok(
  $$ insert into public.user_settings (user_id) values ('00000000-0000-4000-b000-00000000000a') $$,
  '42501', null, 'REM-10: B cannot write settings for A'
);
select throws_ok(
  $$ insert into public.goals (user_id, calorie_target) values ('00000000-0000-4000-b000-00000000000a', 2000) $$,
  '42501', null, 'GOAL-13: B cannot write goals for A'
);
select throws_ok(
  $$ delete from public.profiles where user_id = '00000000-0000-4000-b000-00000000000a' $$,
  '42501', null, 'ACC-13: B cannot delete A''s profile (no delete privilege)'
);

-- Constraints (B writing its own rows)
select throws_ok(
  $$ insert into public.user_settings (log_reminder_time) values ('20:03') $$,
  '23514', null, 'REM-09: reminder minutes must be a multiple of 5'
);
select throws_ok(
  $$ insert into public.user_settings (log_reminder_time) values ('20:05:30') $$,
  '23514', null, 'REM-09: reminder time cannot carry seconds'
);
select throws_ok(
  $$ insert into public.user_settings (log_reminder_time) values ('25:00') $$,
  '22008', null, 'REM-09: out-of-range time is rejected'
);
select throws_ok(
  $$ insert into public.user_settings (log_reminder_time) values ('abc') $$,
  '22007', null, 'REM-09: malformed time is rejected'
);
select throws_ok(
  $$ insert into public.profiles (weight_kg, height_cm, sex, birth_year, activity_level, goal_type)
     values (19.9, 160, 'female', 1995, 'light', 'gain') $$,
  '23514', null, 'weight below 20.0 kg is rejected'
);
select throws_ok(
  $$ insert into public.profiles (weight_kg, height_cm, sex, birth_year, activity_level, goal_type)
     values (60, 160, 'female', extract(year from now())::int - 12, 'light', 'gain') $$,
  '23514', null, 'age 12 is rejected'
);
select throws_ok(
  $$ insert into public.goals (calorie_target) values (799) $$,
  '23514', null, 'calorie target below 800 is rejected'
);

-- Client-supplied timestamps are ignored
select lives_ok(
  $$ insert into public.profiles (weight_kg, height_cm, sex, birth_year, activity_level, goal_type, created_at)
     values (60, 160, 'female', 1995, 'light', 'gain', '2000-01-01') $$,
  'B inserts own profile with a fake created_at'
);
select lives_ok(
  $$ insert into public.goals (calorie_target, updated_at) values (2000, '2000-01-01') $$,
  'B inserts own goals with a fake updated_at'
);

-- ------------------------------------------------------------ back to A
set local request.jwt.claims to '{"sub":"00000000-0000-4000-b000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ delete from public.profiles $$,
  '42501', null, 'owners cannot delete rows either (removed only by account deletion cascade)'
);
select throws_ok(
  $$ update public.profiles set user_id = '00000000-0000-4000-b000-00000000000b' $$,
  '42501', null, 'A cannot move its row to another user (WITH CHECK)'
);

-- ------------------------------------------------------------ verify as superuser
reset role;
select is(
  (select weight_kg from public.profiles where user_id = '00000000-0000-4000-b000-00000000000a'),
  70.0::numeric(4, 1),
  'ACC-13: B''s update did not change A''s profile'
);
select is(
  (select calorie_target from public.goals where user_id = '00000000-0000-4000-b000-00000000000a'),
  1800::smallint,
  'GOAL-13: B''s update did not change A''s goals'
);
select is(
  (select log_reminder_enabled from public.user_settings where user_id = '00000000-0000-4000-b000-00000000000a'),
  false,
  'REM-10: B''s update did not change A''s settings'
);
select ok(
  (select created_at > '2020-01-01' from public.profiles where user_id = '00000000-0000-4000-b000-00000000000b'),
  'created_at is server-assigned'
);
select ok(
  (select updated_at > '2020-01-01' from public.goals where user_id = '00000000-0000-4000-b000-00000000000b'),
  'updated_at is server-assigned on insert'
);

-- ------------------------------------------------------------ anon
set local role anon;
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select * from public.goals $$, '42501', null, 'anon cannot read goals');
select throws_ok($$ select * from public.user_settings $$, '42501', null, 'anon cannot read settings');
select throws_ok(
  $$ insert into public.user_settings default values $$, '42501', null, 'anon cannot write'
);

select * from finish();
rollback;
