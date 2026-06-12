import type { AgentTraceEntry } from "@/types/evaluation";
import { formatAgentFindings } from "@/lib/agentFindings";
import {
  getAgentTraceStatus,
  getAgentTraceStatusStyles,
} from "@/lib/agentTraceStatus";
import { getAgentDefinition } from "@/lib/pipelineAgents";
import { formatDate } from "@/lib/formatters";

export function AgentTraceCard({
  entry,
  step,
}: {
  entry: AgentTraceEntry;
  step: number;
}) {
  const def = getAgentDefinition(entry.agent_name);
  const lines = formatAgentFindings(entry.agent_name, entry.findings);
  const { status, label } = getAgentTraceStatus(entry.agent_name, entry.findings);
  const styles = getAgentTraceStatusStyles(status);

  return (
    <article className={`rounded-xl border p-5 shadow-sm ${styles.card}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${styles.step}`}
        >
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <h4 className="font-semibold text-slate-900">{def.shortLabel}</h4>
                <p className="text-xs text-slate-500">{def.name}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
              >
                {label}
              </span>
            </div>
            <time className="text-xs text-slate-400">{formatDate(entry.timestamp)}</time>
          </div>
          <p className="mt-2 text-sm text-slate-600">{def.description}</p>
          <ul className="mt-3 space-y-1.5">
            {lines.map((line) => (
              <li
                key={line}
                className={`rounded-lg border px-3 py-2 text-sm ${styles.finding}`}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
