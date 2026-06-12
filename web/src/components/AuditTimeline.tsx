import type { AuditEvent } from "@/types/evaluation";
import { formatDate } from "@/lib/formatters";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No audit events.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event, index) => (
        <li
          key={`${event.agent_name}-${event.timestamp}-${index}`}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{event.agent_name}</p>
              <p className="text-sm text-slate-500">{event.action}</p>
            </div>
            <time className="text-xs text-slate-500">{formatDate(event.timestamp)}</time>
          </div>
          <pre className="mt-3 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </li>
      ))}
    </ol>
  );
}
