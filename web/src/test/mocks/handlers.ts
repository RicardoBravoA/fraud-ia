import { http, HttpResponse } from "msw";

import type { EvaluationResult, Transaction } from "@/types/evaluation";

export const mockTransactions: Transaction[] = [
  {
    transaction_id: "T-1003",
    customer_id: "CU-001",
    amount: 450,
    currency: "PEN",
    country: "PE",
    channel: "web",
    device_id: "D-01",
    timestamp: "2025-12-17T10:00:00",
    merchant_id: "M-001",
    evaluated: false,
  },
];

export const mockEvaluation: EvaluationResult = {
  transaction_id: "T-1003",
  decision: "APPROVE",
  confidence: 0.08,
  signals: [],
  citations_internal: [
    {
      policy_id: "FP-01",
      chunk_id: "1",
      version: "2025.1",
      rule: "Monto > 3x promedio habitual y horario fuera de rango → CHALLENGE",
    },
  ],
  citations_external: [
    {
      url: "https://security.example.com/alerts/M-001",
      summary: "Recent fraud alert associated with merchant M-001 in PE",
    },
  ],
  explanation_customer: "Your transaction was approved. No significant risk signals detected.",
  explanation_audit:
    "Policies applied: none. Agent route: TransactionContextAgent → BehavioralPatternAgent → InternalPolicyRagAgent → ExternalThreatIntelAgent → EvidenceAggregationAgent → DebateAgents → DecisionArbiterAgent → ExplainabilityAgent → Decision. LLM: Analysis completed based on available signals and policies.",
  matched_policies: [],
  transaction_context: {
    transaction: mockTransactions[0],
    customer_profile: {
      customer_id: "CU-001",
      usual_amount_avg: 500,
      usual_hours: "08-20",
      usual_countries: "PE",
      usual_devices: "D-01",
    },
    merchant: {
      merchant_id: "M-001",
      name: "Retail Plaza Lima",
      category: "retail",
      risk_level: "low",
    },
    amount_ratio: 0.9,
    device_is_new: false,
    transaction_hour: 10,
    customer_name: "María López",
    device_label: "Chrome on MacBook",
  },
  agent_trace: [
    {
      agent_name: "TransactionContextAgent",
      findings: { signals: [], amount_ratio: 0.9 },
      confidence_delta: 0,
      timestamp: "2026-06-10T23:00:00Z",
    },
    {
      agent_name: "InternalPolicyRagAgent",
      findings: { matched_policies: [] },
      confidence_delta: 0,
      timestamp: "2026-06-10T23:00:02Z",
    },
    {
      agent_name: "BehavioralPatternAgent",
      findings: { behavioral_flags: [], device_is_new: false },
      confidence_delta: 0,
      timestamp: "2026-06-10T23:00:01Z",
    },
    {
      agent_name: "DebateAgents",
      findings: {
        pro_fraud: "No strong fraud indicators.",
        pro_customer: "Customer profile matches transaction.",
      },
      confidence_delta: 0,
      timestamp: "2026-06-10T23:00:05Z",
    },
    {
      agent_name: "DecisionArbiterAgent",
      findings: { decision: "APPROVE", confidence: 0.08, raw_risk_score: 0.08 },
      confidence_delta: 0,
      timestamp: "2026-06-10T23:00:06Z",
    },
  ],
};

export const handlers = [
  http.get("http://localhost:8000/health", () =>
    HttpResponse.json({ status: "ok", database: "connected" }),
  ),
  http.get("http://localhost:8000/api/transactions", () =>
    HttpResponse.json(mockTransactions),
  ),
  http.post("http://localhost:8000/api/transactions/:id/evaluate", () =>
    HttpResponse.json(mockEvaluation),
  ),
  http.get("http://localhost:8000/api/evaluations/:id", ({ params }) => {
    if (params.id === "T-404") {
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(mockEvaluation);
  }),
  http.get("http://localhost:8000/api/hitl/queue", () => HttpResponse.json([])),
  http.get("http://localhost:8000/api/audit/:id", ({ params }) => {
    if (params.id === "T-404") {
      return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    }
    return HttpResponse.json([
      {
        transaction_id: String(params.id),
        agent_name: "TransactionContextAgent",
        action: "agent_completed",
        payload: { findings: {} },
        timestamp: "2026-06-10T23:00:00Z",
      },
    ]);
  }),
];
