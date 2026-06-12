import type { TransactionContext } from "@/types/evaluation";
import {
  formatCodeWithLabel,
  formatCountry,
  getDeviceLabel,
} from "@/lib/codeLabels";
import { getAgentTraceStatusStyles } from "@/lib/agentTraceStatus";

export interface ProfileComparisonRow {
  label: string;
  observed: string;
  baseline: string;
  status: "ok" | "warning" | "critical";
  detail?: string;
}

export interface ProfileComparisonSummary {
  total: number;
  flagged: number;
  critical: number;
  warning: number;
}

export function buildProfileComparisons(context: TransactionContext): ProfileComparisonRow[] {
  const {
    transaction,
    customer_profile,
    amount_ratio,
    device_is_new,
    transaction_hour,
    device_label,
  } = context;
  const usualCountries = customer_profile.usual_countries.split(",").map((c) => c.trim());
  const usualDevices = customer_profile.usual_devices.split(",").map((d) => d.trim());
  const [hourStart, hourEnd] = customer_profile.usual_hours.split("-").map(Number);
  const inUsualHours = hourStart <= transaction_hour && transaction_hour <= hourEnd;

  const amountStatus =
    amount_ratio > 10 ? "critical" : amount_ratio > 3 ? "warning" : "ok";

  const countryStatus = usualCountries.includes(transaction.country) ? "ok" : "critical";

  const deviceStatus = device_is_new ? "critical" : "ok";

  const hourStatus = inUsualHours ? "ok" : "warning";

  const countryInfo = formatCountry(transaction.country);
  const deviceInfo = formatCodeWithLabel(
    transaction.device_id,
    getDeviceLabel(transaction.device_id, device_label),
  );
  const usualCountryLabels = usualCountries
    .map((code) => formatCountry(code).label)
    .join(", ");

  return [
    {
      label: "Amount",
      observed: `${transaction.amount.toLocaleString()} ${transaction.currency}`,
      baseline: `${customer_profile.usual_amount_avg.toLocaleString()} ${transaction.currency} avg`,
      status: amountStatus,
      detail: `${amount_ratio.toFixed(2)}× usual`,
    },
    {
      label: "Country",
      observed: countryInfo.label,
      baseline: usualCountryLabels,
      status: countryStatus,
      detail: countryInfo.code,
    },
    {
      label: "Device",
      observed: deviceInfo.label,
      baseline: usualDevices
        .map((id) => formatCodeWithLabel(id, getDeviceLabel(id)).label)
        .join(", "),
      status: deviceStatus,
      detail: device_is_new ? "New device for customer" : deviceInfo.code,
    },
    {
      label: "Hour",
      observed: `${String(transaction_hour).padStart(2, "0")}:00`,
      baseline: customer_profile.usual_hours.replace("-", "–"),
      status: hourStatus,
    },
  ];
}

export function merchantRiskBadgeClass(riskLevel: string): string {
  switch (riskLevel) {
    case "high":
      return "border-red-200 bg-red-50 text-red-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

const COMPARISON_STATUS_LABELS: Record<ProfileComparisonRow["status"], string> = {
  ok: "Matches",
  warning: "Unusual",
  critical: "Mismatch",
};

export function getComparisonStatusMeta(status: ProfileComparisonRow["status"]) {
  const styles = getAgentTraceStatusStyles(status);
  return {
    label: COMPARISON_STATUS_LABELS[status],
    card: styles.card,
    badge: styles.badge,
  };
}

export function summarizeProfileComparisons(
  rows: ProfileComparisonRow[],
): ProfileComparisonSummary {
  const flagged = rows.filter((row) => row.status !== "ok").length;
  const critical = rows.filter((row) => row.status === "critical").length;
  const warning = rows.filter((row) => row.status === "warning").length;

  return { total: rows.length, flagged, critical, warning };
}
