export type Decision = "APPROVE" | "CHALLENGE" | "BLOCK" | "ESCALATE_TO_HUMAN";

export type HitlAction = "APPROVED" | "REJECTED" | "ESCALATED";

export interface InternalCitation {
  policy_id: string;
  chunk_id: string;
  version: string;
  rule?: string;
}

export interface MatchedPolicy {
  policy_id: string;
  title?: string;
  rule: string;
  version: string;
  recommended_action: string;
  triggered_by: string[];
}

export interface ExternalCitation {
  url: string;
  summary: string;
}

export interface AgentTraceEntry {
  agent_name: string;
  findings: Record<string, unknown>;
  confidence_delta: number;
  timestamp: string;
}

export interface EvaluationResult {
  transaction_id?: string;
  decision: Decision;
  confidence: number;
  signals: string[];
  citations_internal: InternalCitation[];
  citations_external: ExternalCitation[];
  explanation_customer: string;
  explanation_audit: string;
  matched_policies?: MatchedPolicy[];
  transaction_context?: TransactionContext | null;
  agent_trace: AgentTraceEntry[];
}

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  country: string;
  channel: string;
  device_id: string;
  timestamp: string;
  merchant_id: string;
  evaluated?: boolean;
}

export interface CustomerProfile {
  customer_id: string;
  usual_amount_avg: number;
  usual_hours: string;
  usual_countries: string;
  usual_devices: string;
}

export interface MerchantProfile {
  merchant_id: string;
  name: string;
  category: string;
  risk_level: string;
  risk_reason?: string | null;
}

export interface TransactionContext {
  transaction: Transaction;
  customer_profile: CustomerProfile;
  merchant?: MerchantProfile | null;
  amount_ratio: number;
  device_is_new: boolean;
  transaction_hour: number;
  customer_name?: string | null;
  device_label?: string | null;
}

export interface HitlCase {
  case_id: string;
  transaction_id: string;
  status: string;
  decision_original: string;
  confidence: number;
  created_at: string;
  resolved_at?: string | null;
  reviewer_note?: string | null;
}

export interface AuditEvent {
  transaction_id: string;
  agent_name: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SimulatorVariation {
  amount_min: number | null;
  amount_max: number | null;
  hour_hint: string;
  unique_fields: string[];
}

export interface SimulatorScenario {
  template_id: string;
  label: string;
  expected_decision: string;
  runs_count: number;
  last_simulated_id: string | null;
  template: Transaction;
  variation: SimulatorVariation;
}

export interface SimulatorStatus {
  total_scenarios: number;
  total_simulated_runs: number;
  next_template_id: string | null;
  auto_feed_order: string[];
}

export interface SimulatorInsertResult {
  transaction_id: string;
  source_template: string;
  transaction: Transaction;
  variation_fingerprint: string;
  inserted_at: string;
  message: string;
}

export interface HealthStatus {
  status: string;
  database: string;
}

export interface BulkEvaluateError {
  transaction_id: string;
  error: string;
}

export interface BulkEvaluateResult {
  evaluated_count: number;
  skipped_count: number;
  pending_before: number;
  results: EvaluationResult[];
  errors: BulkEvaluateError[];
}
