import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionBadge } from "@/components/DecisionBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

describe("UI components", () => {
  it("renders decision badge", () => {
    render(<DecisionBadge decision="APPROVE" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders confidence bar", () => {
    render(<ConfidenceBar confidence={0.65} decision="CHALLENGE" />);
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<LoadingState message="Please wait" />);
    expect(screen.getByRole("status")).toHaveTextContent("Please wait");
  });

  it("renders error state", () => {
    render(<ErrorState error={new Error("API failure")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("API failure");
  });

  it("renders empty state", () => {
    render(<EmptyState title="Empty" description="No data" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});
