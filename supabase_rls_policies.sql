-- ==============================================================================
-- PRODUCTION SUPABASE SECURITY & RLS POLICIES FOR TIWTN
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all tables
alter table public.members enable row level security;
alter table public.users enable row level security;
alter table public.gallery enable row level security;

-- 2. Drop all old policies
drop policy if exists "members_insert_policy" on public.members;
drop policy if exists "members_select_policy" on public.members;
drop policy if exists "members_update_policy" on public.members;
drop policy if exists "members_delete_policy" on public.members;
drop policy if exists "members_insert" on public.members;
drop policy if exists "members_select" on public.members;
drop policy if exists "members_update" on public.members;
drop policy if exists "members_delete" on public.members;

drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;

drop policy if exists "gallery_select" on public.gallery;
drop policy if exists "gallery_insert" on public.gallery;
drop policy if exists "gallery_delete" on public.gallery;

-- ------------------------------------------------------------------------------
-- 3. USERS TABLE POLICIES & TRIGGER (PREVENT PRIVILEGE ESCALATION)
-- ------------------------------------------------------------------------------

-- Trigger function: Prevents non-admins from changing their role to 'admin'
create or replace function public.protect_user_role()
returns trigger as $$
begin
  if (new.role is distinct from old.role) and 
     coalesce((select role from public.users where id = auth.uid()), 'member') <> 'admin' then
    raise exception 'Only administrators can modify user roles';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_user_role on public.users;
create trigger tr_protect_user_role
before update on public.users
for each row execute function public.protect_user_role();

-- Users: Anyone authenticated can read user profiles (needed for admin & profile)
create policy "users_select"
on public.users for select
using (true);

-- Users: Authenticated users can insert their own record on signup
create policy "users_insert"
on public.users for insert
to authenticated
with check (auth.uid() = id);

-- Users: Users can update their own record, or admins can update any record
create policy "users_update"
on public.users for update
to authenticated
using (
  auth.uid() = id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Users: Delete open to admins only
create policy "users_delete"
on public.users for delete
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- ------------------------------------------------------------------------------
-- 4. MEMBERS TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Members Insert: Authenticated users can register
create policy "members_insert"
on public.members for insert
to authenticated
with check (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Members Select:
-- 1. Owner can view their own application/membership
-- 2. Admin can view all applications
-- 3. Approved members can be verified
create policy "members_select"
on public.members for select
using (
  auth.uid() = user_id
  or
  status = 'approved'
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Members Update: Owner or Admin
create policy "members_update"
on public.members for update
to authenticated
using (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Members Delete: Owner or Admin
create policy "members_delete"
on public.members for delete
to authenticated
using (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- ------------------------------------------------------------------------------
-- 5. GALLERY TABLE POLICIES
-- ------------------------------------------------------------------------------

-- Gallery Select: Public read
create policy "gallery_select"
on public.gallery for select
using (true);

-- Gallery Insert: Authenticated admins can add images
create policy "gallery_insert"
on public.gallery for insert
to authenticated
with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Gallery Delete: Admins only
create policy "gallery_delete"
on public.gallery for delete
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);
