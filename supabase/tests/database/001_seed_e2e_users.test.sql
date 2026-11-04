-- supabase/seed.sql must create the two confirmed E2E accounts (issue #8).
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

select results_eq(
  $$ select email::text from auth.users
     where email in ('e2e-a@test.local', 'e2e-b@test.local') and email_confirmed_at is not null
     order by email $$,
  $$ values ('e2e-a@test.local'), ('e2e-b@test.local') $$,
  'both E2E accounts exist and are email-confirmed'
);

select is(
  (select count(*)::int from auth.identities i
     join auth.users u on u.id = i.user_id
    where u.email in ('e2e-a@test.local', 'e2e-b@test.local') and i.provider = 'email'),
  2,
  'each E2E account has an email identity (needed for password sign-in)'
);

select is(
  (select count(*)::int from auth.users
    where email in ('e2e-a@test.local', 'e2e-b@test.local')
      and encrypted_password = extensions.crypt('E2e-local-only-1', encrypted_password)),
  2,
  'both E2E accounts use the documented local password'
);

select is(
  (select count(*)::int from auth.users
    where email in ('e2e-a@test.local', 'e2e-b@test.local')
      and confirmation_token is not null and recovery_token is not null
      and email_change is not null and email_change_token_new is not null),
  2,
  'token columns are non-null (GoTrue password sign-in fails on NULLs)'
);

select * from finish();
rollback;
