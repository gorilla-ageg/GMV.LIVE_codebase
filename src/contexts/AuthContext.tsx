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
  if (msg.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (msg.includes("user already registered") || msg.includes("already been registered")) return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("password") && msg.includes("at least")) return "Password must be at least 6 characters.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "Too many attempts. Please wait a moment.";
  if (msg.includes("network") || msg.includes("fetch")) return "Network error. Check your connection.";
  if (msg.includes("suspended")) return "Your account has been suspended. Contact support@gmv.live";
  return error.message;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch role + onboarding in a SINGLE parallel batch.
   * Returns all state needed before we can route the user.
   */
  const loadProfile = useCallback(async (userId: string) => {
    // Both queries fire in parallel — one round trip
    const [{ data: roleData }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed, onboarding_step, suspended, role").eq("id", userId).maybeSingle(),
    ]);

    const suspended = !!(profile as Record<string, unknown>)?.suspended;
    if (suspended) {
      // Sign out first to prevent auth loop, then redirect
      await supabase.auth.signOut();
      window.location.href = "/suspended";
      throw new Error("suspended");
    }

    // Admin role is stored in profiles.role (not in user_roles which only has creator/brand)
    const profileRole = (profile as Record<string, unknown>)?.role as string | null;
    const resolvedRole: AppRole | null = profileRole === "admin"
      ? "admin"
      : (roleData?.role as AppRole) ?? null;

    return {
      role: resolvedRole,
      onboardingCompleted: !!profile?.onboarding_completed,
      onboardingStep: profile?.onboarding_step ?? null,
    };
  }, []);

  const applyProfile = useCallback((state: { role: AppRole | null; onboardingCompleted: boolean; onboardingStep: string | null }) => {
    setRole(state.role);
    setOnboardingCompleted(state.onboardingCompleted);
    setOnboardingStep(state.onboardingStep);
  }, []);

  const clearAll = useCallback(() => {
    setSession(null);
    setUser(null);
    setRole(null);
    setOnboardingCompleted(false);
    setOnboardingStep(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const state = await loadProfile(currentUser.id);
    applyProfile(state);
  }, [loadProfile, applyProfile]);

  useEffect(() => {
    let mounted = true;

    // Handle auth state changes (login, logout, token refresh)
    // IMPORTANT: The callback must NOT be async or await Supabase calls inline.
    // Supabase JS v2 waits for the callback to finish before resolving
    // signInWithPassword, which creates a deadlock if the callback makes
    // additional Supabase requests. Defer async work with setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        // No session = logged out
        if (!currentSession) {
          clearAll();
          setLoading(false);
          return;
        }

        // Set session + user immediately (fast, no network)
        setSession(currentSession);
        setUser(currentSession.user);

        // Defer profile fetch to avoid deadlock with signInWithPassword
        setTimeout(async () => {
          try {
            const state = await loadProfile(currentSession.user.id);
            if (mounted) {
              applyProfile(state);
              setLoading(false);
            }
          } catch (err) {
            console.error("Profile load error:", err);
            if (mounted) {
              clearAll();
              setLoading(false);
            }
          }
        }, 0);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadProfile, applyProfile, clearAll]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw new Error(friendlyAuthError(error));
    }
    // onAuthStateChange will handle setting user + profile + loading=false
  };

  const signOut = async () => {
    // Clear state first so UI updates immediately
    clearAll();
    setLoading(false);
    try { await supabase.auth.signOut(); } catch (err) { console.error("Sign-out error:", err); }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, onboardingCompleted, onboardingStep, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
