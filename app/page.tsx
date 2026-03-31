import { EventList } from "@/components/event-list";
import { PlanSessionModal } from "@/components/plan-session-modal";
import { TestUserSwitcher } from "@/components/test-user-switcher";
import { getCurrentUser } from "@/lib/current-user";
import { listEventsForUser } from "@/lib/store";

export default async function Home() {
  const currentUser = await getCurrentUser();
  const events = listEventsForUser(currentUser);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-5 sm:gap-6 sm:px-4 sm:py-8 md:px-8">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-emerald-700 sm:text-3xl">
          🎾 ServeSide Planner{" "}
          <span style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" }}>
            {"\u{1F952}"}
          </span>
        </h1>
        <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
          Coordinate pickleball and tennis sessions like Partiful: collect availability, auto-pick best slots, and
          finalize with one click.
        </p>
        <div className="pt-1">
          <PlanSessionModal defaultOrganizerName={currentUser} />
        </div>
        <TestUserSwitcher currentUser={currentUser} />
      </header>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Your events ({currentUser})</h2>
        <EventList events={events} />
      </section>
    </main>
  );
}
