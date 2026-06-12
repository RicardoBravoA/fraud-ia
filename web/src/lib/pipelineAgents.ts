export type PipelinePhase = "analysis" | "intelligence" | "synthesis" | "decision";

export interface AgentDefinition {
  name: string;
  shortLabel: string;
  phase: PipelinePhase;
  description: string;
  role: string;
}

export const PIPELINE_PHASES: { id: PipelinePhase; label: string; summary: string }[] = [
  {
    id: "analysis",
    label: "1 · Signal analysis",
    summary: "Compare the transaction against the customer profile and derive internal signals.",
  },
  {
    id: "intelligence",
    label: "2 · Policy & threat intel",
    summary: "Retrieve internal fraud policies (RAG) and governed external web intelligence.",
  },
  {
    id: "synthesis",
    label: "3 · Evidence synthesis",
    summary: "Consolidate all evidence and run Pro-Fraud vs Pro-Customer debate.",
  },
  {
    id: "decision",
    label: "4 · Decision & explainability",
    summary: "Arbitrate the final outcome, compute risk score, and generate explanations.",
  },
];

export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  TransactionContextAgent: {
    name: "TransactionContextAgent",
    shortLabel: "Context",
    phase: "analysis",
    description: "Analyzes amount, time, country, device, and channel vs customer habits.",
    role: "Deterministic signal detection",
  },
  BehavioralPatternAgent: {
    name: "BehavioralPatternAgent",
    shortLabel: "Behavior",
    phase: "analysis",
    description: "Compares spending patterns and flags deviations from historical behavior.",
    role: "Behavioral profiling",
  },
  InternalPolicyRagAgent: {
    name: "InternalPolicyRagAgent",
    shortLabel: "Policy RAG",
    phase: "intelligence",
    description: "Retrieves relevant internal fraud policies and maps rules to current signals.",
    role: "Internal knowledge (RAG)",
  },
  ExternalThreatIntelAgent: {
    name: "ExternalThreatIntelAgent",
    shortLabel: "Web intel",
    phase: "intelligence",
    description: "Runs governed web search for merchant and country threat indicators.",
    role: "External threat intel",
  },
  EvidenceAggregationAgent: {
    name: "EvidenceAggregationAgent",
    shortLabel: "Aggregation",
    phase: "synthesis",
    description: "Merges signals, policy matches, and external citations into one evidence bundle.",
    role: "Evidence consolidation",
  },
  DebateAgents: {
    name: "DebateAgents",
    shortLabel: "Debate",
    phase: "synthesis",
    description: "Pro-Fraud and Pro-Customer agents argue the case before the arbiter decides.",
    role: "Adversarial reasoning (LLM)",
  },
  DecisionArbiterAgent: {
    name: "DecisionArbiterAgent",
    shortLabel: "Arbiter",
    phase: "decision",
    description: "Applies business rules and outputs APPROVE, CHALLENGE, BLOCK, or ESCALATE.",
    role: "Final decision + risk score",
  },
  ExplainabilityAgent: {
    name: "ExplainabilityAgent",
    shortLabel: "Explain",
    phase: "decision",
    description: "Generates customer-facing and audit-ready natural language explanations.",
    role: "Explainability (LLM)",
  },
};

export function getAgentDefinition(agentName: string): AgentDefinition {
  return (
    AGENT_DEFINITIONS[agentName] ?? {
      name: agentName,
      shortLabel: agentName,
      phase: "decision",
      description: "Pipeline agent step.",
      role: "Agent",
    }
  );
}
