import type { AgentTraceEntry, EvaluationResult, MatchedPolicy } from "@/types/evaluation";
import { parseAuditExplanation } from "@/lib/parseAuditExplanation";

/** Fallback catalog when API returns only policy IDs (legacy evaluations). */
const POLICY_CATALOG: Record<
  string,
  Pick<MatchedPolicy, "title" | "rule" | "recommended_action">
> = {
  "FP-01": {
    title: "High amount and unusual hours",
    rule: "Monto > 3x promedio habitual y horario fuera de rango → CHALLENGE",
    recommended_action: "CHALLENGE",
  },
  "FP-02": {
    title: "International + new device",
    rule: "Transacción internacional y dispositivo nuevo → ESCALATE_TO_HUMAN",
    recommended_action: "ESCALATE_TO_HUMAN",
  },
  "FP-03": {
    title: "Extreme amount spike",
    rule: "Monto > 10x promedio habitual → BLOCK",
    recommended_action: "BLOCK",
  },
  "FP-04": {
    title: "High-risk merchant amount",
    rule: "Merchant en lista de alto riesgo con monto elevado → BLOCK",
    recommended_action: "BLOCK",
  },
};

function detailsFromTrace(trace: AgentTraceEntry[]): MatchedPolicy[] {
  const ragEntry = [...trace]
    .reverse()
    .find((entry) => entry.agent_name === "InternalPolicyRagAgent");
  const details = ragEntry?.findings.matched_policy_details;
  if (Array.isArray(details) && details.length > 0) {
    return details as MatchedPolicy[];
  }
  return [];
}

function idsFromTraceOrAudit(
  trace: AgentTraceEntry[],
  auditText: string,
): string[] {
  const fromTrace = [...trace]
    .reverse()
    .find((entry) => entry.agent_name === "InternalPolicyRagAgent");
  const matched = fromTrace?.findings.matched_policies;
  if (Array.isArray(matched) && matched.length > 0) {
    return matched as string[];
  }
  return parseAuditExplanation(auditText).policies;
}

function hydrateFromIds(ids: string[]): MatchedPolicy[] {
  return ids.map((policyId) => {
    const catalog = POLICY_CATALOG[policyId];
    return {
      policy_id: policyId,
      title: catalog?.title ?? policyId,
      rule: catalog?.rule ?? "Policy rule not available for this evaluation.",
      version: "—",
      recommended_action: catalog?.recommended_action ?? "REVIEW",
      triggered_by: [],
    };
  });
}

export function resolveMatchedPolicies(evaluation: EvaluationResult): MatchedPolicy[] {
  if (evaluation.matched_policies?.length) {
    return evaluation.matched_policies;
  }

  const fromTrace = detailsFromTrace(evaluation.agent_trace);
  if (fromTrace.length) {
    return fromTrace;
  }

  const ids = idsFromTraceOrAudit(
    evaluation.agent_trace,
    evaluation.explanation_audit,
  );
  return hydrateFromIds(ids);
}

export function isPolicyMatched(
  policyId: string,
  matchedPolicies: MatchedPolicy[],
): boolean {
  return matchedPolicies.some((policy) => policy.policy_id === policyId);
}

export function actionBadgeClass(action: string): string {
  switch (action) {
    case "APPROVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "CHALLENGE":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "BLOCK":
      return "border-red-200 bg-red-50 text-red-800";
    case "ESCALATE_TO_HUMAN":
      return "border-violet-200 bg-violet-50 text-violet-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}
