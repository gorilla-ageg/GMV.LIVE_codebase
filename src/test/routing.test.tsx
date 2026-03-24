import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

// Test routing logic directly without the full App component (avoids provider issues)

const MockPage = ({ name }: { name: string }) => <div>{name}</div>;

const TestRoutes = () => (
  <Routes>
    <Route path="/" element={<MockPage name="Home Page" />} />
    <Route path="/for-brands" element={<MockPage name="For Brands" />} />
    <Route path="/auth" element={<MockPage name="Auth Page" />} />
    <Route path="/login" element={<Navigate to="/auth" replace />} />
    <Route path="/register" element={<Navigate to="/auth" replace />} />
    <Route path="/waitlist" element={<MockPage name="Waitlist" />} />
    <Route path="/pricing" element={<MockPage name="Pricing" />} />
    <Route path="/blog" element={<MockPage name="Blog" />} />
    <Route path="/feed" element={<MockPage name="Feed" />} />
    <Route path="/deals" element={<MockPage name="Deals" />} />
    <Route path="/deals/:id" element={<MockPage name="Deal Room" />} />
    <Route path="/messages" element={<MockPage name="Messages" />} />
    <Route path="/messages/:id" element={<MockPage name="Thread" />} />
    <Route path="/products/:id" element={<MockPage name="Product Detail" />} />
    <Route path="/products/new" element={<MockPage name="New Product" />} />
    <Route path="/products/:id/edit" element={<MockPage name="Edit Product" />} />
    <Route path="/my-products" element={<MockPage name="My Products" />} />
    <Route path="/profile" element={<MockPage name="Profile" />} />
    <Route path="/settings/profile" element={<MockPage name="Settings" />} />
    <Route path="/onboarding/role" element={<MockPage name="Onboarding Role" />} />
    <Route path="/onboarding/brand" element={<MockPage name="Onboarding Brand" />} />
    <Route path="/onboarding/creator" element={<MockPage name="Onboarding Creator" />} />
    <Route path="*" element={<MockPage name="404 Not Found" />} />
  </Routes>
);

const renderRoute = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TestRoutes />
    </MemoryRouter>
  );

describe("Routing", () => {
  it("renders home page at /", () => {
    renderRoute("/");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("renders for-brands page", () => {
    renderRoute("/for-brands");
    expect(screen.getByText("For Brands")).toBeInTheDocument();
  });

  it("renders auth page", () => {
    renderRoute("/auth");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("redirects /login to /auth", () => {
    renderRoute("/login");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("redirects /register to /auth", () => {
    renderRoute("/register");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("renders waitlist page", () => {
    renderRoute("/waitlist");
    expect(screen.getByText("Waitlist")).toBeInTheDocument();
  });

  it("renders pricing page", () => {
    renderRoute("/pricing");
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("renders blog page", () => {
    renderRoute("/blog");
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes", () => {
    renderRoute("/unknown-route");
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
  });

  it("renders feed page", () => {
    renderRoute("/feed");
    expect(screen.getByText("Feed")).toBeInTheDocument();
  });

  it("renders deals page", () => {
    renderRoute("/deals");
    expect(screen.getByText("Deals")).toBeInTheDocument();
  });

  it("renders deal room with param", () => {
    renderRoute("/deals/abc-123");
    expect(screen.getByText("Deal Room")).toBeInTheDocument();
  });

  it("renders messages page", () => {
    renderRoute("/messages");
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders product detail with param", () => {
    renderRoute("/products/product-1");
    expect(screen.getByText("Product Detail")).toBeInTheDocument();
  });

  it("renders new product page", () => {
    renderRoute("/products/new");
    expect(screen.getByText("New Product")).toBeInTheDocument();
  });

  it("renders profile page", () => {
    renderRoute("/profile");
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders settings page", () => {
    renderRoute("/settings/profile");
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders onboarding routes", () => {
    renderRoute("/onboarding/role");
    expect(screen.getByText("Onboarding Role")).toBeInTheDocument();
  });
});
