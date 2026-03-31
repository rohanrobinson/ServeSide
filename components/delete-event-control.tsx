"use client";

import { useState } from "react";
import { deleteEventAction } from "@/app/actions";

type DeleteEventControlProps = {
  eventId: string;
  eventTitle: string;
};

export function DeleteEventControl({ eventId, eventTitle }: DeleteEventControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 sm:w-fit"
      >
        Delete event
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm event deletion"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-red-100 bg-white p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900">Delete this session?</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This will permanently remove <strong>{eventTitle}</strong> and all invite, availability, and notification
              data for this session.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:w-auto"
              >
                Cancel
              </button>

              <form action={deleteEventAction} className="w-full sm:w-auto">
                <input type="hidden" name="eventId" value={eventId} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
                >
                  Confirm delete
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
