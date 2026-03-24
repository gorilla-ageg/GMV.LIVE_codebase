import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "@/components/deals/StatusBadge";
import SystemEventCard from "@/components/deals/SystemEventCard";

describe("StatusBadge", () => {
  it("renders negotiating status", () => {
    render(<StatusBadge status="negotiating" />);
    expect(screen.getByText("Negotiating")).toBeInTheDocument();
  });

  it("renders agreed status", () => {
    render(<StatusBadge status="agreed" />);
    expect(screen.getByText("Agreed")).toBeInTheDocument();
  });

  it("renders completed status", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders disputed status", () => {
    render(<StatusBadge status="disputed" />);
    expect(screen.getByText("Disputed")).toBeInTheDocument();
  });

  it("renders unknown status gracefully", () => {
    render(<StatusBadge status="some_unknown_status" />);
    expect(screen.getByText("some_unknown_status")).toBeInTheDocument();
  });
});

describe("SystemEventCard", () => {
  it("renders system event content", () => {
    render(
      <SystemEventCard
        content="Deal terms agreed. Contract has been generated."
        eventType="deal_agreed"
        timestamp="2026-03-23T10:00:00Z"
      />
    );
    expect(screen.getByText(/Deal terms agreed/)).toBeInTheDocument();
  });

  it("renders escrow funded event", () => {
    render(
      <SystemEventCard
        content="Escrow funded: $500.00 held securely."
        eventType="escrow_funded"
        timestamp="2026-03-23T10:00:00Z"
      />
    );
    expect(screen.getByText(/Escrow funded/)).toBeInTheDocument();
  });

  it("renders product shipped event", () => {
    render(
      <SystemEventCard
        content="Product shipped via FedEx. Tracking: 123456"
        eventType="product_shipped"
        timestamp="2026-03-23T10:00:00Z"
      />
    );
    expect(screen.getByText(/Product shipped/)).toBeInTheDocument();
  });
});
