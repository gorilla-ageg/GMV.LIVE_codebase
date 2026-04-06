import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredRole?: "creator" | "brand";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, role, loading, onboardingCompleted } = useAuth();

  // Step 1: Never do anything while loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 2: Not logged in → auth
  if (!user) return <Navigate to="/auth" replace />;

  // Step 3: Admin bypasses onboarding and role checks
  if (role === "admin") return <>{children}</>;

  // Step 4: Logged in but onboarding not done → onboarding
  if (!onboardingCompleted) return <Navigate to="/onboarding/role" replace />;

  // Step 5: Role check
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" replace />;

  // Step 6: All good
  return <>{children}</>;
};

export default ProtectedRoute;
