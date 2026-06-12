import { describe, expect, it } from "vitest";

import { mockEvaluation } from "@/test/mocks/handlers";
import {
  buildHitlThresholdRows,
  buildPolicyThresholdRows,
  summarizeAgentPipeline,
} from "@/lib/auditThresholds";

describe("auditThresholds", () => {
  it("builds policy rows with baselines and observed values", () => {
    const context = mockEvaluation.transaction_context!;
    const rows = buildPolicyThresholdRows(context, mockEvaluation);

    expect(rows).toHaveLength(4);
    expect(rows[0].id).toBe("FP-01");
    expect(rows[0].baseline).toContain("3×");
    expect(rows[0].observed).toContain("0.90×");
    expect(rows[0].triggered).toBe(false);
  });

  it("flags FP-03 when amount ratio exceeds 10x", () => {
    const context = {
      ...mockEvaluation.transaction_context!,
      amount_ratio: 12,
      transaction: {
        ...mockEvaluation.transaction_context!.transaction,
        amount: 6000,
      },
    };
    const evaluation = {
      ...mockEvaluation,
      transaction_context: context,
      matched_policies: [{ policy_id: "FP-03", title: "Extreme", rule: "", version: "2025.1", recommended_action: "BLOCK", triggered_by: [] }],
    };

    const fp03 = buildPolicyThresholdRows(context, evaluation).find((row) => row.id === "FP-03");
    expect(fp03?.triggered).toBe(true);
    expect(fp03?.limit).toContain("10×");
  });

  it("summarizes agent pipeline order", () => {
    const summary = summarizeAgentPipeline(mockEvaluation.agent_trace);
    expect(summary.expected).toBe(8);
    expect(summary.order[0]).toBe("TransactionContextAgent");
    expect(summary.missing).toContain("ExternalThreatIntelAgent");
    expect(summary.missing).toContain("ExplainabilityAgent");
  });

  it("builds HITL threshold rows", () => {
    const rows = buildHitlThresholdRows(mockEvaluation);
    expect(rows[0].triggered).toBe(false);
    expect(rows[1].observed).toBe("APPROVE");
  });
});
