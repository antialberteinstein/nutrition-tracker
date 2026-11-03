-- ADR-003: every table in schema public must have Row Level Security enabled.
-- Fails with the offending table names so a forgotten `enable row level security` is caught in CI.
begin;
create extension if not exists pgtap with schema extensions;

select plan(1);

select is_empty(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'every table in schema public has row level security enabled (ADR-003)'
);

select * from finish();
rollback;
