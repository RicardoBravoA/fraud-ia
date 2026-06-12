export interface ParsedAuditExplanation {
  policies: string[];
  agentRoute: string[];
  llmNote: string | null;
  raw: string;
}

export function parseAuditExplanation(text: string): ParsedAuditExplanation {
  const policiesMatch = text.match(/Policies applied:\s*([^.]+)/i);
  const routeMatch = text.match(/Agent route:\s*(.+?)(?:\.\s*LLM:|$)/i);
  const llmMatch = text.match(/LLM:\s*(.+)$/i);

  const policiesRaw = policiesMatch?.[1]?.trim() ?? "none";
  const policies =
    policiesRaw.toLowerCase() === "none"
      ? []
      : policiesRaw.split(",").map((p) => p.trim()).filter(Boolean);

  const routeRaw = routeMatch?.[1]?.trim().replace(/\.\s*$/, "") ?? "";
  const agentRoute = routeRaw
    .replace(/\s*→\s*Decision\.?\s*$/i, "")
    .split("→")
    .map((step) => step.trim())
    .filter(Boolean);

  return {
    policies,
    agentRoute,
    llmNote: llmMatch?.[1]?.trim() ?? null,
    raw: text,
  };
}

export function getMatchedPoliciesFromTrace(
  trace: { agent_name: string; findings: Record<string, unknown> }[],
): string[] {
  for (const entry of [...trace].reverse()) {
    const matched = entry.findings.matched_policies;
    if (Array.isArray(matched) && matched.length > 0) {
      return matched as string[];
    }
  }
  return [];
}
