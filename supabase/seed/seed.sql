insert into public.users (id, full_name, timezone, preferred_sports)
values
  ('11111111-1111-1111-1111-111111111111', 'Rohan', 'America/Los_Angeles', '{"pickleball","tennis"}'),
  ('22222222-2222-2222-2222-222222222222', 'Alex', 'America/Los_Angeles', '{"tennis"}'),
  ('33333333-3333-3333-3333-333333333333', 'Sam', 'America/Los_Angeles', '{"pickleball"}')
on conflict do nothing;

insert into public.friend_groups (id, owner_user_id, name)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Weekend Racquet Crew')
on conflict do nothing;
