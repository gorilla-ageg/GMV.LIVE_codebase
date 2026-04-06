import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredRole?: "creator" | "brand";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, role, loading, onboardingCompleted, onboardingStep } = useAuth();
  const location = useLocation();

  // Never redirect while loading — show spinner until auth is fully resolved
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Admins skip onboarding entirely — go straight to /admin
  if (role === "admin") {
    if (location.pathname.startsWith("/onboarding")) {
      return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
  }

  // If onboarding not done, redirect to the right onboarding step
  // But don't redirect if we're already on an onboarding page
  if (!onboardingCompleted && !location.pathname.startsWith("/onboarding")) {
    if (onboardingStep?.startsWith("creator")) {
      return <Navigate to="/onboarding/creator" replace />;
    }
    if (onboardingStep?.startsWith("brand")) {
      return <Navigate to="/onboarding/brand" replace />;
    }
    return <Navigate to="/onboarding/role" replace />;
  }

  // Completed users should never land on onboarding
  if (onboardingCompleted && location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
