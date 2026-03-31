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
  const selectedInviteesSet = useMemo(
    () => new Set(selectedInvitees),
    [selectedInvitees],
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
      <input
        type="hidden"
        name="targetPlayers"
        value={String(Math.max(2, selectedInvitees.length + 1))}
      />
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
          Court
          <select
            name="venueArea"
            required
            defaultValue="Big City Pickle Indoor West Loop"
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          >
            <option value="Big City Pickle Indoor West Loop">
              Big City Pickle Indoor West Loop
            </option>
            <option value="SPF Indoor Lincoln park">SPF Indoor Lincoln park</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input name="dateIso" type="date" required defaultValue={nextDateInputValue()} className="rounded-md border border-zinc-300 px-3 py-2.5" />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Invitees (pick up to 3)
        <input type="hidden" name="inviteesRaw" value={selectedInvitees.join(", ")} />
        <div className="grid gap-2 rounded-md border border-zinc-300 p-3">
          {inviteeOptions.map((user) => {
            const isChecked = selectedInviteesSet.has(user);
            const maxReached = selectedInvitees.length >= 3;
            const shouldDisable = maxReached && !isChecked;

            return (
              <label
                key={user}
                className={`flex items-center gap-2 rounded-md px-2 py-2 ${
                  shouldDisable ? "opacity-45" : "cursor-pointer hover:bg-zinc-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={shouldDisable}
                  onChange={(event) => {
                    setSelectedInvitees((current) => {
                      if (event.target.checked) {
                        if (current.length >= 3) return current;
                        return [...current, user];
                      }
                      return current.filter((entry) => entry !== user);
                    });
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>{user}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500">
          {selectedInvitees.length}/3 selected
        </p>
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
