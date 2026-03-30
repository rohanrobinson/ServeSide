import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityForm } from "@/components/availability-form";
import { getCurrentUser } from "@/lib/current-user";
import { getEventByToken, getEventTimeBlocks } from "@/lib/store";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const currentUser = await getCurrentUser();
  const event = getEventByToken(token);
  if (!event) {
    notFound();
  }

  const timeBlocks = getEventTimeBlocks(event.id);

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-4 px-3 py-5 sm:gap-6 sm:px-4 sm:py-8 md:px-8">
      <Link href="/" className="text-sm text-zinc-600 underline">
        Home
      </Link>

      <section className="rounded-xl border border-sky-100 bg-white p-4 sm:p-5">
        <h1 className="text-xl font-semibold sm:text-2xl">{event.title}</h1>
        <p className="text-sm text-zinc-600">
          {event.sport} • {event.groupName} • {event.venueArea}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Pick your availability below. The organizer will finalize the best slot.
        </p>
      </section>

      <AvailabilityForm
        inviteToken={token}
        timeBlocks={timeBlocks}
        defaultPlayerName={currentUser}
      />
    </main>
  );
}
