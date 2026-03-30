import Link from "next/link";
import { formatDateTime } from "@/lib/time";
import { getEventTimeBlocks } from "@/lib/store";
import type { EventRecord } from "@/lib/types";

type EventListProps = {
  events: EventRecord[];
};

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sky-200 bg-white p-5 text-sm text-zinc-500 sm:p-6">
        No events yet. Create your first session.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => {
        const finalized = event.finalizedTimeBlockId
          ? getEventTimeBlocks(event.id).find((slot) => slot.id === event.finalizedTimeBlockId)
          : null;
        return (
          <Link
            href={`/events/${event.id}`}
            key={event.id}
            className="grid gap-2 rounded-xl border border-sky-100 bg-white p-4 hover:border-sky-300"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold">{event.title}</h3>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs uppercase tracking-wide text-yellow-800">
                {event.status}
              </span>
            </div>
            <p className="text-sm text-zinc-600">
              {event.sport} • {event.groupName} • {event.venueArea}
            </p>
            <p className="text-sm text-zinc-600">
              {finalized ? `Finalized: ${finalized.label} (${formatDateTime(finalized.startIso)})` : `Polling date: ${event.dateIso}`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
