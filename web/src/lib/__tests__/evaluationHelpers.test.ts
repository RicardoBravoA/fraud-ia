import { describe, expect, it } from "vitest";

import { formatAgentFindings } from "@/lib/agentFindings";
import { parseAuditExplanation } from "@/lib/parseAuditExplanation";
import { getRiskLevel } from "@/lib/riskLevels";

describe("parseAuditExplanation", () => {
  it("extracts policies, route, and llm note", () => {
    const parsed = parseAuditExplanation(
      "Policies applied: FP-01, FP-03. Agent route: ContextAgent → ArbiterAgent → Decision. LLM: Risk elevated due to timing.",
    );
    expect(parsed.policies).toEqual(["FP-01", "FP-03"]);
    expect(parsed.agentRoute).toEqual(["ContextAgent", "ArbiterAgent"]);
    expect(parsed.llmNote).toBe("Risk elevated due to timing.");
  });

  it("handles none policies", () => {
    const parsed = parseAuditExplanation("Policies applied: none. Agent route: A → B → Decision.");
    expect(parsed.policies).toEqual([]);
  });
});

describe("agentFindings", () => {
  it("formats context agent findings", () => {
    const lines = formatAgentFindings("TransactionContextAgent", {
      signals: [],
      amount_ratio: 0.9,
    });
    expect(lines.some((l) => l.includes("0.90"))).toBe(true);
  });

  it("formats debate findings", () => {
    const lines = formatAgentFindings("DebateAgents", {
      pro_fraud: "Suspicious",
      pro_customer: "Legitimate",
    });
    expect(lines).toHaveLength(2);
  });
});

describe("riskLevels", () => {
  it("returns low for clean approve", () => {
    expect(getRiskLevel(0.08).label).toBe("Low");
  });

  it("returns critical for block", () => {
    expect(getRiskLevel(0.95).label).toBe("Critical");
  });
});
