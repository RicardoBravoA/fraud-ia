import { describe, expect, it } from "vitest";

import { buildProfileComparisons, summarizeProfileComparisons } from "@/lib/transactionContextHelpers";
import type { TransactionContext } from "@/types/evaluation";

const baseContext: TransactionContext = {
  transaction: {
    transaction_id: "T-1001",
    customer_id: "CU-001",
    amount: 1800,
    currency: "PEN",
    country: "PE",
    channel: "web",
    device_id: "D-01",
    timestamp: "2025-12-17T03:15:00",
    merchant_id: "M-001",
  },
  customer_profile: {
    customer_id: "CU-001",
    usual_amount_avg: 500,
    usual_hours: "08-20",
    usual_countries: "PE",
    usual_devices: "D-01",
  },
  merchant: {
    merchant_id: "M-001",
    name: "Retail Plaza Lima",
    category: "retail",
    risk_level: "low",
  },
  amount_ratio: 3.6,
  device_is_new: false,
  transaction_hour: 3,
};

describe("buildProfileComparisons", () => {
  it("flags amount and hour for T-1001-like context", () => {
    const rows = buildProfileComparisons(baseContext);
    const amount = rows.find((row) => row.label === "Amount");
    const hour = rows.find((row) => row.label === "Hour");

    expect(amount?.status).toBe("warning");
    expect(hour?.status).toBe("warning");
  });

  it("flags country and device for international new device", () => {
    const rows = buildProfileComparisons({
      ...baseContext,
      transaction: {
        ...baseContext.transaction,
        country: "US",
        device_id: "D-99",
      },
      device_is_new: true,
      transaction_hour: 14,
    });

    expect(rows.find((row) => row.label === "Country")?.status).toBe("critical");
    expect(rows.find((row) => row.label === "Device")?.status).toBe("critical");
  });

  it("summarizes flagged dimensions", () => {
    const rows = buildProfileComparisons(baseContext);
    expect(summarizeProfileComparisons(rows)).toEqual({
      total: 4,
      flagged: 2,
      critical: 0,
      warning: 2,
    });
  });
});
