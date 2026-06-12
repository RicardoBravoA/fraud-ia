import type { AgentTraceEntry } from "@/types/evaluation";
import { getAgentPassLabel, getAgentTraceStatus, getAgentTraceStatusStyles } from "@/lib/agentTraceStatus";
import { summarizeAgentPipeline } from "@/lib/auditThresholds";
import { getAgentDefinition } from "@/lib/pipelineAgents";

export function AuditAgentSummary({ trace }: { trace: AgentTraceEntry[] }) {
  const { order, byName, ran, missing, expected } = summarizeAgentPipeline(trace);
  const passed = order.filter((name) => {
    const entry = byName.get(name);
    if (!entry) return false;
    return getAgentTraceStatus(name, entry.findings).status === "ok";
  }).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agent pipeline status</h3>
          <p className="mt-1 text-sm text-slate-600">
            Each agent ran in sequence. Status shows whether the step passed checks or raised
            concerns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            {ran}/{expected} agents executed
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
            {passed} passed
          </span>
          {missing.length ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {missing.length} not in trace
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {order.map((agentName, index) => {
          const entry = byName.get(agentName);
          const def = getAgentDefinition(agentName);

          if (!entry) {
            return (
              <article
                key={agentName}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold text-slate-500">Step {index + 1}</p>
                <p className="mt-1 font-semibold text-slate-700">{def.shortLabel}</p>
                <p className="mt-2 text-xs text-slate-500">Not executed</p>
              </article>
            );
          }

          const { status, label } = getAgentTraceStatus(agentName, entry.findings);
          const styles = getAgentTraceStatusStyles(status);
          const passLabel = getAgentPassLabel(status);

          return (
            <article key={agentName} className={`rounded-xl border p-4 ${styles.card}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Step {index + 1}</p>
                  <p className="mt-1 font-semibold text-slate-900">{def.shortLabel}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${styles.badge}`}
                >
                  {passLabel}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{def.role}</p>
              <p className="mt-2 text-xs font-medium text-slate-700">{label}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
