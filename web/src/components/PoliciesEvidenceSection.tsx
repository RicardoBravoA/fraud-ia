import type { EvaluationResult } from "@/types/evaluation";
import {
  actionBadgeClass,
  resolveMatchedPolicies,
} from "@/lib/evaluationPolicies";
import { formatSignal, getPolicyTitle } from "@/lib/codeLabels";

interface PoliciesEvidenceSectionProps {
  evaluation: EvaluationResult;
}

export function PoliciesEvidenceSection({ evaluation }: PoliciesEvidenceSectionProps) {
  const matchedPolicies = resolveMatchedPolicies(evaluation);
  const matchedIds = new Set(matchedPolicies.map((policy) => policy.policy_id));

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Policies & evidence</h3>
        <p className="mt-1 text-sm text-slate-600">
          Internal fraud rules evaluated by the RAG agent.{" "}
          <strong>Applied</strong> policies matched transaction signals;{" "}
          <strong>retrieved</strong> policies were loaded as context only.
        </p>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="font-medium text-slate-900">Policies applied</h4>
        <p className="mt-1 text-xs text-slate-500">
          Rules whose conditions were satisfied — they influence risk score and arbiter logic.
        </p>

        {matchedPolicies.length === 0 ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            No internal policy rules matched. The decision relied on signals, external intel,
            and arbiter heuristics only.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {matchedPolicies.map((policy) => (
              <li
                key={policy.policy_id}
                className="rounded-lg border border-bcp-orange/30 bg-orange-50/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-bcp-orange px-2 py-0.5 text-xs font-bold text-white">
                    {policy.policy_id}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {getPolicyTitle(policy.policy_id, policy.title)}
                  </span>
                  <span className="text-xs text-slate-500">v{policy.version}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${actionBadgeClass(policy.recommended_action)}`}
                  >
                    → {policy.recommended_action.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-800">{policy.rule}</p>
                {policy.triggered_by.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Triggered by
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {policy.triggered_by.map((trigger) => (
                        <li
                          key={trigger}
                          className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-900"
                        >
                          {formatSignal(trigger).label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="font-medium text-slate-900">Internal policies retrieved (RAG)</h4>
          <p className="mt-1 text-xs text-slate-500">
            Policy documents loaded for context — not all are necessarily applied.
          </p>
          <ul className="mt-4 space-y-3">
            {evaluation.citations_internal.map((citation) => {
              const applied = matchedIds.has(citation.policy_id);
              return (
                <li
                  key={`${citation.policy_id}-${citation.chunk_id}`}
                  className={`rounded-lg border p-3 text-sm ${
                    applied
                      ? "border-bcp-orange/40 bg-orange-50/30"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-700">
                      {getPolicyTitle(citation.policy_id) ?? citation.policy_id}
                    </span>
                    <span className="rounded bg-bcp-navy px-2 py-0.5 text-xs font-bold text-white">
                      {citation.policy_id}
                    </span>
                    <span className="text-xs text-slate-500">
                      chunk {citation.chunk_id} · v{citation.version}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        applied
                          ? "bg-bcp-orange/15 text-bcp-orange"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {applied ? "Applied" : "Context only"}
                    </span>
                  </div>
                  {citation.rule ? (
                    <p className="mt-2 text-slate-700">{citation.rule}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="font-medium text-slate-900">External threat intel</h4>
          <p className="mt-1 text-xs text-slate-500">
            Open-web sources consulted by ExternalThreatIntelAgent.
          </p>
          {evaluation.citations_external.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No external citations for this run.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {evaluation.citations_external.map((citation) => (
                <li key={citation.url} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <a
                    href={citation.url}
                    className="font-medium text-bcp-navy underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {citation.url}
                  </a>
                  <p className="mt-1 text-slate-600">{citation.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
