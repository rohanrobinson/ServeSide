# ServeSide Planner (Partiful-style sports coordination)

ServeSide Planner is a web-first MVP to coordinate tennis and pickleball runs:
- Organizers create an event and invite friends via share link.
- Players submit availability with yes/maybe/no across time blocks.
- The app recommends the best slot and lets organizer finalize in one click.
- Invite/finalization notifications are tracked in an activity feed.

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Zod validation in Server Actions
- Supabase schema + RLS migrations included under `supabase/`

The app currently uses an in-memory data store for local development speed while keeping a Supabase-ready schema and client scaffold for deployment.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env.local
```

3. Run dev server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Core Routes
- `/` organizer home (create event + view events)
- `/events/[eventId]` organizer event dashboard (matrix, recommendation, finalize)
- `/join/[token]` invitee availability form
- `POST /api/cron/finalize-pending` finalize events with enough responses (optional `CRON_SECRET` auth)
- `GET /api/metrics` basic KPI snapshot for QA

## Supabase Setup (Schema + RLS)

The SQL migration and seed files are ready:
- `supabase/migrations/202603270001_init_schema.sql`
- `supabase/seed/seed.sql`

Apply them with Supabase CLI in your own project:
```bash
supabase db push
```

## QA Checklist
- Create an event from `/`.
- Open invite link and submit availability for at least 3 friends.
- Confirm recommendation appears on organizer dashboard.
- Finalize a slot and verify notification feed entries.
- Check metrics endpoint:
```bash
curl http://localhost:3000/api/metrics
```

## Deploy

### Vercel (recommended)
1. Import `ServeSide` directory as project.
2. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET`
3. Deploy.

### Scheduled auto-finalization
Use Vercel Cron or any scheduler to call:
```bash
curl -X POST https://your-domain.com/api/cron/finalize-pending \
  -H "Authorization: Bearer $CRON_SECRET"
```
