import type { AuditEvent } from "@/types/evaluation";
import { formatDate } from "@/lib/formatters";

const SYSTEM_ACTION_LABELS: Record<string, string> = {
  transaction_received: "Transaction ingested into the platform",
  case_created: "HITL case opened for human review",
  case_resolved: "HITL case resolved by reviewer",
};

export function AuditSystemEvents({ events }: { events: AuditEvent[] }) {
  const systemEvents = events.filter(
    (event) => event.action !== "agent_completed",
  );

  if (systemEvents.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">System & HITL events</h3>
        <p className="mt-1 text-sm text-slate-600">
          Non-agent audit entries — ingestion, HITL queue, and reviewer actions.
        </p>
      </div>

      <ol className="space-y-3">
        {systemEvents.map((event, index) => (
          <li
            key={`${event.agent_name}-${event.timestamp}-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{event.agent_name}</p>
                <p className="text-sm text-slate-600">
                  {SYSTEM_ACTION_LABELS[event.action] ?? event.action}
                </p>
              </div>
              <time className="text-xs text-slate-500">{formatDate(event.timestamp)}</time>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(event.payload).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {typeof value === "string" || typeof value === "number"
                      ? String(value)
                      : JSON.stringify(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
