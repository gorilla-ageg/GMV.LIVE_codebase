import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Tag, Video } from "lucide-react";

const OnboardingRole = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectRole = async (role: "brand" | "creator") => {
    if (!user) return;
    try {
      // Update profile role
      await supabase.from("profiles").update({ role, onboarding_step: `${role}-1` }).eq("id", user.id);
      // Set role via security definer function
      await supabase.rpc("set_user_role", { _role: role });
      await refreshProfile();
      navigate(`/onboarding/${role}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <Link to="/" className="text-xl font-bold text-foreground">🤩 gmv.live</Link>
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
