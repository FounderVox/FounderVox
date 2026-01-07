-- ============================================
-- FOUNDERVOX DATABASE SCHEMA
-- ============================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- Paste this entire file and click "Run"
-- ============================================

-- ============================================
-- STEP 1: CREATE PROFILES TABLE
-- ============================================
-- This table stores user profile data and onboarding information
-- It extends the built-in auth.users table

create table if not exists public.profiles (
  -- Primary key matches auth.users.id
  id uuid references auth.users on delete cascade primary key,

  -- User display information
  display_name text,
  avatar_url text,
  email text,

  -- Onboarding data
  use_cases text[] default '{}',
  onboarding_completed boolean default false,
  onboarding_step integer default 0,

  -- Subscription/usage tracking (for future)
  subscription_tier text default 'free',
  recordings_count integer default 0,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_active_at timestamptz default now(),
  first_login_at timestamptz default null,
  demo_completed boolean default false
);

-- Add comment for documentation
comment on table public.profiles is 'User profiles extending Supabase auth.users with onboarding and usage data';

-- ============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================
-- RLS ensures users can only access their own data

alter table public.profiles enable row level security;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Policy: Users can insert their own profile (for edge cases)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Policy: Users can delete their own profile
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================
-- STEP 4: CREATE AUTOMATIC USER PROFILE FUNCTION
-- ============================================
-- This function automatically creates a profile when a new user signs up

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    email,
    onboarding_completed,
    onboarding_step
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    false,
    0
  );
  return new;
exception
  when others then
    -- Log error but don't fail the signup
    raise warning 'Error creating profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- ============================================
-- STEP 5: CREATE TRIGGER FOR NEW USERS
-- ============================================

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- STEP 6: CREATE UPDATED_AT FUNCTION
-- ============================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- STEP 7: CREATE UPDATED_AT TRIGGER
-- ============================================

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_onboarding_idx on public.profiles (onboarding_completed);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ============================================
-- VERIFICATION QUERIES (Optional - Run to verify)
-- ============================================
-- After running the above, you can verify with:
--
-- SELECT * FROM public.profiles;
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- ============================================
-- DONE! Your database is ready.
-- ============================================
