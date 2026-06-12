import { Link } from "react-router-dom";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useHealth, useHitlQueue, useTransactions } from "@/hooks/useQueries";

export function DashboardPage() {
  const health = useHealth();
  const transactions = useTransactions();
  const hitl = useHitlQueue();

  if (health.isLoading || transactions.isLoading || hitl.isLoading) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (health.isError || transactions.isError || hitl.isError) {
    return <ErrorState error={health.error ?? transactions.error ?? hitl.error} />;
  }

  const pendingHitl = hitl.data?.filter((item) => item.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-slate-600">Overview of the multi-agent fraud detection system.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="API" value={health.data?.status === "ok" ? "Online" : "Degraded"} />
        <StatCard label="Database" value={health.data?.database ?? "—"} />
        <StatCard label="Transactions" value={String(transactions.data?.length ?? 0)} />
        <StatCard label="Pending HITL" value={String(pendingHitl)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickLink
          title="Insert transactions"
          description="Add varied SIM-* rows to MongoDB (no LLM). Analyze from Transactions."
          to="/insert"
        />
        <QuickLink
          title="Evaluate transactions"
          description="Run the multi-agent pipeline on the demo dataset."
          to="/transactions"
        />
        <QuickLink
          title="HITL queue"
          description="Review escalated cases or low-confidence decisions."
          to="/hitl"
        />
        <QuickLink
          title="Audit trail"
          description="Browse full traceability per transaction."
          to="/audit"
        />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-bcp-navy">{value}</p>
    </article>
  );
}

function QuickLink({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-bcp-navy hover:shadow-md"
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
