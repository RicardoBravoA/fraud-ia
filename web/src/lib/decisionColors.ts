import type { Decision } from "@/types/evaluation";

export interface DecisionStyle {
  label: string;
  badge: string;
  bar: string;
}

export const DECISION_STYLES: Record<Decision, DecisionStyle> = {
  APPROVE: {
    label: "APPROVE",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
  },
  CHALLENGE: {
    label: "CHALLENGE",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    bar: "bg-amber-500",
  },
  BLOCK: {
    label: "BLOCK",
    badge: "bg-red-100 text-red-800 border-red-200",
    bar: "bg-red-500",
  },
  ESCALATE_TO_HUMAN: {
    label: "ESCALATE",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
    bar: "bg-violet-500",
  },
};

export function getDecisionStyle(decision: Decision): DecisionStyle {
  return DECISION_STYLES[decision];
}
