import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useInsertNextTransaction, useInsertTransaction } from "@/hooks/useMutations";
import { useSimulatorScenarios } from "@/hooks/useQueries";
import { TRANSACTION_SCENARIOS } from "@/lib/codeLabels";
import type { SimulatorInsertResult, SimulatorScenario } from "@/types/evaluation";

interface FeedEntry {
  id: string;
  templateId: string;
  transactionId: string;
  status: "inserted" | "error";
  message: string;
  amount?: string;
  at: string;
}

export function InsertPage() {
  const { data: scenarios, isLoading, error, refetch } = useSimulatorScenarios();
  const insert = useInsertTransaction();
  const insertNext = useInsertNextTransaction();
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [autoInsert, setAutoInsert] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoIndexRef = useRef(0);

  const totalInserts = scenarios?.reduce((sum, s) => sum + s.runs_count, 0) ?? 0;

  const appendFeed = useCallback((entry: FeedEntry) => {
    setFeed((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const handleInsertResult = useCallback(
    (result: SimulatorInsertResult) => {
      appendFeed({
        id: `${result.transaction_id}-${Date.now()}`,
        templateId: result.source_template,
        transactionId: result.transaction_id,
        status: "inserted",
        message: result.message,
        amount: `${result.transaction.amount.toLocaleString()} ${result.transaction.currency}`,
        at: result.inserted_at,
      });
    },
    [appendFeed],
  );

  const runInsert = useCallback(
    async (templateId: string, via: "manual" | "auto" | "next") => {
      if (busy) return;
      setBusy(true);
      try {
        const result =
          via === "next" ? await insertNext.mutateAsync() : await insert.mutateAsync(templateId);
        handleInsertResult(result);
        await refetch();
      } catch (err) {
        appendFeed({
          id: `err-${Date.now()}`,
          templateId: templateId || "—",
          transactionId: "—",
          status: "error",
          message: err instanceof Error ? err.message : "Insert failed",
          at: new Date().toISOString(),
        });
      } finally {
        setBusy(false);
      }
    },
    [appendFeed, busy, handleInsertResult, insert, insertNext, refetch],
  );

  useEffect(() => {
    if (!autoInsert || !scenarios?.length) return;

    const tick = () => {
      if (busy) return;
      const template = scenarios[autoIndexRef.current % scenarios.length];
      autoIndexRef.current += 1;
      void runInsert(template.template_id, "auto");
    };

    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [autoInsert, scenarios, busy, runInsert]);

  if (isLoading) {
    return <LoadingState message="Loading insert scenarios…" />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-bcp-navy">
          Transaction ingress
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Insert</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Creates new SIM-* rows in MongoDB from demo templates. Each insert uses varied amounts
          and timestamps.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Rows inserted</p>
          <p className="text-2xl font-bold text-bcp-navy">{totalInserts}</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !scenarios?.length}
            onClick={() => void runInsert("", "next")}
            className="rounded-lg bg-bcp-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Inserting…" : "Insert next scenario"}
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={autoInsert}
              onChange={(e) => setAutoInsert(e.target.checked)}
              disabled={busy}
            />
            Auto-insert every 15s
          </label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Scenario templates
          </h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {scenarios?.map((scenario) => (
              <ScenarioInsertCard
                key={scenario.template_id}
                scenario={scenario}
                busy={busy}
                onInsert={() => void runInsert(scenario.template_id, "manual")}
              />
            ))}
          </ul>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Insert log</h3>
          <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto">
            {feed.length === 0 ? (
              <li className="text-sm text-slate-500">No inserts yet.</li>
            ) : (
              feed.map((entry) => (
                <li
                  key={entry.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    entry.status === "inserted"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <p className="font-mono text-xs font-semibold">{entry.transactionId}</p>
                  <p className="text-[10px] text-slate-500">from {entry.templateId}</p>
                  {entry.amount ? (
                    <p className="mt-1 text-xs font-medium">{entry.amount}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-600">{entry.message}</p>
                </li>
              ))
            )}
          </ul>
        </aside>
      </section>
    </div>
  );
}

function ScenarioInsertCard({
  scenario,
  busy,
  onInsert,
}: {
  scenario: SimulatorScenario;
  busy: boolean;
  onInsert: () => void;
}) {
  const { template, variation } = scenario;
  const amountRange =
    variation.amount_min !== null && variation.amount_max !== null
      ? `${variation.amount_min.toLocaleString()} – ${variation.amount_max.toLocaleString()} ${template.currency}`
      : `${template.amount.toLocaleString()} ${template.currency}`;

  return (
    <li className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="font-semibold text-slate-900">{scenario.template_id}</p>
        <p className="text-xs text-slate-500">
          {TRANSACTION_SCENARIOS[scenario.template_id] ?? scenario.label}
        </p>
      </div>
      <div className="space-y-2 px-4 py-3 text-sm">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
          <strong>Will insert:</strong> {amountRange} · {variation.hour_hint}
        </p>
        <p className="text-xs text-slate-500">{scenario.runs_count} rows inserted</p>
      </div>
      <div className="mt-auto border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          disabled={busy}
          onClick={onInsert}
          className="w-full rounded-lg bg-bcp-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Insert transaction
        </button>
      </div>
    </li>
  );
}
