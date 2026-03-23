import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "creator" | "brand";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const [{ data: roleData }, { data: profile }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("onboarding_completed, onboarding_step")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      setRole((roleData?.role as AppRole) ?? null);
      setOnboardingCompleted(!!profile?.onboarding_completed);
      setOnboardingStep(profile?.onboarding_step ?? null);
    } catch (error) {
      console.error("Failed to fetch profile state:", error);
      setRole(null);
      setOnboardingCompleted(false);
      setOnboardingStep(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        applySession(data.session);

        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
        } else {
          setRole(null);
          setOnboardingCompleted(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);

      if (!nextSession?.user) {
        setRole(null);
        setOnboardingCompleted(false);
        setLoading(false);
        return;
      }

      // Fire-and-forget to avoid deadlocks in auth event processing
      void fetchProfile(nextSession.user.id).finally(() => {
        if (isMounted) setLoading(false);
      });
    });

    void bootstrap();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setOnboardingCompleted(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, onboardingCompleted, onboardingStep, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
