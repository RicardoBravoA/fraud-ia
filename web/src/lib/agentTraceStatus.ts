export type AgentTraceStatus = "ok" | "warning" | "critical" | "neutral";

export interface AgentTraceStatusMeta {
  status: AgentTraceStatus;
  label: string;
}

const STATUS_STYLES: Record<
  AgentTraceStatus,
  { card: string; step: string; badge: string; finding: string }
> = {
  ok: {
    card: "border-emerald-200 bg-emerald-50/30",
    step: "bg-emerald-600",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    finding: "border-emerald-100 bg-white text-slate-800",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/30",
    step: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    finding: "border-amber-100 bg-white text-slate-800",
  },
  critical: {
    card: "border-red-200 bg-red-50/30",
    step: "bg-red-600",
    badge: "border-red-200 bg-red-50 text-red-800",
    finding: "border-red-100 bg-white text-slate-800",
  },
  neutral: {
    card: "border-slate-200 bg-white",
    step: "bg-slate-500",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    finding: "border-slate-100 bg-slate-50 text-slate-800",
  },
};

export function getAgentTraceStatusStyles(status: AgentTraceStatus) {
  return STATUS_STYLES[status];
}

export function getAgentPassLabel(status: AgentTraceStatus): string {
  switch (status) {
    case "ok":
      return "Passed";
    case "warning":
      return "Flagged";
    case "critical":
      return "Failed";
    default:
      return "Completed";
  }
}

export function getAgentTraceStatus(
  agentName: string,
  findings: Record<string, unknown>,
): AgentTraceStatusMeta {
  switch (agentName) {
    case "TransactionContextAgent": {
      const signals = (findings.signals as string[]) ?? [];
      const ratio = (findings.amount_ratio as number) ?? 0;
      if (signals.length === 0) {
        return { status: "ok", label: "Clear" };
      }
      if (ratio > 10) {
        return { status: "critical", label: "High risk signals" };
      }
      return { status: "warning", label: "Signals detected" };
    }
    case "BehavioralPatternAgent": {
      const flags = (findings.behavioral_flags as string[]) ?? [];
      const deviceNew = findings.device_is_new === true;
      if (flags.length === 0 && !deviceNew) {
        return { status: "ok", label: "Profile match" };
      }
      if (deviceNew && flags.length > 0) {
        return { status: "critical", label: "Behavioral mismatch" };
      }
      return { status: "warning", label: "Behavioral flags" };
    }
    case "InternalPolicyRagAgent": {
      const matched = (findings.matched_policies as string[]) ?? [];
      if (matched.length === 0) {
        return { status: "ok", label: "No policy match" };
      }
      if (matched.some((id) => id === "FP-03" || id === "FP-04")) {
        return { status: "critical", label: "Block policies" };
      }
      if (matched.includes("FP-02")) {
        return { status: "warning", label: "Escalation policy" };
      }
      return { status: "warning", label: "Policies matched" };
    }
    case "ExternalThreatIntelAgent": {
      const hits = (findings.external_hits as number) ?? 0;
      return hits > 0
        ? { status: "warning", label: "External hits" }
        : { status: "ok", label: "No external hits" };
    }
    case "EvidenceAggregationAgent": {
      const signals = (findings.signals as string[]) ?? [];
      const policies = (findings.matched_policies as string[]) ?? [];
      if (signals.length === 0 && policies.length === 0) {
        return { status: "ok", label: "Clean evidence" };
      }
      if (signals.length > 0 && policies.length > 0) {
        return { status: "critical", label: "Mixed risk evidence" };
      }
      return { status: "warning", label: "Evidence flagged" };
    }
    case "DebateAgents":
      return { status: "neutral", label: "Adversarial review" };
    case "DecisionArbiterAgent": {
      const decision = findings.decision as string | undefined;
      switch (decision) {
        case "APPROVE":
          return { status: "ok", label: "Approved" };
        case "CHALLENGE":
          return { status: "warning", label: "Challenge" };
        case "BLOCK":
          return { status: "critical", label: "Blocked" };
        case "ESCALATE_TO_HUMAN":
          return { status: "warning", label: "Human review" };
        default:
          return { status: "neutral", label: "Decision" };
      }
    }
    case "ExplainabilityAgent":
      return findings.generated
        ? { status: "ok", label: "Narratives ready" }
        : { status: "neutral", label: "Pending" };
    default:
      return { status: "neutral", label: "Agent step" };
  }
}

export const TRACE_STATUS_LEGEND: { status: AgentTraceStatus; label: string; description: string }[] =
  [
    { status: "ok", label: "Clear", description: "No concerns at this step" },
    { status: "warning", label: "Review", description: "Flags or moderate risk" },
    { status: "critical", label: "High risk", description: "Strong fraud indicators" },
    { status: "neutral", label: "Info", description: "Processing or non-decisive step" },
  ];
