import type { Decision } from "@/types/evaluation";

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDecisionLabel(decision: Decision): string {
  const labels: Record<Decision, string> = {
    APPROVE: "Approved",
    CHALLENGE: "Challenge",
    BLOCK: "Blocked",
    ESCALATE_TO_HUMAN: "Escalated",
  };
  return labels[decision];
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
