import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    retry: 1,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: api.listTransactions,
  });
}

export function useEvaluation(transactionId: string, enabled = true) {
  return useQuery({
    queryKey: ["evaluation", transactionId],
    queryFn: () => api.getEvaluation(transactionId),
    enabled: Boolean(transactionId) && enabled,
    retry: false,
  });
}

export function useHitlQueue() {
  return useQuery({
    queryKey: ["hitl-queue"],
    queryFn: api.getHitlQueue,
  });
}

export function useAuditTrail(transactionId: string, enabled = true) {
  return useQuery({
    queryKey: ["audit", transactionId],
    queryFn: () => api.getAuditTrail(transactionId),
    enabled: Boolean(transactionId) && enabled,
    retry: false,
  });
}

export function useSimulatorScenarios() {
  return useQuery({
    queryKey: ["simulator-scenarios"],
    queryFn: api.getSimulatorScenarios,
  });
}
