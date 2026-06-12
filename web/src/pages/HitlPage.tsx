import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { HitlCaseCard } from "@/components/HitlCaseCard";
import { LoadingState } from "@/components/LoadingState";
import { useResolveHitlCase } from "@/hooks/useMutations";
import { useHitlQueue } from "@/hooks/useQueries";

export function HitlPage() {
  const { data, isLoading, error } = useHitlQueue();
  const resolve = useResolveHitlCase();

  if (isLoading) {
    return <LoadingState message="Loading HITL queue…" />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="Queue is empty"
        description="Evaluate transactions with low confidence or ESCALATE_TO_HUMAN to create cases."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">HITL queue</h2>
        <p className="mt-1 text-slate-600">Cases pending human review ({data.length}).</p>
      </section>

      {resolve.isError ? <ErrorState error={resolve.error} /> : null}

      <div className="grid gap-4">
        {data.map((hitlCase) => (
          <HitlCaseCard
            key={hitlCase.case_id}
            hitlCase={hitlCase}
            isResolving={resolve.isPending}
            onResolve={(caseId, action, note) =>
              resolve.mutate({ caseId, action, reviewerNote: note })
            }
          />
        ))}
      </div>
    </div>
  );
}
