-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/sql

-- approved_users: invite list
create table public.approved_users (
  email        text primary key,
  approved_by  uuid references auth.users(id),
  created_at   timestamptz default now()
);
alter table public.approved_users enable row level security;
create policy "read_approved"   on public.approved_users for select using (auth.role() = 'authenticated');
create policy "insert_approved" on public.approved_users for insert with check (auth.role() = 'authenticated');
create policy "delete_approved" on public.approved_users for delete using (auth.role() = 'authenticated');

-- user_data: private per-user scripture JSON
create table public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.user_data enable row level security;
create policy "own_read"   on public.user_data for select using (auth.uid() = user_id);
create policy "own_insert" on public.user_data for insert with check (auth.uid() = user_id);
create policy "own_update" on public.user_data for update using (auth.uid() = user_id);
create policy "own_delete" on public.user_data for delete using (auth.uid() = user_id);

-- shared_scriptures: community visible to all approved users
create table public.shared_scriptures (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null default 'scripture',
  reference           text not null default '',
  author              text not null default '',
  title               text not null default '',
  text                text not null,
  language            text not null default 'English',
  context             text not null default '',
  url                 text not null default '',
  shared_by_name      text not null,
  shared_by_user_id   uuid references auth.users(id),
  created_at          timestamptz default now()
);
alter table public.shared_scriptures enable row level security;
create policy "auth_read_shared"   on public.shared_scriptures for select using (auth.role() = 'authenticated');
create policy "auth_insert_shared" on public.shared_scriptures for insert with check (auth.uid() = shared_by_user_id);
create policy "own_delete_shared"  on public.shared_scriptures for delete using (auth.uid() = shared_by_user_id);
