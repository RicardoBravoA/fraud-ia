import { describe, expect, it } from "vitest";

import { api, ApiError } from "@/api/client";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

describe("api client", () => {
  it("fetches health", async () => {
    const health = await api.getHealth();
    expect(health.status).toBe("ok");
  });

  it("lists transactions", async () => {
    const txs = await api.listTransactions();
    expect(txs[0].transaction_id).toBe("T-1003");
  });

  it("evaluates transaction", async () => {
    const result = await api.evaluateTransaction("T-1003");
    expect(result.decision).toBe("APPROVE");
  });

  it("throws ApiError on failure", async () => {
    server.use(
      http.get("http://localhost:8000/api/evaluations/:id", () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 }),
      ),
    );

    await expect(api.getEvaluation("T-404")).rejects.toBeInstanceOf(ApiError);
  });
});
