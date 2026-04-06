import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → auth
  if (!user) return <Navigate to="/auth" replace />;

  // Admin doesn't need onboarding
  if (role === "admin") return <Navigate to="/admin" replace />;

  // Already completed onboarding → dashboard
  if (onboardingCompleted) return <Navigate to="/dashboard" replace />;

  // In onboarding, render the page
  return <>{children}</>;
};

export default OnboardingRoute;
