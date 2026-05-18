-- Scripture Memorizer Database Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. APPROVED USERS (invite list)
-- ============================================================
create table if not exists approved_users (
  email        text primary key,
  approved_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now()
);

-- Only authenticated users can read the approved list
-- Only the approver can delete their own entries (admin manages via app)
alter table approved_users enable row level security;

create policy "Approved users readable by authenticated"
  on approved_users for select
  to authenticated
  using (true);

create policy "Approved users insertable by authenticated"
  on approved_users for insert
  to authenticated
  with check (true);

create policy "Approved users deletable by approver"
  on approved_users for delete
  to authenticated
  using (true);

-- ============================================================
-- 2. USER DATA (private per-user scripture data)
-- ============================================================
create table if not exists user_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}',
  updated_at  timestamptz default now()
);

alter table user_data enable row level security;

-- Users can only read/write their OWN data
create policy "Users can read own data"
  on user_data for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on user_data for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on user_data for update
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 3. SHARED SCRIPTURES (community-visible)
-- ============================================================
create table if not exists shared_scriptures (
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
  shared_by_user_id   uuid references auth.users(id) on delete set null,
  created_at          timestamptz default now()
);

alter table shared_scriptures enable row level security;

-- All approved/authenticated users can read shared scriptures
create policy "Shared scriptures readable by authenticated"
  on shared_scriptures for select
  to authenticated
  using (true);

-- Any authenticated user can share
create policy "Authenticated users can share"
  on shared_scriptures for insert
  to authenticated
  with check (auth.uid() = shared_by_user_id);

-- Only the person who shared can delete their own
create policy "Users can delete own shared scriptures"
  on shared_scriptures for delete
  to authenticated
  using (auth.uid() = shared_by_user_id);

-- ============================================================
-- 4. SEED: Add yourself as the first approved user
-- Replace with your actual Google email address
-- ============================================================
-- insert into approved_users (email) values ('your-email@gmail.com');
