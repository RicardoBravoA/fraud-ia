import type { Transaction } from "@/types/evaluation";
import { CodeLabel } from "@/components/CodeLabel";
import {
  formatCodeWithLabel,
  getCustomerName,
  getMerchantName,
  TRANSACTION_SCENARIOS,
} from "@/lib/codeLabels";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface TransactionTableProps {
  transactions: Transaction[];
  evaluatingId?: string | null;
  bulkEvaluatingId?: string | null;
  onEvaluate: (transactionId: string) => void;
  onView: (transactionId: string) => void;
}

function StatusBadge({ evaluated }: { evaluated: boolean }) {
  return evaluated ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
      Evaluated
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
      Pending
    </span>
  );
}

function ActionButtons({
  tx,
  evaluatingId,
  bulkEvaluatingId,
  onEvaluate,
  onView,
  fullWidth = false,
}: {
  tx: Transaction;
  evaluatingId?: string | null;
  bulkEvaluatingId?: string | null;
  onEvaluate: (transactionId: string) => void;
  onView: (transactionId: string) => void;
  fullWidth?: boolean;
}) {
  const isEvaluating =
    evaluatingId === tx.transaction_id || bulkEvaluatingId === tx.transaction_id;
  const evaluated = Boolean(tx.evaluated);
  const widthClass = fullWidth ? "w-full" : "";

  if (evaluated) {
    return (
      <button
        type="button"
        onClick={() => onView(tx.transaction_id)}
        className={`rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${widthClass}`}
      >
        View
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onEvaluate(tx.transaction_id)}
      disabled={Boolean(evaluatingId || bulkEvaluatingId)}
      className={`rounded-lg bg-bcp-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-60 ${fullWidth ? "w-full py-2 text-sm" : ""}`}
    >
      {isEvaluating ? "Evaluating…" : "Evaluate"}
    </button>
  );
}

export function TransactionTable({
  transactions,
  evaluatingId,
  bulkEvaluatingId,
  onEvaluate,
  onView,
}: TransactionTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["ID", "Status", "Customer", "Amount", "Channel", "Merchant", "Date", "Actions"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const customerInfo = formatCodeWithLabel(
                tx.customer_id,
                getCustomerName(tx.customer_id),
              );
              const merchantInfo = formatCodeWithLabel(
                tx.merchant_id,
                getMerchantName(tx.merchant_id),
              );
              const scenario = TRANSACTION_SCENARIOS[tx.transaction_id];

              return (
                <tr key={tx.transaction_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{tx.transaction_id}</p>
                    {scenario ? (
                      <p className="text-[11px] text-slate-500">{scenario}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge evaluated={Boolean(tx.evaluated)} />
                  </td>
                  <td className="px-4 py-3">
                    <CodeLabel info={customerInfo} />
                  </td>
                  <td className="px-4 py-3">{formatCurrency(tx.amount, tx.currency)}</td>
                  <td className="px-4 py-3 capitalize">{tx.channel}</td>
                  <td className="px-4 py-3">
                    <CodeLabel info={merchantInfo} />
                  </td>
                  <td className="px-4 py-3">{formatDate(tx.timestamp)}</td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      tx={tx}
                      evaluatingId={evaluatingId}
                      bulkEvaluatingId={bulkEvaluatingId}
                      onEvaluate={onEvaluate}
                      onView={onView}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {transactions.map((tx) => {
          const customerInfo = formatCodeWithLabel(
            tx.customer_id,
            getCustomerName(tx.customer_id),
          );
          const merchantInfo = formatCodeWithLabel(
            tx.merchant_id,
            getMerchantName(tx.merchant_id),
          );

          return (
            <article
              key={tx.transaction_id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{tx.transaction_id}</h3>
                    <StatusBadge evaluated={Boolean(tx.evaluated)} />
                  </div>
                  <p className="text-sm text-slate-500">
                    <CodeLabel info={customerInfo} className="inline-block" />
                  </p>
                </div>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(tx.amount, tx.currency)}
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <dt className="font-medium">Channel</dt>
                  <dd className="capitalize">{tx.channel}</dd>
                </div>
                <div>
                  <dt className="font-medium">Merchant</dt>
                  <dd>
                    <CodeLabel info={merchantInfo} />
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-medium">Date</dt>
                  <dd>{formatDate(tx.timestamp)}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <ActionButtons
                  tx={tx}
                  evaluatingId={evaluatingId}
                  bulkEvaluatingId={bulkEvaluatingId}
                  onEvaluate={onEvaluate}
                  onView={onView}
                  fullWidth
                />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
