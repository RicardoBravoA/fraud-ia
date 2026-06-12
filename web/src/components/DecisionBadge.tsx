import type { Decision } from "@/types/evaluation";
import { getDecisionStyle } from "@/lib/decisionColors";
import { formatDecisionLabel } from "@/lib/formatters";

export function DecisionBadge({ decision }: { decision: Decision }) {
  const style = getDecisionStyle(decision);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.badge}`}
    >
      {formatDecisionLabel(decision)}
    </span>
  );
}
