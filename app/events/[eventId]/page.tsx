import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEventAction } from "@/app/actions";
import { AvailabilityMatrix } from "@/components/availability-matrix";
import { FinalizeEventForm } from "@/components/finalize-event-form";
import { NotificationFeed } from "@/components/notification-feed";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTime } from "@/lib/time";
import {
  getEventById,
  getEventTimeBlocks,
  getFinalizedBlock,
  getInvitesForEvent,
  getRecommendation,
  getResponsesForEvent,
  listNotifications,
} from "@/lib/store";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const currentUser = await getCurrentUser();
  const event = getEventById(eventId);
  if (!event) {
    notFound();
  }
  const canDeleteEvent = event.organizerName.toLowerCase() === currentUser.toLowerCase();

  const timeBlocks = getEventTimeBlocks(event.id);
  const responses = getResponsesForEvent(event.id);
  const invites = getInvitesForEvent(event.id);
  const recommendation = getRecommendation(event.id);
  const finalizedBlock = getFinalizedBlock(event.id);
  const notifications = listNotifications(event.id);
  const inviteUrl = `/join/${event.inviteToken}`;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-5 sm:gap-6 sm:px-4 sm:py-8 md:px-8">
      <Link href="/" className="text-sm text-zinc-600 underline">
        Back to events
      </Link>

      <section className="grid gap-3 rounded-xl border border-emerald-100 bg-white p-4 sm:p-5">
        <h1 className="text-xl font-semibold sm:text-2xl">{event.title}</h1>
        <p className="text-zinc-600">
          {event.sport} • {event.groupName} • {event.venueArea}
        </p>
        <div className="grid gap-1 text-sm text-zinc-600">
          <p>Organizer: {event.organizerName}</p>
          <p>Target players: {event.targetPlayers}</p>
          <p>Polling date: {event.dateIso}</p>
          <p className="break-all">
            Invite link:{" "}
            <a className="underline" href={inviteUrl}>
              {inviteUrl}
            </a>
          </p>
        </div>
        {canDeleteEvent ? (
          <form action={deleteEventAction} className="pt-2">
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 sm:w-fit"
            >
              Delete event
            </button>
          </form>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-xl border border-sky-100 bg-white p-4">
            <h2 className="text-lg font-semibold text-sky-700">Availability recommendation</h2>
            {recommendation.recommended ? (
              <p className="text-sm text-zinc-700">
                Best slot: <strong>{recommendation.recommended.block.label}</strong> (
                {recommendation.recommended.yesCount} yes, {recommendation.recommended.maybeCount} maybe)
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Waiting for responses.</p>
            )}
            {finalizedBlock ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Finalized for {finalizedBlock.label} ({formatDateTime(finalizedBlock.startIso)})
              </p>
            ) : null}
          </div>

          <AvailabilityMatrix timeBlocks={timeBlocks} responses={responses} />
        </div>

        <div className="grid gap-4">
          {event.status !== "finalized" ? (
            <FinalizeEventForm
              eventId={event.id}
              recommendedBlockId={recommendation.recommended?.block.id ?? null}
              timeBlocks={timeBlocks}
            />
          ) : null}
          <div className="rounded-xl border border-yellow-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">Invite progress</h3>
            <ul className="grid gap-2 text-sm">
              {invites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between gap-2">
                  <span>{invite.inviteeName}</span>
                  <span className={invite.responded ? "text-emerald-700" : "text-zinc-500"}>
                    {invite.responded ? "Responded" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <NotificationFeed notifications={notifications} />
        </div>
      </section>
    </main>
  );
}
