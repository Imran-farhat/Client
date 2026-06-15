-- Re-enable RLS with correct policies
alter table public.members enable row level security;
alter table public.users enable row level security;

-- Drop all old policies first
drop policy if exists "members_insert_policy" on public.members;
drop policy if exists "members_select_policy" on public.members;
drop policy if exists "members_update_policy" on public.members;
drop policy if exists "members_delete_policy" on public.members;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;

-- Members: anyone authenticated can insert
create policy "members_insert"
on public.members for insert
to authenticated
with check (true);

-- Members: anyone can select
create policy "members_select"
on public.members for select
using (true);

-- Members: update/delete open to the owner OR admins
create policy "members_update"
on public.members for update
to authenticated
using (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

create policy "members_delete"
on public.members for delete
to authenticated
using (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Users: standard policies
create policy "users_select"
on public.users for select
using (true);

create policy "users_insert"
on public.users for insert
with check (auth.uid() = id);

-- Users: update open to owner OR admins
create policy "users_update"
on public.users for update
using (
  auth.uid() = id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Users: delete open to admins only
create policy "users_delete"
on public.users for delete
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Gallery: anyone can read
alter table public.gallery enable row level security;

create policy "gallery_select"
on public.gallery for select
using (true);

create policy "gallery_insert"
on public.gallery for insert
to authenticated
with check (true);

create policy "gallery_delete"
on public.gallery for delete
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
