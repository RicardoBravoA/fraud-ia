import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useEvaluateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => api.evaluateTransaction(transactionId),
    onSuccess: (data, transactionId) => {
      queryClient.setQueryData(["evaluation", transactionId], data);
      queryClient.invalidateQueries({ queryKey: ["hitl-queue"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useEvaluatePendingTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (signal?: AbortSignal) => api.evaluatePendingTransactions(signal),
    onSuccess: (data) => {
      for (const result of data.results) {
        if (result.transaction_id) {
          queryClient.setQueryData(["evaluation", result.transaction_id], result);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["hitl-queue"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useInsertTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => api.insertTransaction(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useInsertNextTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.insertNextTransaction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useResolveHitlCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      action,
      reviewerNote,
    }: {
      caseId: string;
      action: "APPROVED" | "REJECTED" | "ESCALATED";
      reviewerNote?: string;
    }) => api.resolveHitlCase(caseId, action, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hitl-queue"] });
    },
  });
}
