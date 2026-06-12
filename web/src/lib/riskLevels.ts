export interface RiskLevel {
  label: string;
  description: string;
  badge: string;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.85) {
    return {
      label: "Critical",
      description: "Strong fraud indicators — block or manual review recommended.",
      badge: "bg-red-100 text-red-800 border-red-200",
    };
  }
  if (score >= 0.55) {
    return {
      label: "Elevated",
      description: "Multiple risk signals — challenge, escalate, or HITL review.",
      badge: "bg-amber-100 text-amber-900 border-amber-200",
    };
  }
  if (score >= 0.30) {
    return {
      label: "Moderate",
      description: "Some activity detected — monitor or apply step-up controls.",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
    };
  }
  return {
    label: "Low",
    description: "No significant fraud signals — typical approve range.",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
}
