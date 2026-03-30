"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventAction, type ActionState } from "@/app/actions";
import { TEST_USERS } from "@/lib/test-users";

const initialState: ActionState = {
  ok: false,
  message: "",
};

function nextDateInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

type CreateEventFormProps = {
  defaultOrganizerName: string;
};

export function CreateEventForm({ defaultOrganizerName }: CreateEventFormProps) {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
  const router = useRouter();
  const inviteeOptions = useMemo(
    () => TEST_USERS.filter((user) => user !== defaultOrganizerName),
    [defaultOrganizerName],
  );
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>(
    inviteeOptions.slice(0, 3),
  );

  useEffect(() => {
    if (state.ok && state.eventId) {
      router.push(`/events/${state.eventId}`);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-emerald-100 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-emerald-700">Create a new session</h2>
      <input type="hidden" name="groupName" value="Friends" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Event title
          <input
            name="title"
            required
            defaultValue="After-work pickleball"
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Sport
          <select name="sport" defaultValue="pickleball" className="rounded-md border border-zinc-300 px-3 py-2.5">
            <option value="pickleball">Pickleball</option>
            <option value="tennis">Tennis</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Organizer name
          <input
            name="organizerName"
            required
            defaultValue={defaultOrganizerName}
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Preferred court area
          <input name="venueArea" required defaultValue="South Bay courts" className="rounded-md border border-zinc-300 px-3 py-2.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input name="dateIso" type="date" required defaultValue={nextDateInputValue()} className="rounded-md border border-zinc-300 px-3 py-2.5" />
        </label>
        <label className="grid gap-1 text-sm">
          Target players
          <input
            name="targetPlayers"
            type="number"
            min={2}
            max={24}
            required
            defaultValue={4}
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Invitees (select one or more)
        <input type="hidden" name="inviteesRaw" value={selectedInvitees.join(", ")} />
        <select
          multiple
          value={selectedInvitees}
          onChange={(event) => {
            const values = Array.from(event.currentTarget.selectedOptions).map(
              (option) => option.value,
            );
            setSelectedInvitees(values);
          }}
          className="min-h-44 rounded-md border border-zinc-300 px-3 py-2.5"
        >
          {inviteeOptions.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">Hold Cmd/Ctrl to pick multiple users.</p>
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-fit"
      >
        {pending ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
