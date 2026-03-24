import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Auth from "@/pages/Auth";

// Mock useAuth
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    onboardingCompleted: false,
    signUp: mockSignUp,
    signIn: mockSignIn,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const renderAuth = () =>
  render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );

describe("Auth Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup and login tabs", () => {
    renderAuth();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("renders GMB.live branding", () => {
    renderAuth();
    expect(screen.getByText("Welcome to GMB.live")).toBeInTheDocument();
    expect(screen.getByText("GMB.live")).toBeInTheDocument();
  });

  it("does not render Google OAuth button", () => {
    renderAuth();
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
  });

  it("shows name field on signup tab", () => {
    renderAuth();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("shows email and password fields on signup tab", () => {
    renderAuth();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls signUp with correct values", async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderAuth();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    const form = screen.getByText("Create Account").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123", "Test User");
    });
  });

  it("shows success toast after signup", async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderAuth();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    const form = screen.getByText("Create Account").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Check your email" })
      );
    });
  });

  it("shows error toast on signup failure", async () => {
    mockSignUp.mockRejectedValue(new Error("Email already taken"));
    renderAuth();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taken@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    const form = screen.getByText("Create Account").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sign-up failed",
          description: "Email already taken",
          variant: "destructive",
        })
      );
    });
  });

  it("shows Create Account and Log In buttons", () => {
    renderAuth();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderAuth();
    expect(screen.getByText("Connect brands with live-shopping hosts")).toBeInTheDocument();
  });
});
