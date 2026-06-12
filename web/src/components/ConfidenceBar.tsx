import type { Decision } from "@/types/evaluation";
import { getDecisionStyle } from "@/lib/decisionColors";
import { formatConfidence } from "@/lib/formatters";

export function ConfidenceBar({
  confidence,
  decision,
}: {
  confidence: number;
  decision?: Decision;
}) {
  const width = `${Math.min(Math.max(confidence, 0), 1) * 100}%`;
  const barColor = decision ? getDecisionStyle(decision).bar : "bg-bcp-navy";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Risk score</span>
        <span className="font-semibold text-slate-900">{formatConfidence(confidence)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width }} />
      </div>
    </div>
  );
}
