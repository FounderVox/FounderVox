-- Add smartified_at column to track when a note was smartified
-- This allows us to prevent re-smartifying unless the note was edited

alter table public.notes 
add column if not exists smartified_at timestamptz;

-- Create index for smartified queries
create index if not exists notes_smartified_at_idx on public.notes (user_id, smartified_at desc);

-- Add comment
comment on column public.notes.smartified_at is 'Timestamp when note was last smartified. Used to prevent re-smartifying unless note was edited.';

