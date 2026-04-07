"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  initPlanChatSessionAction,
  sendPlanChatMessageAction,
} from "@/app/actions";
import type { PlanChatMessage } from "@/lib/types";

type PlanChatModalProps = {
  open: boolean;
  sessionId: string;
  onClose: () => void;
};

export function PlanChatModal({ open, sessionId, onClose }: PlanChatModalProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<PlanChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [initError, setInitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !sessionId) {
      return;
    }

    let cancelled = false;
    initPlanChatSessionAction(sessionId)
      .then((result) => {
        if (!cancelled) {
          setInitError(null);
          setMessages(result.messages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInitError("Could not start the chat. Try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    startTransition(async () => {
      try {
        const result = await sendPlanChatMessageAction(sessionId, text);
        setMessages(result.messages);
        if (result.eventId) {
          router.push(`/events/${result.eventId}`);
          onClose();
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "system",
            body: "Something went wrong sending that message. Try again.",
            createdAtIso: new Date().toISOString(),
          },
        ]);
      }
    });
  }, [input, isPending, onClose, router, sessionId]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Plan a session with chat"
      onClick={onClose}
    >
      <div
        className="flex h-[min(560px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-base font-semibold text-emerald-800">Try Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
            aria-label="Close chat"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {initError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {initError}
            </p>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-800"
                }`}
              >
                {message.body}
              </div>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        <div className="border-t border-zinc-200 p-3">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="plan-chat-input">
              Message
            </label>
            <input
              id="plan-chat-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={Boolean(initError) || isPending}
              placeholder="Type a reply…"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-emerald-500/40 focus:ring-2 disabled:bg-zinc-100"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={Boolean(initError) || isPending || !input.trim()}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Guided setup — answers are saved when you finish. Press Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
}
