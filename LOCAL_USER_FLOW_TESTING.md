# Local User Flow Testing Guide (No Supabase)

This guide helps you run the app locally and click through all core MVP flows before wiring real Supabase persistence.

## Prerequisites

- Node.js 20+ installed
- npm installed

## 1) Install and run locally

From the `ServeSide` folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Notes:
- You can leave Supabase env vars blank for local flow testing.
- Data is currently in-memory, so restarting the dev server resets events/responses.

## 2) Understand the local data behavior

- The app starts with one seed event so you can test immediately.
- Any event you create is stored in memory only.
- Refreshing the browser keeps data while server is running.
- Restarting `npm run dev` clears all local data.

## 3) Test Flow A: Organizer creates an event

1. Go to `http://localhost:3000`.
2. In "Create a new session", enter:
   - title, sport, organizer, group, venue, date, target players
   - invitees from the dropdown (select one or more test users)
3. Click **Create event**.
4. Verify you are redirected to `/events/[eventId]`.
5. Verify:
   - event details render
   - invite link appears (`/join/[token]`)
   - invite progress shows invitees as pending

## 4) Test Flow B: Invitee submits availability

1. Copy the invite link from the organizer event page.
2. Open it in a new tab (or private window).
3. Enter player name (must match an invitee name if you want progress to update, e.g. `Alex`).
4. For each time block choose `yes`, `maybe`, or `no`.
5. Add optional note and click **Save availability**.
6. Repeat with 2+ additional invitees (`Sam`, `Jordan`) so recommendation quality improves.

Expected:
- success message appears after submit
- organizer page shows new rows in availability matrix
- invite progress changes to responded for matching names

## 5) Test Flow C: Best-slot recommendation

1. Return to organizer event page `/events/[eventId]`.
2. Check the "Availability recommendation" section.
3. Verify it shows:
   - best slot label
   - yes/maybe counts

Tip:
- If recommendation looks wrong, verify invitee submissions had mixed choices.

## 6) Test Flow D: Finalize and notify

1. On organizer event page, use **Finalize event**.
2. Keep default recommended slot or select another slot.
3. Click **Finalize and notify group**.

Expected:
- event shows finalized status/time
- notification feed includes finalized notifications for invitees

## 7) Test Flow E: Metrics endpoint

In a separate terminal:

```bash
curl http://localhost:3000/api/metrics
```

Expected JSON includes:
- `totalEvents`
- `finalizedEvents`
- `averageResponseRate`
- `responseRateByEvent`

## 8) Test Flow F: Auto-finalize cron endpoint (optional)

Without auth secret configured:

```bash
curl -X POST http://localhost:3000/api/cron/finalize-pending
```

With `CRON_SECRET` set in `.env.local`:

```bash
curl -X POST http://localhost:3000/api/cron/finalize-pending \
  -H "Authorization: Bearer YOUR_SECRET"
```

Expected:
- response includes `finalizedCount`
- qualifying polling events finalize automatically

## 9) Quick troubleshooting

- Port in use:
  - run `npm run dev -- --port 3001` and open `http://localhost:3001`
- No invite progress update:
  - submit availability with player name matching invited names exactly
- Data disappeared:
  - expected after dev server restart (in-memory mode)

## 10) Local acceptance checklist

- [ ] Can create event from `/`
- [ ] Invite link opens `/join/[token]`
- [ ] 3 players can submit availability
- [ ] Matrix updates with each response
- [ ] Recommendation appears on organizer page
- [ ] Finalize flow updates status and selected time
- [ ] Notification feed shows invite + finalized entries
- [ ] `/api/metrics` returns KPI JSON
