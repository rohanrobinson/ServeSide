"use client";

import { useEffect, useState } from "react";
import { CreateEventForm } from "@/components/create-event-form";
import { PlanChatModal } from "@/components/plan-chat-modal";

type PlanSessionModalProps = {
  defaultOrganizerName: string;
};

export function PlanSessionModal({ defaultOrganizerName }: PlanSessionModalProps) {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700"
        >
          Plan a Session
        </button>
        <button
          type="button"
          onClick={() => {
            setChatSessionId(crypto.randomUUID());
            setChatOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-white px-4 py-2.5 text-emerald-800 hover:bg-emerald-50"
        >
          Try Chat
        </button>
      </div>

      {chatSessionId ? (
        <PlanChatModal
          open={chatOpen}
          sessionId={chatSessionId}
          onClose={() => {
            setChatOpen(false);
            setChatSessionId(null);
          }}
        />
      ) : null}

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
