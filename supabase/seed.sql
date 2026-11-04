-- LOCAL ONLY seed (supabase db reset). Never run against the cloud project (ADR-011).
-- Two confirmed test accounts for E2E and RLS checks (docs/testing/test-plan.md §3).
-- Password for both: E2e-local-only-1 (synthetic, local stack only).
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-4000-a000-00000000000a'::uuid, 'e2e-a@test.local'),
      ('00000000-0000-4000-a000-00000000000b'::uuid, 'e2e-b@test.local')
    ) as t(id, email)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('E2e-local-only-1', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), u.id, u.id::text,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    ) on conflict do nothing;
  end loop;
end $$;
