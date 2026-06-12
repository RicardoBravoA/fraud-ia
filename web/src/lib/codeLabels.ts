export interface CodeLabelInfo {
  code: string;
  label: string;
  hint?: string;
}

export const CUSTOMER_NAMES: Record<string, string> = {
  "CU-001": "María López",
  "CU-002": "Carlos Ruiz",
  "CU-003": "Ana Torres",
};

export const DEVICE_LABELS: Record<string, string> = {
  "D-01": "Chrome on MacBook",
  "D-02": "Mobile app (Android)",
  "D-03": "Mobile app (iOS)",
  "D-99": "Unknown browser (first use)",
};

export const MERCHANT_NAMES: Record<string, string> = {
  "M-001": "Retail Plaza Lima",
  "M-002": "TechStore PE",
  "M-003": "Luxury Imports",
  "M-004": "Global Shop US",
};

export const POLICY_TITLES: Record<string, string> = {
  "FP-01": "High amount and unusual hours",
  "FP-02": "International + new device",
  "FP-03": "Extreme amount spike",
  "FP-04": "High-risk merchant amount",
};

export const COUNTRY_NAMES: Record<string, string> = {
  PE: "Peru",
  US: "United States",
};

export const SIGNAL_LABELS: Record<string, string> = {
  "Monto fuera de rango": "Amount above usual range",
  "Horario no habitual": "Unusual transaction hour",
  "País no habitual": "Unusual country",
  "Dispositivo no habitual": "Unusual device",
  "Dispositivo nuevo": "New device for customer",
};

export const TRANSACTION_SCENARIOS: Record<string, string> = {
  "T-1001": "Challenge · amount + hours",
  "T-1002": "High amount · late night",
  "T-1003": "Clean profile match",
  "T-1004": "Block · extreme amount",
  "T-1005": "Escalate · US + new device",
};

export function getCustomerName(customerId: string, apiName?: string | null): string | undefined {
  return apiName ?? CUSTOMER_NAMES[customerId];
}

export function getDeviceLabel(deviceId: string, apiLabel?: string | null): string | undefined {
  return apiLabel ?? DEVICE_LABELS[deviceId];
}

export function getMerchantName(merchantId: string, apiName?: string | null): string | undefined {
  return apiName ?? MERCHANT_NAMES[merchantId];
}

export function getPolicyTitle(policyId: string, apiTitle?: string | null): string | undefined {
  return apiTitle ?? POLICY_TITLES[policyId];
}

export function formatCountry(code: string): CodeLabelInfo {
  const name = COUNTRY_NAMES[code];
  return { code, label: name ? `${name} (${code})` : code };
}

export function formatSignal(signal: string): CodeLabelInfo {
  const label = SIGNAL_LABELS[signal];
  return label ? { code: signal, label, hint: signal } : { code: signal, label: signal };
}

export function formatCodeWithLabel(
  code: string,
  label?: string | null,
  hint?: string,
): CodeLabelInfo {
  return label ? { code, label, hint } : { code, label: code };
}
