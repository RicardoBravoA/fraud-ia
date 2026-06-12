import type { EvaluationResult, TransactionContext } from "@/types/evaluation";
import {
  buildHitlThresholdRows,
  buildPolicyThresholdRows,
} from "@/lib/auditThresholds";

export function PolicyThresholdsCard({
  context,
  evaluation,
}: {
  context: TransactionContext;
  evaluation: EvaluationResult;
}) {
  const policyRows = buildPolicyThresholdRows(context, evaluation);
  const hitlRows = buildHitlThresholdRows(evaluation);
  const triggeredPolicies = policyRows.filter((row) => row.triggered);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">Policy thresholds & limits</h3>
        <p className="mt-1 text-sm text-slate-600">
          Baselines from customer profile and fraud policies — min/max bands compared to this
          transaction.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Policy</th>
              <th className="px-4 py-3 font-semibold">Baseline / limit</th>
              <th className="px-4 py-3 font-semibold">Observed</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {policyRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">
                      {row.id} · {row.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{row.rule}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700">
                    <p>{row.baseline}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Limit: {row.limit}</p>
                  </td>
                  <td className="px-4 py-3 align-top font-medium text-slate-900">{row.observed}</td>
                  <td className="px-4 py-3 align-top">
                    <ThresholdBadge triggered={row.triggered} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-6 py-4">
        <h4 className="text-sm font-semibold text-slate-900">HITL queue thresholds</h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {hitlRows.map((row) => (
            <li
              key={row.label}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <p className="font-medium text-slate-900">{row.label}</p>
              <p className="mt-1 text-xs text-slate-500">Expected: {row.baseline}</p>
              <p className="mt-0.5 text-xs text-slate-700">Observed: {row.observed}</p>
              <div className="mt-2">
                <ThresholdBadge triggered={row.triggered} triggeredLabel="Queued" notTriggeredLabel="Not queued" />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          {triggeredPolicies.length
            ? `${triggeredPolicies.length} policy rule(s) triggered for this transaction.`
            : "No fraud policy rules triggered — transaction stayed within policy bands."}
        </p>
      </div>
    </section>
  );
}

function ThresholdBadge({
  triggered,
  triggeredLabel = "Triggered",
  notTriggeredLabel = "Not triggered",
}: {
  triggered: boolean;
  triggeredLabel?: string;
  notTriggeredLabel?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        triggered
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {triggered ? triggeredLabel : notTriggeredLabel}
    </span>
  );
}
