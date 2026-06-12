import { Link, useParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EvaluationDetail } from "@/components/EvaluationDetail";
import { LoadingState } from "@/components/LoadingState";
import { PipelineFlow } from "@/components/PipelineFlow";
import { useEvaluateTransaction } from "@/hooks/useMutations";
import { useEvaluation } from "@/hooks/useQueries";
import { ApiError } from "@/api/client";

export function EvaluationPage() {
  const { transactionId = "" } = useParams();
  const evaluation = useEvaluation(transactionId);
  const evaluate = useEvaluateTransaction();

  const notFound =
    evaluation.error instanceof ApiError && evaluation.error.status === 404;

  const handleEvaluate = () => {
    evaluate.mutate(transactionId, {
      onSuccess: () => evaluation.refetch(),
    });
  };

  if (!transactionId) {
    return <EmptyState title="Transaction not specified" />;
  }

  if (evaluation.isLoading) {
    return <LoadingState message="Loading evaluation…" />;
  }

  if (evaluation.isError && !notFound) {
    return <ErrorState error={evaluation.error} />;
  }

  if (notFound || !evaluation.data) {
    return (
      <div className="space-y-8">
        <section>
          <Link to="/transactions" className="text-sm font-medium text-bcp-navy underline">
            ← Back to transactions
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{transactionId}</h2>
          <p className="mt-1 text-slate-600">This transaction has not been evaluated yet.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">What happens when you evaluate?</h3>
          <p className="mt-2 text-sm text-slate-600">
            The backend runs 8 specialized agents in sequence: signal analysis → policy RAG →
            web intel → evidence aggregation → debate → arbiter → explainability.
          </p>
          <div className="mt-4">
            <PipelineFlow trace={[]} />
          </div>
        </section>

        <button
          type="button"
          onClick={handleEvaluate}
          disabled={evaluate.isPending}
          className="rounded-lg bg-bcp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          {evaluate.isPending ? "Running pipeline…" : "Run multi-agent evaluation"}
        </button>
        {evaluate.isError ? <ErrorState error={evaluate.error} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <Link to="/transactions" className="text-sm font-medium text-bcp-navy underline">
          ← Back to transactions
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Fraud evaluation</h2>
        <p className="mt-1 text-sm text-slate-600">
          Multi-agent analysis for <strong>{transactionId}</strong>
        </p>
      </section>
      <EvaluationDetail evaluation={evaluation.data} />
    </div>
  );
}
