import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "creator" | "brand" | "admin";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  onboardingCompleted: boolean;
  onboardingStep: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function friendlyAuthError(error: { message: string }): string {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (msg.includes("email not confirmed")) return "Please verify your email before logging in. Check your inbox for a confirmation link.";
  if (msg.includes("user already registered") || msg.includes("already been registered")) return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("password") && msg.includes("at least")) return "Password must be at least 6 characters.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("network") || msg.includes("fetch")) return "Network error. Please check your connection and try again.";
  return error.message;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const [{ data: roleData }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed, onboarding_step").eq("id", userId).maybeSingle(),
    ]);
    setRole((roleData?.role as AppRole) ?? null);
    if (profile) {
      setOnboardingCompleted(!!profile.onboarding_completed);
      setOnboardingStep(profile.onboarding_step ?? null);
    } else {
      setOnboardingCompleted(false);
      setOnboardingStep(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const ensureProfile = useCallback(async (authUser: User) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();
    if (!existing) {
      const displayName =
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split("@")[0] ||
        "User";
      await supabase.from("profiles").insert({
        id: authUser.id,
        display_name: displayName,
        role: "creator" as const,
        onboarding_completed: false,
        onboarding_step: null,
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (error) console.error("Session error:", error);
        if (!isMounted) return;

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await ensureProfile(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setRole(null);
          setOnboardingCompleted(false);
          setOnboardingStep(null);
        }
      } catch (err) {
        console.error("Auth bootstrap error:", err);
        if (isMounted) {
          setRole(null);
          setOnboardingCompleted(false);
          setOnboardingStep(null);
        }
      } finally {
        // Only set loading=false AFTER session + profile are fully resolved
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;
      if (event === "INITIAL_SESSION") return; // bootstrap handles this

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setOnboardingCompleted(false);
        setOnboardingStep(null);
        setLoading(false);
        return;
      }

      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await ensureProfile(nextSession.user);
        }
        await fetchProfile(nextSession.user.id);
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    void bootstrap();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, ensureProfile]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch (err) { console.error("Sign-out error:", err); }
    setSession(null);
    setUser(null);
    setRole(null);
    setOnboardingCompleted(false);
    setOnboardingStep(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, onboardingCompleted, onboardingStep, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
