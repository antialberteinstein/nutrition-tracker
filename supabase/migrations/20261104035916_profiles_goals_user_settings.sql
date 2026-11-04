-- Issue #9: profiles, goals, user_settings (Account.md §5, Goals.md §5, Reminders.md §5; ADR-003).
-- Every row belongs to exactly one user; RLS restricts all access to the owner.

-- Shared trigger: server-assigned updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weight_kg numeric(4, 1) not null check (weight_kg between 20.0 and 300.0),
  height_cm smallint not null check (height_cm between 100 and 250),
  sex text not null check (sex in ('male', 'female')),
  birth_year smallint not null,
  activity_level text not null
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type text not null check (goal_type in ('lose', 'maintain', 'gain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Age 13–100 depends on the current year, so it cannot be a CHECK constraint.
create or replace function public.check_profile_age()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  age int := extract(year from now())::int - new.birth_year;
begin
  if age < 13 or age > 100 then
    raise exception 'birth_year % gives age %, must be 13–100', new.birth_year, age
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_check_age
  before insert or update of birth_year on public.profiles
  for each row execute function public.check_profile_age();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------- goals
-- null target = use the suggested value computed on the client from profiles.
create table public.goals (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  calorie_adjustment smallint check (calorie_adjustment between -1500 and 1500),
  calorie_target smallint check (calorie_target between 800 and 6000),
  protein_target_g smallint check (protein_target_g between 10 and 400),
  sodium_target_mg smallint check (sodium_target_mg between 0 and 6000),
  sugar_target_g smallint check (sugar_target_g between 0 and 300),
  updated_at timestamptz not null default now()
);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------- user_settings
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  log_reminder_enabled boolean not null default false,
  log_reminder_time time not null default '20:00'
    check (extract(minute from log_reminder_time)::int % 5 = 0
           and extract(second from log_reminder_time) = 0),
  workout_enabled boolean not null default false,
  workout_digest_time time not null default '06:00'
    check (extract(minute from workout_digest_time)::int % 5 = 0
           and extract(second from workout_digest_time) = 0),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles: owner can select" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles: owner can insert" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles: owner can update" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "goals: owner can select" on public.goals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals: owner can insert" on public.goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals: owner can update" on public.goals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_settings: owner can select" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_settings: owner can insert" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_settings: owner can update" on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No delete policies: rows are removed only by the auth.users cascade (account deletion, #21).
