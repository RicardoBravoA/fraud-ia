import type {
  AuditEvent,
  BulkEvaluateResult,
  EvaluationResult,
  HealthStatus,
  HitlAction,
  HitlCase,
  SimulatorInsertResult,
  SimulatorScenario,
  SimulatorStatus,
  Transaction,
} from "@/types/evaluation";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ApiAbortError extends Error {
  constructor() {
    super("Request cancelled");
    this.name = "ApiAbortError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiAbortError();
    }
    throw error;
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<HealthStatus>("/health"),
  listTransactions: () => request<Transaction[]>("/api/transactions"),
  evaluateTransaction: (transactionId: string) =>
    request<EvaluationResult>(`/api/transactions/${transactionId}/evaluate`, {
      method: "POST",
    }),
  evaluatePendingTransactions: (signal?: AbortSignal) =>
    request<BulkEvaluateResult>("/api/transactions/evaluate-pending", {
      method: "POST",
      signal,
    }),
  getEvaluation: (transactionId: string) =>
    request<EvaluationResult>(`/api/evaluations/${transactionId}`),
  getHitlQueue: () => request<HitlCase[]>("/api/hitl/queue"),
  resolveHitlCase: (caseId: string, action: HitlAction, reviewerNote?: string) =>
    request<HitlCase>(`/api/hitl/${caseId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, reviewer_note: reviewerNote ?? null }),
    }),
  getAuditTrail: (transactionId: string) =>
    request<AuditEvent[]>(`/api/audit/${transactionId}`),
  getSimulatorScenarios: () => request<SimulatorScenario[]>("/api/simulator/scenarios"),
  getSimulatorStatus: () => request<SimulatorStatus>("/api/simulator/status"),
  insertTransaction: (templateId: string) =>
    request<SimulatorInsertResult>(`/api/simulator/insert/${templateId}`, { method: "POST" }),
  insertNextTransaction: () =>
    request<SimulatorInsertResult>("/api/simulator/insert-next", { method: "POST" }),
};
