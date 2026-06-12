import { Link } from "react-router-dom";

import type { EvaluationResult } from "@/types/evaluation";
import { AgentTimeline } from "@/components/AgentTimeline";
import { AuditExplanationCard } from "@/components/AuditExplanationCard";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { DecisionBadge } from "@/components/DecisionBadge";
import { PipelineFlow } from "@/components/PipelineFlow";
import { PoliciesEvidenceSection } from "@/components/PoliciesEvidenceSection";
import { TransactionContextCard } from "@/components/TransactionContextCard";
import { CodeChip } from "@/components/CodeLabel";
import { formatSignal } from "@/lib/codeLabels";
import { formatDecisionLabel } from "@/lib/formatters";
import { getRiskLevel } from "@/lib/riskLevels";
import {
  getAgentTraceStatusStyles,
  TRACE_STATUS_LEGEND,
} from "@/lib/agentTraceStatus";

export function EvaluationDetail({
  evaluation,
}: {
  evaluation: EvaluationResult;
}) {
  const risk = getRiskLevel(evaluation.confidence);

  return (
    <div className="space-y-8">
      {evaluation.transaction_context ? (
        <TransactionContextCard context={evaluation.transaction_context} />
      ) : null}

      {/* Outcome hero */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <div className="border-b border-slate-100 bg-bcp-navy/5 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bcp-navy">
            Evaluation result
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              {evaluation.transaction_id ?? "—"}
            </h2>
            <DecisionBadge decision={evaluation.decision} />
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${risk.badge}`}
            >
              {risk.label} risk
            </span>
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <ConfidenceBar confidence={evaluation.confidence} decision={evaluation.decision} />
            <p className="mt-3 text-sm text-slate-600">{risk.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              Risk score closer to <strong>1.0</strong> means higher fraud risk. Decision:{" "}
              <strong>{formatDecisionLabel(evaluation.decision)}</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">How this decision was made</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600">
              <li>1. Context and behavioral agents compared the transaction to the customer profile.</li>
              <li>2. Policy RAG and external intel added regulatory and threat context.</li>
              <li>3. The arbiter applied matched rules and computed the final risk score.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Explanations */}
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bcp-navy text-xs text-white">
              C
            </span>
            Customer explanation
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            {evaluation.explanation_customer}
          </p>
        </article>
        <AuditExplanationCard evaluation={evaluation} />
      </section>

      {/* Signals */}
      <section>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Detected signals</h3>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic flags from Context + Behavioral agents — primary input for policy matching
            and the arbiter.
          </p>
          {evaluation.signals.length === 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              No risk signals — transaction aligns with customer profile.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {evaluation.signals.map((signal) => (
                <li key={signal}>
                  <CodeChip info={formatSignal(signal)} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Policies + evidence */}
      <PoliciesEvidenceSection evaluation={evaluation} />

      {/* Pipeline overview */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Multi-agent pipeline</h3>
            <p className="mt-1 text-sm text-slate-600">
              Sequential orchestration — 8 agents across 4 phases.
            </p>
          </div>
          {evaluation.transaction_id ? (
            <Link
              to={`/audit/${evaluation.transaction_id}`}
              className="text-sm font-medium text-bcp-navy underline"
            >
              Full audit trail →
            </Link>
          ) : null}
        </div>
        <PipelineFlow trace={evaluation.agent_trace} />
      </section>

      {/* Detailed trace */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900">Step-by-step agent trace</h3>
        <p className="mt-1 text-sm text-slate-600">
          Output from each agent — color indicates whether the step raised concerns for this
          transaction.
        </p>
        <ul className="mt-3 flex flex-wrap gap-3">
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
        <div className="mt-4">
          <AgentTimeline trace={evaluation.agent_trace} />
        </div>
      </section>
    </div>
  );
}
