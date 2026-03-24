import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

const ThrowingComponent = () => {
  throw new Error("Test error");
};

const WorkingComponent = () => <div>Working content</div>;

describe("ErrorBoundary", () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when no error", () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText("Working content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows refresh and home buttons on error", () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();
    expect(screen.getByText("Back to Home")).toBeInTheDocument();
  });
});
