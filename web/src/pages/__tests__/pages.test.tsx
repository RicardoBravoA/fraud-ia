import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { DashboardPage } from "@/pages/DashboardPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { EvaluationPage } from "@/pages/EvaluationPage";
import { HitlPage } from "@/pages/HitlPage";
import { AuditPage } from "@/pages/AuditPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

function renderWithProviders(ui: ReactNode, route = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderRoutedPage(routePattern: string, routeEntry: string, element: ReactNode) {
  renderWithProviders(
    <Routes>
      <Route path={routePattern} element={element} />
    </Routes>,
    routeEntry,
  );
}

describe("pages", () => {
  it("dashboard success", async () => {
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Pending HITL")).toBeInTheDocument();
  });

  it("transactions success", async () => {
    renderWithProviders(<TransactionsPage />);
    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(screen.getAllByText("T-1003").length).toBeGreaterThan(0);
  });

  it("transactions empty", async () => {
    server.use(
      http.get("http://localhost:8000/api/transactions", () => HttpResponse.json([])),
    );
    renderWithProviders(<TransactionsPage />);
    expect(await screen.findByText("No transactions")).toBeInTheDocument();
  });

  it("evaluation success", async () => {
    renderRoutedPage("/evaluations/:transactionId", "/evaluations/T-1003", <EvaluationPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Fraud evaluation" })).toBeInTheDocument();
    });
    expect(screen.getByText(/Your transaction was approved/)).toBeInTheDocument();
    expect(screen.getByText("Policies & evidence")).toBeInTheDocument();
    expect(screen.getByText("Transaction under review")).toBeInTheDocument();
    expect(screen.getByText("Profile comparison")).toBeInTheDocument();
    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.getByText("Multi-agent pipeline")).toBeInTheDocument();
    expect(screen.getByText("Detected signals")).toBeInTheDocument();
    expect(screen.getByText("Audit explanation")).toBeInTheDocument();
  });

  it("evaluation not found", async () => {
    renderRoutedPage("/evaluations/:transactionId", "/evaluations/T-404", <EvaluationPage />);
    expect(
      await screen.findByText("This transaction has not been evaluated yet."),
    ).toBeInTheDocument();
  });

  it("hitl empty", async () => {
    renderWithProviders(<HitlPage />);
    expect(await screen.findByText("Queue is empty")).toBeInTheDocument();
  });

  it("audit empty prompt", async () => {
    renderRoutedPage("/audit", "/audit", <AuditPage />);
    expect(screen.getByText("Enter a transaction ID")).toBeInTheDocument();
  });

  it("audit success", async () => {
    renderRoutedPage("/audit/:transactionId", "/audit/T-1003", <AuditPage />);
    expect(await screen.findByText("Policy thresholds & limits")).toBeInTheDocument();
    expect(screen.getByText("Agent pipeline status")).toBeInTheDocument();
    expect(screen.getByText("Profile comparison")).toBeInTheDocument();
  });
});
