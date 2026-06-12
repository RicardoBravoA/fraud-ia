import type { EvaluationResult, TransactionContext } from "@/types/evaluation";

export interface PolicyThresholdRow {
  id: string;
  title: string;
  rule: string;
  baseline: string;
  observed: string;
  limit: string;
  triggered: boolean;
}

export interface HitlThresholdRow {
  label: string;
  baseline: string;
  observed: string;
  triggered: boolean;
}

const HITL_CONFIDENCE_THRESHOLD = 0.5;

export function buildPolicyThresholdRows(
  context: TransactionContext,
  evaluation: EvaluationResult,
): PolicyThresholdRow[] {
  const { transaction, customer_profile, amount_ratio, device_is_new, transaction_hour } = context;
  const [hourStart, hourEnd] = customer_profile.usual_hours.split("-").map(Number);
  const inUsualHours = hourStart <= transaction_hour && transaction_hour <= hourEnd;
  const usualCountries = customer_profile.usual_countries.split(",").map((c) => c.trim());
  const highRiskMerchant = context.merchant?.risk_level === "high";

  const matchedIds = new Set(
    (evaluation.matched_policies ?? []).map((p) => p.policy_id),
  );
  if (matchedIds.size === 0) {
    for (const entry of evaluation.agent_trace) {
      if (entry.agent_name !== "InternalPolicyRagAgent") continue;
      const ids = (entry.findings.matched_policies as string[]) ?? [];
      ids.forEach((id) => matchedIds.add(id));
    }
  }

  return [
    {
      id: "FP-01",
      title: "High amount and unusual hours",
      rule: "Amount > 3× usual average AND hour outside usual range → CHALLENGE",
      baseline: `≤ 3× avg · hours ${customer_profile.usual_hours}`,
      observed: `${amount_ratio.toFixed(2)}× · ${String(transaction_hour).padStart(2, "0")}:00`,
      limit: "> 3× AND outside hours",
      triggered: matchedIds.has("FP-01") || (amount_ratio > 3 && !inUsualHours),
    },
    {
      id: "FP-02",
      title: "International + new device",
      rule: "Country not in customer profile AND new device → ESCALATE_TO_HUMAN",
      baseline: `Countries: ${usualCountries.join(", ")} · known devices only`,
      observed: `${transaction.country} · ${device_is_new ? "new device" : "known device"}`,
      limit: "Unusual country + new device",
      triggered:
        matchedIds.has("FP-02") ||
        (!usualCountries.includes(transaction.country) && device_is_new),
    },
    {
      id: "FP-03",
      title: "Extreme amount spike",
      rule: "Amount > 10× usual average → BLOCK",
      baseline: `≤ 10× of ${customer_profile.usual_amount_avg.toLocaleString()} ${transaction.currency}`,
      observed: `${amount_ratio.toFixed(2)}× (${transaction.amount.toLocaleString()} ${transaction.currency})`,
      limit: "> 10× usual",
      triggered: matchedIds.has("FP-03") || amount_ratio > 10,
    },
    {
      id: "FP-04",
      title: "High-risk merchant amount",
      rule: "High-risk merchant AND amount > 3× usual → BLOCK",
      baseline: highRiskMerchant
        ? "High-risk merchant · amount ≤ 3× usual"
        : "Merchant not high-risk",
      observed: `${context.merchant?.name ?? transaction.merchant_id} · ${amount_ratio.toFixed(2)}×`,
      limit: "High-risk merchant + > 3×",
      triggered: matchedIds.has("FP-04") || (highRiskMerchant && amount_ratio > 3),
    },
  ];
}

export function buildHitlThresholdRows(evaluation: EvaluationResult): HitlThresholdRow[] {
  return [
    {
      label: "Risk score queue threshold",
      baseline: `≥ ${Math.round(HITL_CONFIDENCE_THRESHOLD * 100)}% fraud risk`,
      observed: `${Math.round(evaluation.confidence * 100)}%`,
      triggered: evaluation.confidence >= HITL_CONFIDENCE_THRESHOLD,
    },
    {
      label: "Escalation decision",
      baseline: "ESCALATE_TO_HUMAN",
      observed: evaluation.decision,
      triggered: evaluation.decision === "ESCALATE_TO_HUMAN",
    },
  ];
}

export function summarizeAgentPipeline(trace: EvaluationResult["agent_trace"]) {
  const order = [
    "TransactionContextAgent",
    "BehavioralPatternAgent",
    "InternalPolicyRagAgent",
    "ExternalThreatIntelAgent",
    "EvidenceAggregationAgent",
    "DebateAgents",
    "DecisionArbiterAgent",
    "ExplainabilityAgent",
  ];

  const byName = new Map(trace.map((entry) => [entry.agent_name, entry]));
  const ran = trace.length;
  const missing = order.filter((name) => !byName.has(name));

  return { order, byName, ran, missing, expected: order.length };
}
