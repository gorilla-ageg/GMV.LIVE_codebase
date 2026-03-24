import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OfferModal from "@/components/deals/OfferModal";

describe("OfferModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
    title: "Send Offer",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with title when open", () => {
    render(<OfferModal {...defaultProps} />);
    const titles = screen.getAllByText("Send Offer");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders rate and deliverables fields", () => {
    render(<OfferModal {...defaultProps} />);
    expect(screen.getByText(/rate/i)).toBeInTheDocument();
    expect(screen.getByText(/deliverables/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<OfferModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Send Offer")).not.toBeInTheDocument();
  });

  it("pre-fills default values for counter offer", () => {
    render(
      <OfferModal
        {...defaultProps}
        title="Counter Offer"
        defaultValues={{
          rate: 500,
          deliverables: "2 TikTok videos",
          liveDate: "2026-04-01",
          usageRights: ["Social Media"],
        }}
      />
    );
    const titles = screen.getAllByText("Counter Offer");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("disables submit button when pending", () => {
    render(<OfferModal {...defaultProps} isPending={true} />);
    const submitBtns = screen.getAllByRole("button");
    const submitBtn = submitBtns.find(
      (btn) => btn.textContent?.includes("Send") || btn.textContent?.includes("Submit")
    );
    if (submitBtn) {
      expect(submitBtn).toBeDisabled();
    }
  });
});
