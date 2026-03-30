import { formatDateTime } from "@/lib/time";
import type { NotificationLog } from "@/lib/types";

type NotificationFeedProps = {
  notifications: NotificationLog[];
};

export function NotificationFeed({ notifications }: NotificationFeedProps) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <h3 className="mb-3 font-semibold text-emerald-700">Notification activity</h3>
      <ul className="grid gap-2 text-sm">
        {notifications.map((entry) => (
          <li key={entry.id} className="rounded-md border border-zinc-100 px-3 py-2">
            <p>
              <span className="font-medium capitalize">{entry.kind}</span> sent to {entry.recipient}
            </p>
            <p className="text-zinc-600">{entry.message}</p>
            <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAtIso)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
