import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuditTrailDetail } from "@/components/AuditTrailDetail";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuditTrail, useEvaluation } from "@/hooks/useQueries";
import { ApiError } from "@/api/client";

export function AuditPage() {
  const { transactionId: routeId } = useParams();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(routeId ?? "");
  const activeId = routeId ?? "";
  const audit = useAuditTrail(activeId, Boolean(activeId));
  const evaluation = useEvaluation(activeId, Boolean(activeId) && audit.isSuccess);

  useEffect(() => {
    if (routeId) {
      setInputId(routeId);
    }
  }, [routeId]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = inputId.trim();
    if (trimmed) {
      navigate(`/audit/${trimmed}`);
    }
  };

  const isLoading = Boolean(activeId) && (audit.isLoading || evaluation.isLoading);
  const showRichDetail = Boolean(activeId && audit.data && evaluation.data);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Audit trail</h2>
        <p className="mt-1 text-slate-600">
          Profile baselines, policy limits, agent pass/fail status, and HITL events per
          transaction.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
      >
        <label className="flex-1 text-sm">
          <span className="font-medium text-slate-700">Transaction ID</span>
          <input
            value={inputId}
            onChange={(event) => setInputId(event.target.value)}
            placeholder="T-1003"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-lg bg-bcp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
        >
          Search
        </button>
      </form>

      {!activeId ? (
        <EmptyState
          title="Enter a transaction ID"
          description="Try T-1001, T-1003, T-1004, or T-1005 after evaluating them."
        />
      ) : null}

      {activeId && isLoading ? <LoadingState message="Loading audit trail…" /> : null}

      {activeId && audit.isError ? (
        <ErrorState
          error={
            audit.error instanceof ApiError && audit.error.status === 404
              ? new Error(`No audit trail for ${activeId}. Evaluate the transaction first.`)
              : audit.error
          }
        />
      ) : null}

      {activeId && audit.data && evaluation.isError ? (
        <ErrorState
          error={
            evaluation.error instanceof ApiError && evaluation.error.status === 404
              ? new Error(`Audit events exist but evaluation data is missing for ${activeId}.`)
              : evaluation.error
          }
        />
      ) : null}

      {showRichDetail && evaluation.data && audit.data ? (
        <section className="space-y-4">
          <div className="flex items-center justify-end">
            <Link
              to={`/evaluations/${activeId}`}
              className="text-sm font-medium text-bcp-navy underline"
            >
              View evaluation report
            </Link>
          </div>
          <AuditTrailDetail evaluation={evaluation.data} auditEvents={audit.data} />
        </section>
      ) : null}
    </div>
  );
}
