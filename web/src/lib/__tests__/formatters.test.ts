import { describe, expect, it } from "vitest";

import {
  formatConfidence,
  formatCurrency,
  formatDate,
  formatDecisionLabel,
  truncate,
} from "@/lib/formatters";
import { getDecisionStyle } from "@/lib/decisionColors";

describe("formatters", () => {
  it("formats currency", () => {
    expect(formatCurrency(450, "PEN")).toContain("450");
  });

  it("formats date", () => {
    expect(formatDate("2025-12-17T10:00:00")).toBeTruthy();
  });

  it("formats confidence", () => {
    expect(formatConfidence(0.65)).toBe("65%");
  });

  it("formats decision label", () => {
    expect(formatDecisionLabel("BLOCK")).toBe("Blocked");
  });

  it("truncates long text", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
  });
});

describe("decisionColors", () => {
  it("returns style for each decision", () => {
    expect(getDecisionStyle("APPROVE").badge).toContain("emerald");
  });
});
