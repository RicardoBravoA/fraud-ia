import { describe, expect, it } from "vitest";

import { resolveMatchedPolicies } from "@/lib/evaluationPolicies";
import type { EvaluationResult } from "@/types/evaluation";

const baseEvaluation: EvaluationResult = {
  decision: "CHALLENGE",
  confidence: 0.78,
  signals: ["Monto fuera de rango"],
  citations_internal: [],
  citations_external: [],
  explanation_customer: "",
  explanation_audit: "Policies applied: FP-01, FP-03. Agent route: InternalPolicyRagAgent → Decision.",
  agent_trace: [],
};

describe("resolveMatchedPolicies", () => {
  it("prefers API matched_policies field", () => {
    const evaluation: EvaluationResult = {
      ...baseEvaluation,
      matched_policies: [
        {
          policy_id: "FP-01",
          rule: "Rule text",
          version: "2025.1",
          recommended_action: "CHALLENGE",
          triggered_by: ["Monto fuera de rango"],
        },
      ],
    };

    const resolved = resolveMatchedPolicies(evaluation);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].policy_id).toBe("FP-01");
    expect(resolved[0].triggered_by).toContain("Monto fuera de rango");
  });

  it("falls back to trace details", () => {
    const evaluation: EvaluationResult = {
      ...baseEvaluation,
      agent_trace: [
        {
          agent_name: "InternalPolicyRagAgent",
          findings: {
            matched_policies: ["FP-03"],
            matched_policy_details: [
              {
                policy_id: "FP-03",
                rule: "Block rule",
                version: "2025.1",
                recommended_action: "BLOCK",
                triggered_by: ["Monto fuera de rango"],
              },
            ],
          },
          confidence_delta: 0.12,
          timestamp: "2026-06-10T23:00:02Z",
        },
      ],
    };

    const resolved = resolveMatchedPolicies(evaluation);
    expect(resolved[0].policy_id).toBe("FP-03");
  });

  it("hydrates legacy IDs from audit string", () => {
    const resolved = resolveMatchedPolicies(baseEvaluation);
    expect(resolved.map((p) => p.policy_id)).toEqual(["FP-01", "FP-03"]);
    expect(resolved[0].recommended_action).toBe("CHALLENGE");
  });
});
