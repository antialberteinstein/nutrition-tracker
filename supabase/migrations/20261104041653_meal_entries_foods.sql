-- Issue #15: meal_entries, foods, log_meal, suggest_foods (MealLog.md §4–5; ADR-003, ADR-004, ADR-005).
create extension if not exists unaccent with schema extensions;

-- Single source of truth for "tên chuẩn hoá": NFC, drop Vietnamese diacritics (đ→d),
-- lower case, trim, collapse whitespace. src/domain/food-name.ts mirrors it on the client.
create or replace function public.normalize_food_name(p_name text)
returns text
language sql
stable
set search_path = ''
as $$
  select regexp_replace(lower(extensions.unaccent(normalize(btrim(p_name), NFC))), '\s+', ' ', 'g');
$$;

-- Display name: trim + collapse whitespace, case and diacritics kept.
create or replace function public.clean_food_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(btrim(p_name), '\s+', ' ', 'g');
$$;

-- ------------------------------------------------------------ meal_entries
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(), -- client-generated for idempotent retries
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_on date not null,
  name text not null check (char_length(name) between 1 and 100 and name = public.clean_food_name(name)),
  calories_kcal smallint not null check (calories_kcal between 0 and 5000),
  protein_g numeric(4, 1) not null check (protein_g between 0 and 500),
  sodium_mg integer not null check (sodium_mg between 0 and 20000),
  sugar_g numeric(4, 1) not null check (sugar_g between 0 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_entries_user_day on public.meal_entries (user_id, eaten_on, created_at);

-- ADR-005: the server cannot know the device time zone, so it only blocks dates beyond UTC today + 1.
create or replace function public.check_eaten_on()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.eaten_on > (now() at time zone 'utc')::date + 1 then
    raise exception 'eaten_on % is in the future', new.eaten_on using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger meal_entries_check_eaten_on
  before insert or update of eaten_on on public.meal_entries
  for each row execute function public.check_eaten_on();
create trigger meal_entries_keep_created_at
  before insert or update on public.meal_entries
  for each row execute function public.keep_created_at();
create trigger meal_entries_set_updated_at
  before insert or update on public.meal_entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------- foods
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  name_normalized text not null,
  calories_kcal smallint not null check (calories_kcal between 0 and 5000),
  protein_g numeric(4, 1) not null check (protein_g between 0 and 500),
  sodium_mg integer not null check (sodium_mg between 0 and 20000),
  sugar_g numeric(4, 1) not null check (sugar_g between 0 and 500),
  last_used_at timestamptz not null default now(),
  use_count integer not null default 1 check (use_count >= 1),
  unique (user_id, name_normalized)
);

create or replace function public.set_food_name_normalized()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := public.clean_food_name(new.name);
  new.name_normalized := public.normalize_food_name(new.name);
  return new;
end;
$$;

create trigger foods_set_name_normalized
  before insert or update of name on public.foods
  for each row execute function public.set_food_name_normalized();

-- --------------------------------------------------------------------- RLS
alter table public.meal_entries enable row level security;
alter table public.foods enable row level security;

create policy "meal_entries: owner can select" on public.meal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "meal_entries: owner can insert" on public.meal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meal_entries: owner can update" on public.meal_entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "meal_entries: owner can delete" on public.meal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "foods: owner can select" on public.foods
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "foods: owner can insert" on public.foods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "foods: owner can update" on public.foods
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "foods: owner can delete" on public.foods
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.meal_entries, public.foods from anon, authenticated;
grant select, insert, update, delete on public.meal_entries, public.foods to authenticated;

-- ----------------------------------------------------------------- log_meal
-- Saves a meal (insert, or update when the id already exists) and upserts the saved food in one
-- transaction. Re-sending the exact same request (same id and values) returns the stored row and
-- does not count as another use (MEAL-17).
create or replace function public.log_meal(
  p_id uuid,
  p_eaten_on date,
  p_name text,
  p_calories_kcal integer,
  p_protein_g numeric,
  p_sodium_mg integer,
  p_sugar_g numeric
)
returns public.meal_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text := public.clean_food_name(p_name);
  v_row public.meal_entries;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_row from public.meal_entries where id = p_id;

  if found
     and (v_row.eaten_on, v_row.name, v_row.calories_kcal, v_row.protein_g, v_row.sodium_mg, v_row.sugar_g)
         is not distinct from (p_eaten_on, v_name, p_calories_kcal::smallint, p_protein_g, p_sodium_mg, p_sugar_g)
  then
    return v_row;
  end if;

  if found then
    update public.meal_entries
       set eaten_on = p_eaten_on, name = v_name, calories_kcal = p_calories_kcal,
           protein_g = p_protein_g, sodium_mg = p_sodium_mg, sugar_g = p_sugar_g
     where id = p_id
    returning * into v_row;
  else
    insert into public.meal_entries (id, eaten_on, name, calories_kcal, protein_g, sodium_mg, sugar_g)
    values (p_id, p_eaten_on, v_name, p_calories_kcal, p_protein_g, p_sodium_mg, p_sugar_g)
    returning * into v_row;
  end if;

  insert into public.foods (name, name_normalized, calories_kcal, protein_g, sodium_mg, sugar_g)
  values (v_name, public.normalize_food_name(v_name), p_calories_kcal, p_protein_g, p_sodium_mg, p_sugar_g)
  on conflict (user_id, name_normalized) do update
     set name = excluded.name,
         calories_kcal = excluded.calories_kcal,
         protein_g = excluded.protein_g,
         sodium_mg = excluded.sodium_mg,
         sugar_g = excluded.sugar_g,
         last_used_at = now(),
         use_count = public.foods.use_count + 1;

  return v_row;
end;
$$;

-- ------------------------------------------------------------ suggest_foods
-- Up to 5 saved foods matching the typed text (diacritic- and case-insensitive):
-- "starts with" before "contains", then most recently used first (MEAL-03, MEAL-04, MEAL-14).
create or replace function public.suggest_foods(p_query text)
returns setof public.foods
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select replace(replace(replace(public.normalize_food_name(p_query), '\', '\\'), '%', '\%'), '_', '\_') as pattern
  )
  select f.*
    from public.foods f, q
   where q.pattern <> ''
     and f.name_normalized like '%' || q.pattern || '%'
   order by (f.name_normalized like q.pattern || '%') desc, f.last_used_at desc
   limit 5;
$$;

revoke all on function public.log_meal(uuid, date, text, integer, numeric, integer, numeric) from public, anon;
grant execute on function public.log_meal(uuid, date, text, integer, numeric, integer, numeric) to authenticated;
revoke all on function public.suggest_foods(text) from public, anon;
grant execute on function public.suggest_foods(text) to authenticated;
