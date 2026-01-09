-- Recordings table
create table recordings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  audio_url text,
  duration_seconds integer,
  raw_transcript text,
  cleaned_transcript text,
  processing_status text default 'pending', -- pending, processing, completed, failed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Action items extracted from recordings
create table action_items (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references recordings(id) on delete cascade,
  task text not null,
  assignee text,
  deadline timestamp with time zone,
  priority text check (priority in ('high', 'medium', 'low')),
  status text default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Investor updates
create table investor_updates (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references recordings(id) on delete cascade,
  draft_subject text,
  draft_body text,
  wins jsonb,
  metrics jsonb,
  challenges jsonb,
  asks jsonb,
  status text default 'draft' check (status in ('draft', 'sent')),
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Progress logs
create table progress_logs (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references recordings(id) on delete cascade,
  week_of date not null,
  completed jsonb,
  in_progress jsonb,
  blocked jsonb,
  created_at timestamp with time zone default now()
);

-- Product ideas
create table product_ideas (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references recordings(id) on delete cascade,
  idea text not null,
  category text check (category in ('feature', 'improvement', 'integration', 'pivot', 'experiment', 'new_product')),
  priority text check (priority in ('high', 'medium', 'low')),
  context text,
  votes integer default 0,
  status text default 'idea' check (status in ('idea', 'considering', 'building', 'shipped', 'archived')),
  created_at timestamp with time zone default now()
);

-- Brain dump / meeting notes
create table brain_dump (
  id uuid primary key default uuid_generate_v4(),
  recording_id uuid references recordings(id) on delete cascade,
  content text not null,
  category text check (category in ('meeting', 'thought', 'question', 'concern', 'personal')),
  participants text[], -- for meetings
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index recordings_user_id_idx on recordings(user_id);
create index recordings_created_at_idx on recordings(created_at desc);
create index action_items_status_idx on action_items(status);
create index action_items_recording_id_idx on action_items(recording_id);
create index progress_logs_week_of_idx on progress_logs(week_of desc);
create index product_ideas_status_idx on product_ideas(status);
create index brain_dump_recording_id_idx on brain_dump(recording_id);

-- Row Level Security (RLS)
alter table recordings enable row level security;
alter table action_items enable row level security;
alter table investor_updates enable row level security;
alter table progress_logs enable row level security;
alter table product_ideas enable row level security;
alter table brain_dump enable row level security;

-- RLS Policies
create policy "Users can view their own recordings"
  on recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recordings"
  on recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recordings"
  on recordings for update
  using (auth.uid() = user_id);

-- Similar policies for other tables (they all reference recordings which has user_id)
create policy "Users can view their action items"
  on action_items for select
  using (exists (
    select 1 from recordings
    where recordings.id = action_items.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can insert their action items"
  on action_items for insert
  with check (exists (
    select 1 from recordings
    where recordings.id = action_items.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can update their action items"
  on action_items for update
  using (exists (
    select 1 from recordings
    where recordings.id = action_items.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can delete their action items"
  on action_items for delete
  using (exists (
    select 1 from recordings
    where recordings.id = action_items.recording_id
    and recordings.user_id = auth.uid()
  ));

-- Investor updates policies
create policy "Users can view their investor updates"
  on investor_updates for select
  using (exists (
    select 1 from recordings
    where recordings.id = investor_updates.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can insert their investor updates"
  on investor_updates for insert
  with check (exists (
    select 1 from recordings
    where recordings.id = investor_updates.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can update their investor updates"
  on investor_updates for update
  using (exists (
    select 1 from recordings
    where recordings.id = investor_updates.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can delete their investor updates"
  on investor_updates for delete
  using (exists (
    select 1 from recordings
    where recordings.id = investor_updates.recording_id
    and recordings.user_id = auth.uid()
  ));

-- Progress logs policies
create policy "Users can view their progress logs"
  on progress_logs for select
  using (exists (
    select 1 from recordings
    where recordings.id = progress_logs.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can insert their progress logs"
  on progress_logs for insert
  with check (exists (
    select 1 from recordings
    where recordings.id = progress_logs.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can update their progress logs"
  on progress_logs for update
  using (exists (
    select 1 from recordings
    where recordings.id = progress_logs.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can delete their progress logs"
  on progress_logs for delete
  using (exists (
    select 1 from recordings
    where recordings.id = progress_logs.recording_id
    and recordings.user_id = auth.uid()
  ));

-- Product ideas policies
create policy "Users can view their product ideas"
  on product_ideas for select
  using (exists (
    select 1 from recordings
    where recordings.id = product_ideas.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can insert their product ideas"
  on product_ideas for insert
  with check (exists (
    select 1 from recordings
    where recordings.id = product_ideas.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can update their product ideas"
  on product_ideas for update
  using (exists (
    select 1 from recordings
    where recordings.id = product_ideas.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can delete their product ideas"
  on product_ideas for delete
  using (exists (
    select 1 from recordings
    where recordings.id = product_ideas.recording_id
    and recordings.user_id = auth.uid()
  ));

-- Brain dump policies
create policy "Users can view their brain dumps"
  on brain_dump for select
  using (exists (
    select 1 from recordings
    where recordings.id = brain_dump.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can insert their brain dumps"
  on brain_dump for insert
  with check (exists (
    select 1 from recordings
    where recordings.id = brain_dump.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can update their brain dumps"
  on brain_dump for update
  using (exists (
    select 1 from recordings
    where recordings.id = brain_dump.recording_id
    and recordings.user_id = auth.uid()
  ));

create policy "Users can delete their brain dumps"
  on brain_dump for delete
  using (exists (
    select 1 from recordings
    where recordings.id = brain_dump.recording_id
    and recordings.user_id = auth.uid()
  ));

-- Delete policy for recordings
create policy "Users can delete their own recordings"
  on recordings for delete
  using (auth.uid() = user_id);

-- Triggers for updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_recordings_updated_at
  before update on recordings
  for each row
  execute function update_updated_at_column();

-- Comments for documentation
comment on table recordings is 'Audio recordings uploaded by users for transcription and processing';
comment on table action_items is 'Task items extracted from recordings with deadlines and priorities';
comment on table investor_updates is 'Draft investor update emails generated from recordings';
comment on table progress_logs is 'Weekly progress tracking logs';
comment on table product_ideas is 'Product ideas and feature requests captured from recordings';
comment on table brain_dump is 'Unstructured notes and meeting summaries from recordings';
