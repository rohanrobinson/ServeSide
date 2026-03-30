"use client";

import { useEffect, useState } from "react";
import { CreateEventForm } from "@/components/create-event-form";

type PlanSessionModalProps = {
  defaultOrganizerName: string;
};

export function PlanSessionModal({ defaultOrganizerName }: PlanSessionModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700"
      >
        Plan a Session
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Plan a new session"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
              aria-label="Close modal"
            >
              Close
            </button>
            <div className="p-3 pt-12 sm:p-4 sm:pt-12">
              <CreateEventForm defaultOrganizerName={defaultOrganizerName} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
