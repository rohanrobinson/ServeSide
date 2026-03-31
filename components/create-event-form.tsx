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
  const [selectedSport, setSelectedSport] = useState<"pickleball" | "tennis">("pickleball");
  const inviteeOptions = useMemo(
    () => TEST_USERS.filter((user) => user !== defaultOrganizerName),
    [defaultOrganizerName],
  );
  const [inviteeSelections, setInviteeSelections] = useState<string[]>([
    inviteeOptions[0] ?? "",
    inviteeOptions[1] ?? "",
    inviteeOptions[2] ?? "",
  ]);
  const selectedInvitees = useMemo(
    () =>
      inviteeSelections.filter(
        (value, index, array) => value && array.indexOf(value) === index,
      ),
    [inviteeSelections],
  );
  const courtOptions = useMemo(() => {
    if (selectedSport === "tennis") {
      return [
        "Grant Park Outdoor Courts",
        "Maggie Daley Park Outdoor Courts",
        "Waveland Lincoln Park Outdoor Courts",
      ];
    }

    return [
      "Big City Pickle Indoor West Loop",
      "SPF Indoor Lincoln park",
    ];
  }, [selectedSport]);

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
            defaultValue="Fun Session with Friends!"
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Sport
          <select
            name="sport"
            value={selectedSport}
            onChange={(event) =>
              setSelectedSport(event.target.value as "pickleball" | "tennis")
            }
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          >
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
            key={selectedSport}
            name="venueArea"
            required
            defaultValue={courtOptions[0]}
            className="rounded-md border border-zinc-300 px-3 py-2.5"
          >
            {courtOptions.map((court) => (
              <option key={court} value={court}>
                {court}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input name="dateIso" type="date" required defaultValue={nextDateInputValue()} className="rounded-md border border-zinc-300 px-3 py-2.5" />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        Players (pick up to 3)
        <input type="hidden" name="inviteesRaw" value={selectedInvitees.join(", ")} />
        <div className="grid gap-2 rounded-md border border-zinc-300 p-3">
          {[0, 1, 2].map((slotIndex) => (
            <label key={slotIndex} className="grid gap-1 text-sm">
              Player {slotIndex + 1}
              <select
                value={inviteeSelections[slotIndex] ?? ""}
                onChange={(event) =>
                  setInviteeSelections((current) =>
                    current.map((value, index) =>
                      index === slotIndex ? event.target.value : value,
                    ),
                  )
                }
                className="rounded-md border border-zinc-300 px-3 py-2.5"
              >
                <option value="">None</option>
                {inviteeOptions.map((user) => {
                  const selectedByOtherSlot = inviteeSelections.some(
                    (value, index) => index !== slotIndex && value === user,
                  );

                  return (
                    <option
                      key={user}
                      value={user}
                      disabled={selectedByOtherSlot}
                    >
                      {user}
                    </option>
                  );
                })}
              </select>
            </label>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {selectedInvitees.length}/3 players selected
        </p>
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-auto items-center justify-center self-start rounded-md bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
