-- ============================================================
-- FIX: Employee Search + Email in Profiles
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add email column to profiles (mirror from auth.users)
alter table public.profiles
  add column if not exists email text;

-- 2. Populate email for existing users from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- 3. Update the new-user trigger to also save email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- 4. Allow authenticated users to search/view other profiles
--    (needed for employee assignment search)
drop policy if exists "Authenticated users can search profiles" on public.profiles;
create policy "Authenticated users can search profiles" on public.profiles
  for select using (auth.role() = 'authenticated');
