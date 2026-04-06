import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tag, Video, Loader2 } from "lucide-react";

const OnboardingRole = () => {
  const { user, loading, onboardingCompleted, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth and onboarding guards are handled by OnboardingRoute in App.tsx

  const selectRole = async (role: "brand" | "creator") => {
    if (!user) return;
    try {
      // Set role via security definer function (populates user_roles table + profiles.role)
      const { error: rpcError } = await supabase.rpc("set_user_role", { _role: role });
      if (rpcError) throw rpcError;

      // Update onboarding step only (role is set by the RPC)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_step: `${role}-1` })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // Refresh auth context so ProtectedRoute sees the updated role and onboarding step
      await refreshProfile();

      navigate(`/onboarding/${role}`);
    } catch (err: any) {
      console.error("Role selection error:", err);
      toast({
        title: "Error setting role",
        description: err.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <Link to="/" className="text-xl font-bold text-foreground">GMV.live</Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Are you joining as a...?</h1>
        <p className="mb-10 text-muted-foreground">Choose your role to get started</p>

        <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => selectRole("brand")}
            className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-card-foreground transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Tag className="h-8 w-8" />
            </div>
            <span className="text-xl font-semibold">Brand</span>
            <span className="text-sm text-muted-foreground">I want to find live-shopping hosts</span>
          </button>

          <button
            onClick={() => selectRole("creator")}
            className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-card-foreground transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/10"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <Video className="h-8 w-8" />
            </div>
            <span className="text-xl font-semibold">Creator</span>
            <span className="text-sm text-muted-foreground">I want to host live shopping for brands</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingRole;
