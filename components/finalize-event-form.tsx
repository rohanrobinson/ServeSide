import { finalizeEventAction } from "@/app/actions";
import type { TimeBlock } from "@/lib/types";

type FinalizeEventFormProps = {
  eventId: string;
  recommendedBlockId: string | null;
  timeBlocks: TimeBlock[];
};

export function FinalizeEventForm({
  eventId,
  recommendedBlockId,
  timeBlocks,
}: FinalizeEventFormProps) {
  return (
    <form action={finalizeEventAction} className="grid gap-3 rounded-xl border border-yellow-200 bg-white p-4">
      <h3 className="font-semibold text-yellow-800">Finalize event</h3>
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-1 text-sm">
        Pick final slot
        <select
          name="selectedTimeBlockId"
          defaultValue={recommendedBlockId ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2.5"
        >
          {timeBlocks.map((block) => (
            <option key={block.id} value={block.id}>
              {block.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex w-full justify-center rounded-md bg-yellow-500 px-4 py-2.5 text-black hover:bg-yellow-400 sm:w-fit"
      >
        Finalize and notify group
      </button>
    </form>
  );
}
