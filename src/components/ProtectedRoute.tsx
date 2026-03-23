import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requiredRole?: "creator" | "brand";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, role, loading, onboardingCompleted, onboardingStep } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!onboardingCompleted) {
    // If user has started onboarding, redirect to the right step
    if (onboardingStep?.startsWith("creator")) {
      return <Navigate to="/onboarding/creator" replace />;
    }
    if (onboardingStep?.startsWith("brand")) {
      return <Navigate to="/onboarding/brand" replace />;
    }
    return <Navigate to="/onboarding/role" replace />;
  }

  if (requiredRole && role !== requiredRole) return <Navigate to="/feed" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
