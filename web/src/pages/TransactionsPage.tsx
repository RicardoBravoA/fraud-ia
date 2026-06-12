import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiAbortError } from "@/api/client";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { TransactionTable } from "@/components/TransactionTable";
import { useEvaluatePendingTransactions, useEvaluateTransaction } from "@/hooks/useMutations";
import { useTransactions } from "@/hooks/useQueries";

export function TransactionsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useTransactions();
  const evaluate = useEvaluateTransaction();
  const evaluatePending = useEvaluatePendingTransactions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkCancelled, setBulkCancelled] = useState(false);
  const bulkAbortRef = useRef<AbortController | null>(null);

  const pending = useMemo(
    () => (data ?? []).filter((tx) => !tx.evaluated),
    [data],
  );

  const isBusy = Boolean(activeId) || evaluatePending.isPending;

  const handleEvaluate = async (transactionId: string) => {
    setActiveId(transactionId);
    try {
      await evaluate.mutateAsync(transactionId);
      navigate(`/evaluations/${transactionId}`);
    } finally {
      setActiveId(null);
    }
  };

  const handleEvaluateAllPending = async () => {
    if (!pending.length || isBusy) return;

    setBulkErrors([]);
    setBulkCancelled(false);
    bulkAbortRef.current = new AbortController();

    try {
      const result = await evaluatePending.mutateAsync(bulkAbortRef.current.signal);
      if (result.errors.length) {
        setBulkErrors(
          result.errors.map(
            (entry) => `${entry.transaction_id}: ${entry.error}`,
          ),
        );
      }
      await refetch();
    } catch (error) {
      if (error instanceof ApiAbortError) {
        setBulkCancelled(true);
        evaluatePending.reset();
        await refetch();
        return;
      }
      // ErrorState below handles other mutation failures.
    } finally {
      bulkAbortRef.current = null;
    }
  };

  const handleCancelBulkEvaluate = () => {
    bulkAbortRef.current?.abort();
  };

  if (isLoading) {
    return <LoadingState message="Loading transactions…" />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No transactions"
        description="Run the backend seed script to load the demo dataset."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
          <p className="mt-1 text-slate-600">
            Seed data (T-*) and inserted rows (SIM-*). <strong>Evaluate</strong> runs the 8-agent
            pipeline with Ollama (~1 min each).
          </p>
        </div>
        {pending.length > 0 ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleEvaluateAllPending()}
            className="shrink-0 rounded-lg bg-bcp-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {evaluatePending.isPending
              ? `Analyzing ${pending.length} pending…`
              : `Evaluate all pending (${pending.length})`}
          </button>
        ) : null}
      </section>

      {evaluatePending.isPending ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">
                Running LLM analysis for {pending.length} transaction
                {pending.length === 1 ? "" : "s"} — this may take several minutes with Ollama.
              </p>
              <p className="mt-1 text-xs text-amber-900/80">
                Cancel stops waiting in the browser. Evaluations already started on the server may
                still finish.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelBulkEvaluate}
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-200">
            <div className="h-full w-full animate-pulse rounded-full bg-bcp-orange" />
          </div>
        </div>
      ) : null}

      {bulkCancelled ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Bulk evaluation cancelled. Refresh the list to see any transactions that finished on the
          server.
        </div>
      ) : null}

      {bulkErrors.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          <p className="font-semibold">Some evaluations failed</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
            {bulkErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evaluate.isError ? <ErrorState error={evaluate.error} /> : null}
      {evaluatePending.isError ? <ErrorState error={evaluatePending.error} /> : null}

      <TransactionTable
        transactions={data}
        evaluatingId={activeId}
        bulkEvaluatingId={evaluatePending.isPending ? "bulk" : null}
        onEvaluate={handleEvaluate}
        onView={(transactionId) => navigate(`/evaluations/${transactionId}`)}
      />
    </div>
  );
}
