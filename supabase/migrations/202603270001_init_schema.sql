create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  timezone text not null default 'America/Los_Angeles',
  preferred_sports text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.friend_groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.friend_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  unique(group_id, user_id)
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  sport text not null check (sport in ('pickleball', 'tennis')),
  created_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references public.users(id) on delete cascade,
  group_id uuid references public.friend_groups(id) on delete set null,
  title text not null,
  sport text not null check (sport in ('pickleball', 'tennis')),
  venue_area text not null,
  date_iso date not null,
  target_players integer not null check (target_players between 2 and 24),
  invite_token text not null unique,
  status text not null check (status in ('draft', 'polling', 'finalized')) default 'polling',
  finalized_time_block_id uuid,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.event_time_blocks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  label text not null
);

create table if not exists public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invitee_user_id uuid references public.users(id) on delete set null,
  invitee_name text not null,
  invitee_email text,
  invite_token text not null,
  response_status text not null check (response_status in ('pending', 'responded')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.availability_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_name text not null,
  note text not null default '',
  submitted_at timestamptz not null default now()
);

create table if not exists public.availability_choices (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.availability_responses(id) on delete cascade,
  time_block_id uuid not null references public.event_time_blocks(id) on delete cascade,
  confidence text not null check (confidence in ('yes', 'maybe', 'no'))
);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('invite', 'finalized')),
  recipient text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.events
  add constraint fk_events_finalized_time_block
  foreign key (finalized_time_block_id)
  references public.event_time_blocks(id)
  on delete set null;

alter table public.users enable row level security;
alter table public.friend_groups enable row level security;
alter table public.friend_group_members enable row level security;
alter table public.events enable row level security;
alter table public.event_time_blocks enable row level security;
alter table public.event_invites enable row level security;
alter table public.availability_responses enable row level security;
alter table public.availability_choices enable row level security;
alter table public.notification_log enable row level security;
alter table public.venues enable row level security;

create policy "users can read own user row"
on public.users
for select
using (auth.uid() = auth_user_id);

create policy "users can insert own user row"
on public.users
for insert
with check (auth.uid() = auth_user_id);

create policy "group owners can manage groups"
on public.friend_groups
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = owner_user_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = owner_user_id and u.auth_user_id = auth.uid()
  )
);

create policy "group members can read memberships"
on public.friend_group_members
for select
using (
  exists (
    select 1
    from public.friend_group_members gm
    join public.users u on u.id = gm.user_id
    where gm.group_id = friend_group_members.group_id
      and u.auth_user_id = auth.uid()
  )
);

create policy "organizer and invitees can read events"
on public.events
for select
using (
  exists (
    select 1 from public.users u
    where u.id = organizer_user_id and u.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.event_invites ei
    where ei.event_id = events.id
      and ei.invitee_email = auth.email()
  )
);

create policy "organizer can manage events"
on public.events
for all
using (
  exists (
    select 1 from public.users u
    where u.id = organizer_user_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = organizer_user_id and u.auth_user_id = auth.uid()
  )
);

create policy "event participants can read time blocks"
on public.event_time_blocks
for select
using (
  exists (
    select 1
    from public.events e
    where e.id = event_time_blocks.event_id
  )
);

create policy "organizer can manage time blocks"
on public.event_time_blocks
for all
using (
  exists (
    select 1
    from public.events e
    join public.users u on u.id = e.organizer_user_id
    where e.id = event_time_blocks.event_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.events e
    join public.users u on u.id = e.organizer_user_id
    where e.id = event_time_blocks.event_id and u.auth_user_id = auth.uid()
  )
);

create policy "participants can read invites by token"
on public.event_invites
for select
using (true);

create policy "organizer can manage invites"
on public.event_invites
for all
using (
  exists (
    select 1
    from public.events e
    join public.users u on u.id = e.organizer_user_id
    where e.id = event_invites.event_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.events e
    join public.users u on u.id = e.organizer_user_id
    where e.id = event_invites.event_id and u.auth_user_id = auth.uid()
  )
);

create policy "participants can submit availability"
on public.availability_responses
for insert
with check (true);

create policy "participants can read availability"
on public.availability_responses
for select
using (true);

create policy "participants can submit choices"
on public.availability_choices
for insert
with check (true);

create policy "participants can read choices"
on public.availability_choices
for select
using (true);

create policy "participants can read notification log"
on public.notification_log
for select
using (true);

create policy "organizer can insert notification log"
on public.notification_log
for insert
with check (
  exists (
    select 1
    from public.events e
    join public.users u on u.id = e.organizer_user_id
    where e.id = notification_log.event_id and u.auth_user_id = auth.uid()
  )
);

create policy "users can manage own venues"
on public.venues
for all
using (
  exists (
    select 1 from public.users u
    where u.id = created_by_user_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = created_by_user_id and u.auth_user_id = auth.uid()
  )
);
