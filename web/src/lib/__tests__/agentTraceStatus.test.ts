import { describe, expect, it } from "vitest";

import { getAgentTraceStatus } from "@/lib/agentTraceStatus";

describe("getAgentTraceStatus", () => {
  it("marks clean context as ok", () => {
    expect(getAgentTraceStatus("TransactionContextAgent", { signals: [], amount_ratio: 0.9 })).toEqual({
      status: "ok",
      label: "Clear",
    });
  });

  it("marks high amount ratio as critical", () => {
    expect(
      getAgentTraceStatus("TransactionContextAgent", {
        signals: ["Monto fuera de rango"],
        amount_ratio: 41,
      }).status,
    ).toBe("critical");
  });

  it("marks block policies as critical", () => {
    expect(
      getAgentTraceStatus("InternalPolicyRagAgent", {
        matched_policies: ["FP-01", "FP-03"],
      }).status,
    ).toBe("critical");
  });

  it("maps arbiter decisions", () => {
    expect(getAgentTraceStatus("DecisionArbiterAgent", { decision: "APPROVE" }).status).toBe("ok");
    expect(getAgentTraceStatus("DecisionArbiterAgent", { decision: "BLOCK" }).status).toBe(
      "critical",
    );
    expect(getAgentTraceStatus("DecisionArbiterAgent", { decision: "CHALLENGE" }).status).toBe(
      "warning",
    );
  });
});
