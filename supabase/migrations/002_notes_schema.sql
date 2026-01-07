-- ============================================
-- FOUNDERVOX NOTES SCHEMA
-- ============================================
-- Run this script after 001_initial_schema.sql
-- This creates the notes table and related functionality
-- ============================================

-- ============================================
-- STEP 1: CREATE NOTES TABLE
-- ============================================
-- This table stores voice notes and their metadata

create table if not exists public.notes (
  -- Primary key
  id uuid default gen_random_uuid() primary key,

  -- User reference
  user_id uuid references auth.users on delete cascade not null,

  -- Note content
  title text not null,
  content text,
  formatted_content text,
  raw_transcript text,

  -- Template/type information
  template_type text default 'none',
  template_label text,

  -- Metadata
  duration_seconds integer default 0,
  audio_url text,
  is_starred boolean default false,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_accessed_at timestamptz default now()
);

-- Add comment for documentation
comment on table public.notes is 'Voice notes and recordings for users';

-- ============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.notes enable row level security;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own notes
drop policy if exists "Users can view own notes" on public.notes;
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own notes
drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own notes
drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own notes
drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for user queries
create index if not exists notes_user_id_idx on public.notes (user_id);

-- Index for starred notes
create index if not exists notes_starred_idx on public.notes (user_id, is_starred) where is_starred = true;

-- Index for recent notes (by created_at)
create index if not exists notes_created_at_idx on public.notes (user_id, created_at desc);

-- Index for template filtering
create index if not exists notes_template_idx on public.notes (user_id, template_type);

-- Index for last accessed (for sorting)
create index if not exists notes_last_accessed_idx on public.notes (user_id, last_accessed_at desc);

-- ============================================
-- STEP 5: CREATE UPDATED_AT TRIGGER
-- ============================================

drop trigger if exists handle_notes_updated_at on public.notes;
create trigger handle_notes_updated_at
  before update on public.notes
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- STEP 6: CREATE FUNCTION TO UPDATE LAST_ACCESSED
-- ============================================

create or replace function public.update_note_last_accessed()
returns trigger
language plpgsql
as $$
begin
  new.last_accessed_at = now();
  return new;
end;
$$;

-- Trigger to update last_accessed_at on select (via a view or application logic)
-- Note: PostgreSQL doesn't support triggers on SELECT, so this will be handled
-- in application code when a note is viewed

-- ============================================
-- STEP 7: CREATE FUNCTION TO AUTO-UPDATE RECORDINGS COUNT
-- ============================================

create or replace function public.update_user_recordings_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles
    set recordings_count = recordings_count + 1
    where id = new.user_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.profiles
    set recordings_count = greatest(recordings_count - 1, 0)
    where id = old.user_id;
    return old;
  end if;
  return null;
end;
$$;

-- Create trigger to update recordings count
drop trigger if exists update_recordings_count_on_note_change on public.notes;
create trigger update_recordings_count_on_note_change
  after insert or delete on public.notes
  for each row execute procedure public.update_user_recordings_count();

-- ============================================
-- VERIFICATION QUERIES (Optional)
-- ============================================
-- After running the above, you can verify with:
--
-- SELECT * FROM public.notes;
-- SELECT * FROM information_schema.tables WHERE table_name = 'notes';
-- SELECT * FROM pg_policies WHERE tablename = 'notes';
-- SELECT * FROM pg_indexes WHERE tablename = 'notes';

-- ============================================
-- DONE! Notes table is ready.
-- ============================================

