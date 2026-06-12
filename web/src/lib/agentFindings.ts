import { formatSignal } from "@/lib/codeLabels";

export function formatAgentFindings(agentName: string, findings: Record<string, unknown>): string[] {
  switch (agentName) {
    case "TransactionContextAgent": {
      const signals = (findings.signals as string[]) ?? [];
      const ratio = findings.amount_ratio as number | undefined;
      const lines = [
        signals.length
          ? `Signals: ${signals.map((s) => formatSignal(s).label).join(", ")}`
          : "No internal signals detected.",
      ];
      if (ratio !== undefined) {
        lines.push(`Amount ratio vs profile: ${ratio.toFixed(2)}×`);
      }
      return lines;
    }
    case "BehavioralPatternAgent": {
      const flags = (findings.behavioral_flags as string[]) ?? [];
      const deviceNew = findings.device_is_new as boolean | undefined;
      return [
        flags.length ? `Behavioral flags: ${flags.join(", ")}` : "Behavior matches profile.",
        deviceNew !== undefined
          ? deviceNew
            ? "Device is new for this customer."
            : "Device is known."
          : "",
      ].filter(Boolean);
    }
    case "InternalPolicyRagAgent": {
      const matched = (findings.matched_policies as string[]) ?? [];
      const details = findings.matched_policy_details as
        | { policy_id: string; title?: string }[]
        | undefined;
      if (details?.length) {
        return details.map(
          (p) => `Policy matched: ${p.title ?? p.policy_id} (${p.policy_id})`,
        );
      }
      return matched.length
        ? [`Policies triggered: ${matched.join(", ")}`]
        : ["No policy rules matched current signals."];
    }
    case "ExternalThreatIntelAgent": {
      const hits = findings.external_hits as number | undefined;
      return [
        hits
          ? `${hits} external threat reference(s) retrieved.`
          : "No external threat hits.",
      ];
    }
    case "EvidenceAggregationAgent": {
      const signals = (findings.signals as string[]) ?? [];
      const policies = (findings.matched_policies as string[]) ?? [];
      return [
        `Consolidated ${signals.length} signal(s) and ${policies.length} policy match(es).`,
      ];
    }
    case "DebateAgents": {
      const proFraud = findings.pro_fraud as string | undefined;
      const proCustomer = findings.pro_customer as string | undefined;
      return [
        proFraud ? `Pro-Fraud: ${proFraud}` : "",
        proCustomer ? `Pro-Customer: ${proCustomer}` : "",
      ].filter(Boolean);
    }
    case "DecisionArbiterAgent": {
      const decision = findings.decision as string | undefined;
      const confidence = findings.confidence as number | undefined;
      const raw = findings.raw_risk_score as number | undefined;
      return [
        decision ? `Decision: ${decision}` : "",
        confidence !== undefined ? `Risk score: ${Math.round(confidence * 100)}%` : "",
        raw !== undefined && raw !== confidence
          ? `Raw evidence score before floors: ${Math.round(raw * 100)}%`
          : "",
      ].filter(Boolean);
    }
    case "ExplainabilityAgent":
      return findings.generated ? ["Customer and audit narratives generated."] : [];
    default:
      return [JSON.stringify(findings)];
  }
}
