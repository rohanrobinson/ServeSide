"use client";

import { useActionState } from "react";
import { submitAvailabilityAction, type ActionState } from "@/app/actions";
import type { TimeBlock } from "@/lib/types";

type AvailabilityFormProps = {
  inviteToken: string;
  timeBlocks: TimeBlock[];
  defaultPlayerName: string;
};

const initialState: ActionState = {
  ok: false,
  message: "",
};

export function AvailabilityForm({
  inviteToken,
  timeBlocks,
  defaultPlayerName,
}: AvailabilityFormProps) {
  const boundSubmitAction = submitAvailabilityAction.bind(null, inviteToken);
  const [state, formAction, pending] = useActionState(boundSubmitAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-xl border border-sky-100 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-sky-700">Set your availability</h2>

      <label className="grid gap-1 text-sm">
        Your name
        <input
          name="playerName"
          required
          placeholder="Your name"
          defaultValue={defaultPlayerName}
          className="rounded-md border border-zinc-300 px-3 py-2.5"
        />
      </label>

      <div className="grid gap-3">
        {timeBlocks.map((block) => (
          <div
            key={block.id}
            className="grid gap-1 rounded-md border border-sky-100 p-3 md:grid-cols-[1fr_auto]"
          >
            <p className="text-sm font-medium">{block.label}</p>
            <select
              name={`slot-${block.id}`}
              defaultValue="no"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </div>
        ))}
      </div>

      <label className="grid gap-1 text-sm">
        Optional note
        <textarea
          name="note"
          rows={3}
          placeholder="Any constraints? Need to leave early?"
          className="rounded-md border border-zinc-300 px-3 py-2.5"
        />
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2.5 text-white hover:bg-sky-700 disabled:opacity-50 sm:w-fit"
      >
        {pending ? "Saving..." : "Save availability"}
      </button>
    </form>
  );
}
