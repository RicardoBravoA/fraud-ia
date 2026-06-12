import { useState } from "react";

import type { HitlCase } from "@/types/evaluation";
import { DecisionBadge } from "@/components/DecisionBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { formatDate } from "@/lib/formatters";
import type { Decision } from "@/types/evaluation";

interface HitlCaseCardProps {
  hitlCase: HitlCase;
  isResolving: boolean;
  onResolve: (
    caseId: string,
    action: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string,
  ) => void;
}

export function HitlCaseCard({ hitlCase, isResolving, onResolve }: HitlCaseCardProps) {
  const [note, setNote] = useState("");

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Case {hitlCase.case_id}</p>
          <h3 className="text-lg font-semibold text-slate-900">{hitlCase.transaction_id}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Created {formatDate(hitlCase.created_at)} · {hitlCase.status}
          </p>
        </div>
        <DecisionBadge decision={hitlCase.decision_original as Decision} />
      </div>

      <div className="mt-4">
        <ConfidenceBar confidence={hitlCase.confidence} />
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-slate-700">Reviewer note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Optional"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["APPROVED", "REJECTED", "ESCALATED"] as const).map((action) => (
          <button
            key={action}
            type="button"
            disabled={isResolving}
            onClick={() => onResolve(hitlCase.case_id, action, note || undefined)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {action}
          </button>
        ))}
      </div>
    </article>
  );
}
