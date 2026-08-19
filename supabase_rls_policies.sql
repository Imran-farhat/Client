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
-- 4. MEMBERS TABLE POLICIES & FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function to safely generate the next sequential unique member ID for any district
create or replace function public.get_next_member_id(p_district text)
returns text
language plpgsql
security definer
as $$
declare
  v_code text;
  v_year text;
  v_max_num int;
  v_new_id text;
begin
  v_year := to_char(now(), 'YYYY');
  
  case p_district
    when 'அரியலூர்' then v_code := 'ARI';
    when 'செங்கல்பட்டு' then v_code := 'CGL';
    when 'சென்னை' then v_code := 'CHN';
    when 'கோயம்புத்தூர்' then v_code := 'CBE';
    when 'கடலூர்' then v_code := 'CDL';
    when 'தர்மபுரி' then v_code := 'DHR';
    when 'திண்டுக்கல்' then v_code := 'DKL';
    when 'ஈரோடு' then v_code := 'ERD';
    when 'கள்ளக்குறிச்சி' then v_code := 'KLK';
    when 'கல்லக்குறிச்சி' then v_code := 'KLK';
    when 'காஞ்சிபுரம்' then v_code := 'KPM';
    when 'காரைக்கால்' then v_code := 'KKL';
    when 'கன்னியாகுமரி' then v_code := 'KKI';
    when 'கரூர்' then v_code := 'KRR';
    when 'கிருஷ்ணகிரி' then v_code := 'KGI';
    when 'மதுரை' then v_code := 'MDU';
    when 'மயிலாடுதுறை' then v_code := 'MLD';
    when 'நாகப்பட்டினம்' then v_code := 'NGP';
    when 'நாமக்கல்' then v_code := 'NMK';
    when 'நீலகிரி' then v_code := 'NLG';
    when 'பெரம்பலூர்' then v_code := 'PRM';
    when 'புதுக்கோட்டை' then v_code := 'PDK';
    when 'புதுச்சேரி' then v_code := 'PDY';
    when 'ராமநாதபுரம்' then v_code := 'RMD';
    when 'ராணிப்பேட்டை' then v_code := 'RPT';
    when 'சேலம்' then v_code := 'SLM';
    when 'சிவகங்கை' then v_code := 'SVG';
    when 'தென்காசி' then v_code := 'TSI';
    when 'தஞ்சாவூர்' then v_code := 'TNJ';
    when 'தேனி' then v_code := 'THN';
    when 'திருச்சிராப்பள்ளி' then v_code := 'TRY';
    when 'திருநெல்வேலி' then v_code := 'TNV';
    when 'திருப்பத்தூர்' then v_code := 'TPT';
    when 'திருப்பூர்' then v_code := 'TPR';
    when 'திருவள்ளூர்' then v_code := 'TLR';
    when 'திருவண்ணாமலை' then v_code := 'TVM';
    when 'திருவாரூர்' then v_code := 'TVR';
    when 'தூத்துக்குடி' then v_code := 'TUT';
    when 'வேலூர்' then v_code := 'VLR';
    when 'விழுப்புரம்' then v_code := 'VPM';
    when 'விருதுநகர்' then v_code := 'VNR';
    else v_code := 'OTH';
  end case;

  -- Find highest sequence number currently in members for this district code and year
  select coalesce(max(
    substring(member_id from 'TIWTN-[0-9]+-[A-Z]+-([0-9]+)')::int
  ), 0) + 1
  into v_max_num
  from public.members
  where member_id like 'TIWTN-' || v_year || '-' || v_code || '-%';

  v_new_id := 'TIWTN-' || v_year || '-' || v_code || '-' || lpad(v_max_num::text, 3, '0');
  
  return v_new_id;
end;
$$;

grant execute on function public.get_next_member_id(text) to authenticated, anon;

-- Members Insert: Authenticated users can register
create policy "members_insert"
on public.members for insert
to authenticated
with check (
  auth.uid() = user_id
  or
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Members Select: Publicly viewable for ID card verification, duplicate checking & uniqueness
create policy "members_select"
on public.members for select
using (true);

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
