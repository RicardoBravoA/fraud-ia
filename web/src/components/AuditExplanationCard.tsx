import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import type { EvaluationResult } from "@/types/evaluation";
import { DecisionBadge } from "@/components/DecisionBadge";
import { formatConfidence, formatDecisionLabel } from "@/lib/formatters";
import { resolveMatchedPolicies } from "@/lib/evaluationPolicies";
import { parseAuditExplanation } from "@/lib/parseAuditExplanation";
import { getAgentDefinition } from "@/lib/pipelineAgents";

interface AuditExplanationCardProps {
  evaluation: EvaluationResult;
}

export function AuditExplanationCard({ evaluation }: AuditExplanationCardProps) {
  const parsed = parseAuditExplanation(evaluation.explanation_audit);
  const matchedPolicies = resolveMatchedPolicies(evaluation);

  const arbiter = evaluation.agent_trace.find(
    (t) => t.agent_name === "DecisionArbiterAgent",
  );
  const arbiterDecision = arbiter?.findings.decision as string | undefined;
  const arbiterRisk = arbiter?.findings.confidence as number | undefined;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bcp-orange text-xs font-bold text-white">
            A
          </span>
          Audit explanation
        </h3>
        {evaluation.transaction_id ? (
          <Link
            to={`/audit/${evaluation.transaction_id}`}
            className="text-xs font-semibold text-bcp-navy underline hover:text-blue-900"
          >
            Full audit trail →
          </Link>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Structured record for investigators and HITL reviewers.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaItem label="Decision">
          <DecisionBadge decision={evaluation.decision} />
        </MetaItem>
        <MetaItem label="Risk score">
          <span className="font-mono text-sm font-semibold text-slate-900">
            {formatConfidence(evaluation.confidence)}
          </span>
        </MetaItem>
        <MetaItem label="Outcome">
          <span className="text-sm text-slate-700">
            {formatDecisionLabel(evaluation.decision)}
          </span>
        </MetaItem>
        <MetaItem label="Policies">
          <span className="text-sm text-slate-700">
            {matchedPolicies.length ? `${matchedPolicies.length} matched` : "None"}
          </span>
        </MetaItem>
      </dl>

      <section className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Policy match summary
        </h4>
        {matchedPolicies.length === 0 ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No internal policy rules matched for this transaction.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-700">
            {matchedPolicies.map((p) => p.policy_id).join(", ")} — see Policies &amp; evidence
            for rule text and triggers.
          </p>
        )}
      </section>

      <section className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Agent route
        </h4>
        {parsed.agentRoute.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Route not available.</p>
        ) : (
          <ol className="mt-3 flex flex-wrap items-center gap-1">
            {parsed.agentRoute.map((agentName, index) => {
              const def = getAgentDefinition(agentName);
              return (
                <li key={`${agentName}-${index}`} className="flex items-center gap-1">
                  <span
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    title={def.description}
                  >
                    {def.shortLabel}
                  </span>
                  <span className="text-slate-400" aria-hidden>
                    →
                  </span>
                </li>
              );
            })}
            <li>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                Decision
              </span>
            </li>
          </ol>
        )}
        {arbiterDecision ? (
          <p className="mt-2 text-xs text-slate-500">
            Arbiter output: {arbiterDecision}
            {arbiterRisk !== undefined ? ` · risk ${formatConfidence(arbiterRisk)}` : ""}
          </p>
        ) : null}
      </section>

      {parsed.llmNote ? (
        <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            LLM analysis
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{parsed.llmNote}</p>
        </section>
      ) : null}

      <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
          View raw audit string
        </summary>
        <p className="border-t border-slate-200 px-4 py-3 font-mono text-xs leading-relaxed text-slate-600">
          {parsed.raw}
        </p>
      </details>
    </article>
  );
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
