import type { AvailabilityResponse, TimeBlock } from "@/lib/types";

type AvailabilityMatrixProps = {
  timeBlocks: TimeBlock[];
  responses: AvailabilityResponse[];
};

function badgeClass(value: string) {
  if (value === "yes") return "bg-emerald-100 text-emerald-800";
  if (value === "maybe") return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-600";
}

export function AvailabilityMatrix({ timeBlocks, responses }: AvailabilityMatrixProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white">
      <p className="px-3 py-2 text-xs text-zinc-500 md:hidden">Swipe horizontally to view all slots.</p>
      <table className="min-w-[700px] border-collapse text-sm md:min-w-full">
        <thead className="bg-sky-50">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Player</th>
            {timeBlocks.map((block) => (
              <th key={block.id} className="whitespace-nowrap px-3 py-2 text-left font-semibold">
                {block.label}
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {responses.length === 0 ? (
            <tr>
              <td colSpan={timeBlocks.length + 2} className="px-3 py-5 text-center text-zinc-500">
                No availability responses yet.
              </td>
            </tr>
          ) : (
            responses.map((response) => (
              <tr key={response.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium">{response.playerName}</td>
                {timeBlocks.map((block) => {
                  const value =
                    response.choices.find((choice) => choice.timeBlockId === block.id)?.confidence ??
                    "no";
                  return (
                    <td key={block.id} className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs capitalize ${badgeClass(value)}`}>
                        {value}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-zinc-600">{response.note || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
