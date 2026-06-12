import type { AuditEvent, EvaluationResult } from "@/types/evaluation";
import { AgentTimeline } from "@/components/AgentTimeline";
import { AuditAgentSummary } from "@/components/AuditAgentSummary";
import { AuditExplanationCard } from "@/components/AuditExplanationCard";
import { AuditSystemEvents } from "@/components/AuditSystemEvents";
import { DecisionBadge } from "@/components/DecisionBadge";
import { PolicyThresholdsCard } from "@/components/PolicyThresholdsCard";
import { TransactionContextCard } from "@/components/TransactionContextCard";
import { TRACE_STATUS_LEGEND, getAgentTraceStatusStyles } from "@/lib/agentTraceStatus";

export function AuditTrailDetail({
  evaluation,
  auditEvents,
}: {
  evaluation: EvaluationResult;
  auditEvents: AuditEvent[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900">{evaluation.transaction_id}</h3>
          <DecisionBadge decision={evaluation.decision} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Full audit record with profile baselines, policy limits, agent pass/fail status, and
          chronological events.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {TRACE_STATUS_LEGEND.map(({ status, label, description }) => {
            const styles = getAgentTraceStatusStyles(status);
            return (
              <li
                key={status}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${styles.badge}`}
                title={description}
              >
                <span className={`h-2 w-2 rounded-full ${styles.step}`} aria-hidden />
                {label}
              </li>
            );
          })}
        </ul>
      </section>

      {evaluation.transaction_context ? (
        <TransactionContextCard context={evaluation.transaction_context} />
      ) : null}

      {evaluation.transaction_context ? (
        <PolicyThresholdsCard context={evaluation.transaction_context} evaluation={evaluation} />
      ) : null}

      <AuditAgentSummary trace={evaluation.agent_trace} />

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agent step details</h3>
          <p className="mt-1 text-sm text-slate-600">
            Findings from each pipeline agent — descriptions, outputs, and pass/fail status.
          </p>
        </div>
        <AgentTimeline trace={evaluation.agent_trace} />
      </section>

      <AuditExplanationCard evaluation={evaluation} />

      <AuditSystemEvents events={auditEvents} />
    </div>
  );
}
