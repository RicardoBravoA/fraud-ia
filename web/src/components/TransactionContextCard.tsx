import type { ReactNode } from "react";

import type { TransactionContext } from "@/types/evaluation";
import {
  buildProfileComparisons,
  getComparisonStatusMeta,
  merchantRiskBadgeClass,
  summarizeProfileComparisons,
} from "@/lib/transactionContextHelpers";
import type { ProfileComparisonRow } from "@/lib/transactionContextHelpers";
import { formatDate } from "@/lib/formatters";
import {
  formatCodeWithLabel,
  getCustomerName,
  TRANSACTION_SCENARIOS,
} from "@/lib/codeLabels";
import { CodeLabel } from "@/components/CodeLabel";

export function TransactionContextCard({ context }: { context: TransactionContext }) {
  const { transaction, merchant, customer_name } = context;
  const comparisons = buildProfileComparisons(context);
  const summary = summarizeProfileComparisons(comparisons);
  const customerInfo = formatCodeWithLabel(
    transaction.customer_id,
    getCustomerName(transaction.customer_id, customer_name),
  );
  const scenario = TRANSACTION_SCENARIOS[transaction.transaction_id];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-bcp-navy/5 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-bcp-navy">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bcp-navy text-[10px] font-bold text-white">
                T
              </span>
              Transaction under review
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{transaction.transaction_id}</h3>
            {scenario ? (
              <p className="mt-1 text-sm font-medium text-slate-600">{scenario}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
              {transaction.amount.toLocaleString()}
              <span className="ml-1.5 text-lg font-semibold text-slate-500">
                {transaction.currency}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Transaction amount</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_minmax(220px,280px)]">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaTile label="Customer">
            <CodeLabel info={customerInfo} />
          </MetaTile>
          <MetaTile label="Channel">
            <span className="capitalize text-slate-900">{transaction.channel}</span>
          </MetaTile>
          <MetaTile label="Timestamp">
            <span className="text-slate-900">{formatDate(transaction.timestamp)}</span>
          </MetaTile>
        </dl>

        {merchant ? <MerchantPanel merchant={merchant} /> : null}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/40 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-900">Profile comparison</h4>
            <p className="mt-1 text-xs text-slate-500">
              Compared against the customer&apos;s historical behavior baseline.
            </p>
          </div>
          <ComparisonSummary summary={summary} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {comparisons.map((row) => (
            <ComparisonCard key={row.label} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetaTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function MerchantPanel({
  merchant,
}: {
  merchant: NonNullable<TransactionContext["merchant"]>;
}) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Merchant</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{merchant.name}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {merchant.merchant_id} · {merchant.category}
      </p>
      <span
        className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${merchantRiskBadgeClass(merchant.risk_level)}`}
      >
        {merchant.risk_level} risk
      </span>
      {merchant.risk_reason ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{merchant.risk_reason}</p>
      ) : null}
    </aside>
  );
}

function ComparisonSummary({
  summary,
}: {
  summary: ReturnType<typeof summarizeProfileComparisons>;
}) {
  if (summary.flagged === 0) {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
        All dimensions match profile
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
        {summary.flagged} of {summary.total} flagged
      </span>
      {summary.critical > 0 ? (
        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
          {summary.critical} critical
        </span>
      ) : null}
      {summary.warning > 0 ? (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          {summary.warning} unusual
        </span>
      ) : null}
    </div>
  );
}

function ComparisonCard({ row }: { row: ProfileComparisonRow }) {
  const meta = getComparisonStatusMeta(row.status);

  return (
    <article className={`rounded-xl border p-4 ${meta.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{row.label}</p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <p className="text-[10px] font-medium uppercase text-slate-500">This transaction</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{row.observed}</p>
        </div>
        <div className="border-t border-slate-200/80 pt-2">
          <p className="text-[10px] font-medium uppercase text-slate-500">Customer usual</p>
          <p className="mt-0.5 text-sm text-slate-700">{row.baseline}</p>
        </div>
      </div>

      {row.detail ? (
        <p className="mt-3 rounded-md border border-white/80 bg-white/70 px-2 py-1 text-xs font-medium text-slate-700">
          {row.detail}
        </p>
      ) : null}
    </article>
  );
}
