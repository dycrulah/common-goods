-- 0002_customers.sql
-- Phase 4: customer profiles, linked to Supabase Auth users created by
-- Google sign-in. A trigger creates the customers row automatically the
-- moment someone signs in for the first time, so the app never has to
-- do that itself.

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create index customers_auth_user_id_idx on customers (auth_user_id);

alter table customers enable row level security;

-- A customer can only ever see or edit their own row.
create policy "customers can read their own profile"
  on customers for select
  using (auth.uid() = auth_user_id);

create policy "customers can update their own profile"
  on customers for update
  using (auth.uid() = auth_user_id);

-- ──────────────────── auto-provision on first sign-in ──────────────────
-- Runs as the table owner (security definer) so it can insert into
-- customers despite the RLS policies above, which only allow a user to
-- touch their own row — there is no "own row" yet on first sign-in.
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.customers (auth_user_id, name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
